"""
实现逻辑：
1. 启动 Playwright 可见浏览器并打开指定平台登录页。
2. 等待 API 侧写入 confirm 文件，表示用户已手动完成登录。
3. 保存 storage_state 和基础账号信息，供 API 创建账号使用。
"""

import argparse
import json
import re
import subprocess
import time
from datetime import datetime
from pathlib import Path

from playwright.sync_api import Error, TimeoutError as PlaywrightTimeoutError, sync_playwright


CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--session-id", required=True)
    parser.add_argument("--platform", required=True)
    parser.add_argument("--login-url", required=True)
    parser.add_argument("--state-path", required=True)
    parser.add_argument("--session-dir", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    session_dir = Path(args.session_dir)
    session_dir.mkdir(parents=True, exist_ok=True)
    result_file = session_dir / "result.json"
    confirm_file = session_dir / "confirm"
    state_path = Path(args.state_path)
    state_path.parent.mkdir(parents=True, exist_ok=True)
    user_data_dir = session_dir / "browser_profile"

    try:
        with sync_playwright() as playwright:
            browser_type = playwright.chromium
            append_log(session_dir, "starting browser")
            try:
                launch_options = {
                    "headless": False,
                    "viewport": {"width": 1440, "height": 900},
                    "args": ["--new-window", "--disable-blink-features=AutomationControlled"],
                    "timeout": 30000,
                }
                if Path(CHROME_EXECUTABLE).exists():
                    launch_options["executable_path"] = CHROME_EXECUTABLE
                context = browser_type.launch_persistent_context(
                    str(user_data_dir),
                    **launch_options,
                )
            except Error:
                append_log(session_dir, "fallback to bundled chromium")
                context = browser_type.launch_persistent_context(
                    str(user_data_dir),
                    headless=False,
                    viewport={"width": 1440, "height": 900},
                    args=["--new-window"],
                    timeout=30000,
                )

            page = context.pages[0] if context.pages else context.new_page()
            append_log(session_dir, f"goto {args.login_url}")
            page.goto(args.login_url, wait_until="domcontentloaded", timeout=60000)
            bring_chrome_to_front()
            append_log(session_dir, "waiting confirm")

            deadline = time.time() + 20 * 60
            while time.time() < deadline:
                if confirm_file.exists():
                    append_log(session_dir, "confirm received")
                    account = extract_account_info(page, args.platform, args.session_id)
                    context.storage_state(path=str(state_path))
                    write_result(
                        result_file,
                        {
                            "success": True,
                            "account": account,
                            "login_at": datetime.utcnow().isoformat(),
                        },
                    )
                    context.close()
                    return
                time.sleep(0.5)

            write_result(
                result_file,
                {
                    "success": False,
                    "error_message": "登录等待超时，请重新打开登录页",
                },
            )
            context.close()
    except Exception as e:
        append_log(session_dir, f"error: {e}")
        write_result(result_file, {"success": False, "error_message": str(e)})


def extract_account_info(page, platform: str, session_id: str) -> dict[str, str]:
    if platform == "toutiao":
        toutiao_info = extract_toutiao_account_info(page)
        if toutiao_info.get("nickname") or toutiao_info.get("uid"):
            return {
                "nickname": toutiao_info.get("nickname") or f"{platform}账号",
                "uid": toutiao_info.get("uid") or f"{platform}_{session_id[:8]}",
            }
    if platform == "xiaohongshu":
        xiaohongshu_info = extract_xiaohongshu_account_info(page)
        if xiaohongshu_info.get("nickname") or xiaohongshu_info.get("uid"):
            return {
                "nickname": xiaohongshu_info.get("nickname") or "小红书账号",
                "uid": xiaohongshu_info.get("uid") or f"{platform}_{session_id[:8]}",
            }

    title = ""
    try:
        title = page.title().strip()
    except Exception:
        pass

    nickname = title.replace(" - ", " ").split(" ")[0].strip() if title else ""
    if not nickname or nickname in {"首页", "登录", "创作平台"}:
        nickname = platform_display_name(platform)

    uid = ""
    try:
        cookies = page.context.cookies()
        for cookie in cookies:
            if cookie.get("name") in {"uid", "user_id", "sso_uid_tt", "sso_uid_tt_ss"}:
                uid = cookie.get("value", "")
                break
    except Exception:
        pass
    if not uid:
        uid = f"{platform}_{session_id[:8]}"

    return {"nickname": nickname, "uid": uid}


def extract_xiaohongshu_account_info(page) -> dict[str, str]:
    try:
        page.goto("https://www.xiaohongshu.com/explore", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2500)
    except Exception:
        pass

    uid = extract_xiaohongshu_self_uid_from_profile_link(page)
    if not uid:
        uid = extract_xiaohongshu_uid_from_cookies(page)

    nickname = ""
    if uid:
        nickname = extract_xiaohongshu_profile_nickname(page, uid)
    if not nickname:
        nickname = "小红书账号"

    return {"nickname": nickname, "uid": uid}


def extract_xiaohongshu_self_uid_from_profile_link(page) -> str:
    try:
        links = page.locator("a[href*='/user/profile/']").evaluate_all(
            """
            els => els.map(el => ({
                href: el.href || "",
                text: (el.textContent || "").trim()
            })).filter(item => item.href)
            """
        )
    except Exception:
        return ""

    for link in links:
        href = link.get("href", "")
        text = link.get("text", "")
        if text != "我":
            continue
        match = re.search(r"/user/profile/([^/?#]+)", href)
        if match:
            return match.group(1)
    return ""


def extract_xiaohongshu_profile_nickname(page, uid: str) -> str:
    try:
        page.goto(f"https://www.xiaohongshu.com/user/profile/{uid}", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2500)
    except Exception:
        pass

    nickname = first_text(
        page,
        [
            ".user-name",
            "[class*='user-name']",
            "[class*='nickname']",
            "[class*='nickName']",
            "h1",
        ],
        timeout=2000,
    )
    if not valid_xiaohongshu_nickname(nickname):
        nickname = extract_xiaohongshu_nickname_from_title(page)
    return nickname if valid_xiaohongshu_nickname(nickname) else ""


def extract_xiaohongshu_nickname_from_title(page) -> str:
    try:
        title = page.title().strip()
    except Exception:
        return ""
    return title.replace(" - 小红书", "").strip()


def valid_xiaohongshu_nickname(value: str) -> bool:
    if not value:
        return False
    if len(value) > 40:
        return False
    return value not in {"我", "首页", "登录", "小红书", "小红书账号"}


def extract_xiaohongshu_uid_from_cookies(page) -> str:
    try:
        cookies = page.context.cookies()
    except Exception:
        return ""

    for cookie in cookies:
        if cookie.get("name") in {"userId", "userid", "uid", "web_session"}:
            value = cookie.get("value", "")
            if value:
                return value[:128]
    return ""


def platform_display_name(platform: str) -> str:
    names = {
        "toutiao": "头条号账号",
        "baijiahao": "百家号账号",
        "weixin": "微信公众号账号",
        "qiehao": "企鹅号账号",
        "xiaohongshu": "小红书账号",
    }
    return names.get(platform, f"{platform}账号")


def extract_toutiao_account_info(page) -> dict[str, str]:
    nickname = ""
    uid = ""

    try:
        page.goto("https://mp.toutiao.com/profile_v4/index", wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(2500)
    except Exception:
        pass

    nickname = first_text(page, [".auth-avator-name", ".author-name", ".account-name"])
    uid = extract_toutiao_uid_from_profile_link(page)
    if uid:
        return {"nickname": nickname, "uid": uid}

    uid = clean_toutiao_uid(
        first_text(
            page,
            [
                (
                    "xpath=//*[@id=\"root\"]/div/div[3]/div/div[2]/div[1]/div/div[2]/div[2]/div[2]"
                    "/div/div/div/div/div[3]/div/div/div[1]"
                ),
                "text=/复制ID/",
            ],
        )
    )

    if not uid:
        uid = extract_uid_from_page_text(page)

    return {"nickname": nickname, "uid": uid}


def extract_toutiao_uid_from_profile_link(page) -> str:
    try:
        hrefs = page.locator("a[href*='/c/user/']").evaluate_all(
            "els => els.map(el => el.href || '').filter(Boolean)"
        )
    except Exception:
        return ""

    for href in hrefs:
        match = re.search(r"/c/user/(\d+)/?", href)
        if match:
            return match.group(1)
    return ""


def first_text(page, selectors: list[str], timeout: int = 5000) -> str:
    for selector in selectors:
        try:
            text = page.locator(selector).first.text_content(timeout=timeout)
            if text and text.strip():
                return text.strip()
        except (PlaywrightTimeoutError, Error):
            continue
        except Exception:
            continue
    return ""


def clean_toutiao_uid(value: str) -> str:
    return (
        value.replace("复制ID", "")
        .replace("复制", "")
        .replace("ID", "")
        .replace("：", "")
        .replace(":", "")
        .replace("\n", "")
        .replace("\t", "")
        .strip()
    )


def extract_uid_from_page_text(page) -> str:
    try:
        text = page.locator("body").inner_text(timeout=5000)
    except Exception:
        return ""

    for line in text.splitlines():
        if "复制ID" not in line and "ID" not in line:
            continue
        uid = clean_toutiao_uid(line)
        if uid and 4 <= len(uid) <= 64:
            return uid
    return ""


def write_result(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def append_log(session_dir: Path, message: str) -> None:
    log_path = session_dir / "worker.log"
    log_path.write_text(
        log_path.read_text(encoding="utf-8") + f"{datetime.utcnow().isoformat()} {message}\n"
        if log_path.exists()
        else f"{datetime.utcnow().isoformat()} {message}\n",
        encoding="utf-8",
    )


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
