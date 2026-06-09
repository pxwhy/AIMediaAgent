"""
实现逻辑：
1. 使用已保存的小红书 storage_state 打开图文发布页。
2. 下载草稿图片并填充标题、正文，自动发布时只点击真实发布控件。
3. 通过成功提示或成功页 URL 确认发布结果，并写入 result.json 供 API 更新状态。
"""

import argparse
import json
import subprocess
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import requests
from playwright.sync_api import Error, TimeoutError as PlaywrightTimeoutError, sync_playwright


CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
XIAOHONGSHU_PUBLISH_URL = "https://creator.xiaohongshu.com/publish/publish?source=official&from=menu&target=image"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--state-path", required=True)
    parser.add_argument("--title", required=True)
    parser.add_argument("--content", required=True)
    parser.add_argument("--result-file", required=True)
    parser.add_argument("--images-json", default="[]")
    parser.add_argument("--auto-publish", action="store_true")
    parser.add_argument("--keep-open-seconds", type=int, default=7200)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result_file = Path(args.result_file)
    result_file.parent.mkdir(parents=True, exist_ok=True)
    image_urls = json.loads(args.images_json)
    image_paths = download_images(image_urls, result_file.parent / "images")
    if not image_paths:
        write_result(result_file, {"success": False, "error_message": "小红书图片发布至少需要 1 张可上传图片"})
        return

    try:
        with sync_playwright() as playwright:
            launch_options = {
                "headless": False,
                "timeout": 30000,
                "args": ["--new-window", "--disable-blink-features=AutomationControlled"],
            }
            if Path(CHROME_EXECUTABLE).exists():
                launch_options["executable_path"] = CHROME_EXECUTABLE

            browser = playwright.chromium.launch(**launch_options)
            context = browser.new_context(
                storage_state=args.state_path,
                viewport={"width": 1440, "height": 900},
            )
            page = context.new_page()
            page.goto(XIAOHONGSHU_PUBLISH_URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(4000)
            bring_chrome_to_front()

            upload_images(page, image_paths)
            fill_title(page, args.title)
            fill_content(page, args.content)
            published = False
            if args.auto_publish:
                publish_to_xiaohongshu(page, result_file.parent)
                published = True

            write_result(
                result_file,
                {
                    "success": True,
                    "published": published,
                    "platform_url": page.url,
                    "message": "已自动发布到小红书" if published else "已打开小红书发布页并填充内容，请人工确认后发布",
                    "images_count": len(image_paths),
                    "filled_at": datetime.now(UTC).isoformat(),
                },
            )
            if not args.auto_publish:
                keep_browser_open(page, args.keep_open_seconds)
    except Exception as e:
        write_result(result_file, {"success": False, "error_message": str(e)})


def upload_images(page, image_paths: list[Path]) -> None:
    file_input = page.locator("input[type='file']").first
    try:
        file_input.set_input_files([str(path) for path in image_paths], timeout=10000)
    except Exception:
        click_upload_entry(page)
        file_input.set_input_files([str(path) for path in image_paths], timeout=15000)

    wait_upload_finished(page, len(image_paths))


def click_upload_entry(page) -> None:
    locators = [
        page.get_by_text("上传图片", exact=False).first,
        page.get_by_text("上传图文", exact=False).first,
        page.get_by_text("选择图片", exact=False).first,
        page.locator("[class*='upload']").first,
    ]
    for locator in locators:
        try:
            locator.wait_for(state="visible", timeout=5000)
            locator.click()
            return
        except Exception:
            continue
    raise RuntimeError("未找到小红书图片上传入口")


def wait_upload_finished(page, expected_count: int) -> None:
    deadline = time.time() + 90
    while time.time() < deadline:
        try:
            text = page.locator("body").inner_text(timeout=3000)
            if "上传失败" in text:
                raise RuntimeError("小红书图片上传失败")
            if "上传中" not in text and "处理中" not in text:
                return
        except RuntimeError:
            raise
        except Exception:
            pass
        page.wait_for_timeout(1500)
    raise RuntimeError(f"等待小红书图片上传完成超时，共 {expected_count} 张")


def fill_title(page, title: str) -> None:
    selectors = [
        "input[placeholder*='标题']",
        "textarea[placeholder*='标题']",
        "[contenteditable='true'][placeholder*='标题']",
        "[class*='title'] input",
        "[class*='title'] textarea",
    ]
    fill_first_match(page, selectors, title[:20], "未找到小红书标题输入框")


def fill_content(page, content: str) -> None:
    if fill_xiaohongshu_content_editor(page, content):
        return
    selectors = [
        "textarea[placeholder*='正文']",
        "textarea[placeholder*='描述']",
        "textarea[placeholder*='分享']",
        "[contenteditable='true']",
        "[class*='content'] textarea",
        "[class*='desc'] textarea",
    ]
    fill_first_match(page, selectors, content, "未找到小红书正文输入框")


def fill_xiaohongshu_content_editor(page, content: str) -> bool:
    locator = page.locator(
        "#web > div > div > div.publish-page-container > div > div > div.publish-page-content "
        "> div.publish-page-content-base > div > div.editor-container > div.editor-content > div > div"
    ).first
    try:
        locator.wait_for(state="visible", timeout=8000)
        locator.click(timeout=3000)
        locator.evaluate(
            """
            (element, value) => {
              element.focus();
              if (element.isContentEditable) {
                element.textContent = value;
              } else if ('value' in element) {
                element.value = value;
              } else {
                element.textContent = value;
              }
              element.dispatchEvent(new InputEvent('input', {
                bubbles: true,
                inputType: 'insertText',
                data: value
              }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
            """,
            content,
        )
        print("[xiaohongshu] filled specified content editor", flush=True)
        return True
    except Exception:
        return False


def fill_first_match(page, selectors: list[str], value: str, error_message: str) -> None:
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            locator.wait_for(state="visible", timeout=8000)
            locator.click()
            locator.fill(value)
            return
        except (PlaywrightTimeoutError, Error):
            continue
        except Exception:
            continue
    raise RuntimeError(error_message)


def publish_to_xiaohongshu(page, run_dir: Path) -> None:
    detect_xiaohongshu_verification(page)
    take_screenshot(page, run_dir / "before_publish_click.png")
    page.wait_for_timeout(2000)
    click_publish_button(page)
    page.wait_for_timeout(2500)
    take_screenshot(page, run_dir / "after_publish_click.png")
    detect_xiaohongshu_verification(page)
    click_confirm_publish_if_needed(page)
    page.wait_for_timeout(1000)
    take_screenshot(page, run_dir / "after_confirm_click.png")
    wait_publish_result(page)


def click_publish_button(page) -> None:
    locator = page.locator(
        "#web > div > div > div.publish-page-container > div > div > div.publish-page-content > xhs-publish-btn "
        "[submit-text='发布'] button.ce-btn.bg-red"
    ).last
    try:
        locator.wait_for(state="visible", timeout=15000)
        if not locator.is_enabled(timeout=3000):
            raise RuntimeError("指定小红书发布按钮不可点击")
        locator.scroll_into_view_if_needed(timeout=3000)
        locator.click(timeout=8000)
        print("[xiaohongshu] clicked specified publish button", flush=True)
    except Exception as e:
        raise RuntimeError("未找到指定小红书发布按钮") from e

def click_confirm_publish_if_needed(page) -> None:
    locators = [
        page.get_by_text("确认发布", exact=False).last,
        page.get_by_text("确定发布", exact=False).last,
        page.get_by_text("确认", exact=True).last,
        page.locator("button").filter(has_text="确认").last,
        page.locator("button").filter(has_text="确定").last,
    ]
    for locator in locators:
        try:
            locator.wait_for(state="visible", timeout=4000)
            if locator.is_enabled(timeout=2000):
                locator.click()
            return
        except Exception:
            continue


def wait_publish_result(page) -> None:
    success_patterns = ["发布成功", "发布完成", "发布笔记成功"]
    failure_patterns = ["发布失败", "请上传", "请填写", "审核不通过", "操作失败"]
    deadline = time.time() + 60
    while time.time() < deadline:
        detect_xiaohongshu_verification(page)
        try:
            text = page.locator("body").inner_text(timeout=3000)
            if any(pattern in text for pattern in success_patterns):
                return
            for pattern in failure_patterns:
                if pattern in text:
                    raise RuntimeError(f"小红书发布失败：{pattern}")
            if page.url and any(part in page.url for part in ["/publish/success", "/manage"]):
                return
        except RuntimeError:
            raise
        except Exception:
            pass
        page.wait_for_timeout(1500)
    raise RuntimeError("等待小红书发布结果超时")


def take_screenshot(page, path: Path) -> None:
    try:
        page.screenshot(path=str(path), full_page=True, timeout=5000)
    except Exception:
        return


def detect_xiaohongshu_verification(page) -> None:
    try:
        text = page.locator("body").inner_text(timeout=3000)
    except Exception:
        return
    verification_patterns = ["验证码", "滑块", "验证", "安全验证", "环境异常", "操作频繁"]
    for pattern in verification_patterns:
        if pattern in text:
            raise RuntimeError(f"小红书出现验证或风控提示：{pattern}")


def download_images(image_urls: list[str], image_dir: Path) -> list[Path]:
    image_dir.mkdir(parents=True, exist_ok=True)
    image_paths: list[Path] = []
    for index, url in enumerate(image_urls[:9], start=1):
        if not should_download_image(url):
            continue
        try:
            response = requests.get(
                url,
                timeout=20,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            response.raise_for_status()
            if len(response.content) < 4096:
                continue
            suffix = image_suffix(response.headers.get("content-type", ""), url)
            path = image_dir / f"image_{index}{suffix}"
            path.write_bytes(response.content)
            image_paths.append(path)
        except Exception:
            continue
    return image_paths


def should_download_image(url: str) -> bool:
    path = urlparse(url).path.lower()
    if not path:
        return False
    return not path.endswith("/t.png")


def image_suffix(content_type: str, url: str) -> str:
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    path_suffix = Path(urlparse(url).path).suffix.lower()
    if path_suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return path_suffix
    return ".jpg"


def write_result(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def keep_browser_open(page, keep_open_seconds: int) -> None:
    deadline = time.time() + keep_open_seconds
    while time.time() < deadline:
        try:
            if page.is_closed():
                return
            page.wait_for_timeout(1000)
        except Exception:
            return


def bring_chrome_to_front() -> None:
    try:
        subprocess.run(
            ["osascript", "-e", 'tell application "Google Chrome" to activate'],
            check=False,
            timeout=3,
        )
    except Exception:
        pass


if __name__ == "__main__":
    main()
