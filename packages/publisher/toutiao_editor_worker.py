"""
实现逻辑：
1. 使用已保存的头条号 storage_state 打开图文发布页。
2. 自动填充标题、正文和图片，自动发布时复用头条号稳定发布按钮并执行二次确认点击。
3. 通过截图、按钮日志和成功页判断发布结果，并写入 result.json 供 API 更新状态。
"""

import argparse
import json
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlparse

import requests
from playwright.sync_api import Error, TimeoutError as PlaywrightTimeoutError, sync_playwright


CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TOUTIAO_PUBLISH_URL = "https://mp.toutiao.com/profile_v4/graphic/publish"


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
            page.goto(TOUTIAO_PUBLISH_URL, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3000)

            fill_title(page, args.title)
            fill_content(page, args.content)
            upload_images(page, image_paths)
            published = False
            if args.auto_publish:
                publish_to_toutiao(page, result_file.parent)
                published = True

            write_result(
                result_file,
                {
                    "success": True,
                    "published": published,
                    "platform_url": page.url,
                    "message": "已自动发布到头条号" if published else "已打开头条号发布页并填充内容，请人工确认后发布",
                    "images_count": len(image_paths),
                    "filled_at": datetime.now(UTC).isoformat(),
                },
            )
            if not args.auto_publish:
                keep_browser_open(page, args.keep_open_seconds)
    except Exception as e:
        write_result(result_file, {"success": False, "error_message": str(e)})


def fill_title(page, title: str) -> None:
    selectors = [
        "textarea[placeholder*='标题']",
        "textarea",
        "xpath=//*[@id='root']/div/div[1]/div/div[1]/div[3]/div/div/div[2]/div/div/div/textarea",
    ]
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            locator.wait_for(state="visible", timeout=8000)
            locator.fill(title[:80])
            return
        except (PlaywrightTimeoutError, Error):
            continue
        except Exception:
            continue
    raise RuntimeError("未找到头条号标题输入框")


def fill_content(page, content: str) -> None:
    selectors = [
        "[contenteditable='true']",
        "div.ProseMirror",
        "xpath=//*[@id='root']/div/div[1]/div/div[1]/div[4]/div/div[1]",
    ]
    for selector in selectors:
        try:
            locator = page.locator(selector).first
            locator.wait_for(state="visible", timeout=8000)
            locator.click()
            locator.fill(content)
            return
        except (PlaywrightTimeoutError, Error):
            continue
        except Exception:
            continue
    raise RuntimeError("未找到头条号正文编辑区")


def upload_images(page, image_paths: list[Path]) -> None:
    if not image_paths:
        return

    editor = page.locator("[contenteditable='true']").first
    try:
        editor.click(timeout=5000)
        page.keyboard.press("End")
    except Exception:
        pass

    page.locator(".syl-toolbar-tool.image.static").first.click(timeout=8000)
    page.locator("input[type='file'][accept='image/*']").first.set_input_files(
        [str(path) for path in image_paths]
    )
    page.get_by_text(f"已上传 {len(image_paths)} 张图片", exact=False).wait_for(timeout=60000)
    page.locator(".byte-drawer-wrapper button").filter(has_text="确定").last.click(timeout=10000)
    page.wait_for_timeout(3000)


def publish_to_toutiao(page, run_dir: Path) -> None:
    handle_publish_options(page)
    take_screenshot(page, run_dir / "before_publish_click.png")
    page.wait_for_timeout(2000)
    click_publish_button(page)
    page.wait_for_timeout(2500)
    take_screenshot(page, run_dir / "after_first_publish_click.png")
    click_publish_button(page)
    page.wait_for_timeout(2500)
    take_screenshot(page, run_dir / "after_second_publish_click.png")
    wait_publish_result(page)


def click_publish_button(page) -> None:
    print_publish_button_debug(page)
    locators = [
        page.locator(".publish-btn-last").last,
        page.get_by_role("button", name="发布").last,
        page.locator("button").filter(has_text="发布").last,
    ]
    for locator in locators:
        try:
            locator.wait_for(state="visible", timeout=10000)
            locator.scroll_into_view_if_needed(timeout=3000)
            if not locator.is_enabled(timeout=2000):
                continue
            locator.click(timeout=8000)
            return
        except Exception:
            continue
    raise RuntimeError("未找到头条号发布按钮")


def print_publish_button_debug(page) -> None:
    try:
        buttons = page.locator(".publish-btn-last")
        count = buttons.count()
        print(f"[toutiao] publish button candidates: {count}", flush=True)
        for index in range(min(count, 5)):
            button = buttons.nth(index)
            print(
                "[toutiao] publish button "
                f"#{index}: visible={button.is_visible(timeout=1000)} "
                f"enabled={button.is_enabled(timeout=1000)} "
                f"text={button.inner_text(timeout=1000)!r} "
                f"class={button.get_attribute('class', timeout=1000)!r}",
                flush=True,
            )
    except Exception as e:
        print(f"[toutiao] publish button debug failed: {e}", flush=True)


def handle_publish_options(page) -> None:
    page.wait_for_timeout(1000)
    option_handlers = [
        enable_ad_revenue_option,
        enable_toutiao_first_option,
        enable_personal_opinion_option,
    ]
    for handler in option_handlers:
        try:
            handler(page)
        except Exception as e:
            print(f"[toutiao] publish option handler failed: {handler.__name__}: {e}", flush=True)


def enable_ad_revenue_option(page) -> None:
    blocks = page.locator(".edit-input").filter(has_text="投放广告赚收益")
    for index in range(min(blocks.count(), 3)):
        block = blocks.nth(index)
        text = block.inner_text(timeout=1000)
        if "投放广告赚收益" not in text:
            continue
        radios = block.locator(".byte-radio-inner")
        if radios.count() > 0:
            radios.first.click(timeout=3000)
            print("[toutiao] selected ad revenue option", flush=True)
            return


def enable_toutiao_first_option(page) -> None:
    blocks = page.locator(".edit-input").filter(has_text="头条首发")
    for index in range(min(blocks.count(), 3)):
        block = blocks.nth(index)
        block.scroll_into_view_if_needed(timeout=3000)
        text = block.inner_text(timeout=1000)
        if "授权平台自动维权" in text:
            return
        checkbox = block.locator(".byte-checkbox-wrapper").first
        if checkbox.count() > 0:
            checkbox.click(timeout=3000)
            print("[toutiao] enabled toutiao first option", flush=True)
            return


def enable_personal_opinion_option(page) -> None:
    blocks = page.locator(".edit-input").filter(has_text="个人观点")
    for index in range(min(blocks.count(), 3)):
        block = blocks.nth(index)
        block.scroll_into_view_if_needed(timeout=3000)
        labels = block.locator("label").filter(has_text="个人观点，仅供参考")
        for label_index in range(min(labels.count(), 5)):
            label = labels.nth(label_index)
            class_name = label.get_attribute("class", timeout=1000) or ""
            if "checked" in class_name:
                return
            wrapper = label.locator(".byte-checkbox-wrapper").first
            if wrapper.count() > 0:
                wrapper.click(timeout=3000)
                print("[toutiao] enabled personal opinion option", flush=True)
                return


def wait_publish_result(page) -> None:
    success_patterns = ["发布成功", "发表成功", "发布完成", "已发布", "作品管理"]
    failure_patterns = ["发布失败", "请填写", "请上传", "审核不通过", "操作失败"]
    deadline = time.time() + 45
    while time.time() < deadline:
        try:
            text = page.locator("body").inner_text(timeout=3000)
            if any(pattern in text for pattern in success_patterns):
                return
            for pattern in failure_patterns:
                if pattern in text:
                    raise RuntimeError(f"头条号发布失败：{pattern}")
            if page.url and "manage" in page.url:
                return
        except RuntimeError:
            raise
        except Exception:
            pass
        page.wait_for_timeout(1500)
    raise RuntimeError("等待头条号发布结果超时")


def take_screenshot(page, path: Path) -> None:
    try:
        page.screenshot(path=str(path), full_page=True, timeout=5000)
    except Exception:
        return


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
    if "gif" in content_type:
        return ".gif"
    path_suffix = Path(urlparse(url).path).suffix.lower()
    if path_suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
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


if __name__ == "__main__":
    main()
