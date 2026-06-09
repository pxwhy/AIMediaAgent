"""
实现逻辑：
1. 使用已保存的头条号 storage_state 打开内容管理页。
2. 从作品列表提取标题、链接、状态与基础指标，再打开详情页同步正文。
3. 将同步结果写入 result.json，供 API 服务按平台作品 ID 去重入库。
"""

import argparse
import json
import re
from datetime import UTC, datetime
from pathlib import Path

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError, sync_playwright


CHROME_EXECUTABLE = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
TOUTIAO_WORK_URLS = [
    "https://mp.toutiao.com/profile_v4/manage/content/all",
    "https://mp.toutiao.com/profile_v4/content/manage",
    "https://mp.toutiao.com/",
]
NAVIGATION_TITLES = {
    "全部",
    "文章",
    "作品管理",
    "收益数据",
    "功能实验室",
    "西瓜视频",
    "微头条",
    "问答",
    "草稿箱",
    "状态",
    "创作权益",
}
MAX_CONTENT_SYNC_COUNT = 20


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--state-path", required=True)
    parser.add_argument("--result-file", required=True)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    result_file = Path(args.result_file)
    result_file.parent.mkdir(parents=True, exist_ok=True)

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
            works = open_and_extract_works(page)
            fill_work_contents(context, works)
            write_result(
                result_file,
                {
                    "success": True,
                    "works": works,
                    "message": f"已同步 {len(works)} 条头条号作品",
                    "synced_at": datetime.now(UTC).isoformat(),
                },
            )
            context.close()
            browser.close()
    except Exception as e:
        write_result(result_file, {"success": False, "error_message": str(e)})


def open_and_extract_works(page) -> list[dict]:
    last_error = ""
    for url in TOUTIAO_WORK_URLS:
        try:
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            page.wait_for_timeout(3500)
            click_content_manage_if_needed(page)
            works = extract_works(page)
            if works:
                return works
        except Exception as e:
            last_error = str(e)
            print(f"[toutiao-works] extract failed on {url}: {e}", flush=True)

    if last_error:
        raise RuntimeError(f"未能从头条号内容管理页提取作品：{last_error}")
    raise RuntimeError("未能从头条号内容管理页提取作品")


def click_content_manage_if_needed(page) -> None:
    candidates = ["内容管理", "作品管理", "全部作品"]
    for text in candidates:
        try:
            page.get_by_text(text, exact=True).first.click(timeout=3000)
            page.wait_for_timeout(2500)
            return
        except PlaywrightTimeoutError:
            continue
        except Exception:
            continue


def extract_works(page) -> list[dict]:
    page.wait_for_timeout(1000)
    works = page.evaluate(
        """
        () => {
          const normalize = (text) => (text || '').replace(/\\s+/g, ' ').trim();
          const metricValue = (text, labels) => {
            for (const label of labels) {
              const pattern = new RegExp(label + '\\\\s*[:：]?\\\\s*([0-9,.万kK+-]+)');
              const match = text.match(pattern);
              if (match) return match[1];
            }
            return '';
          };
          const titleFromNode = (node, link) => {
            const titleNode = node.querySelector('[class*=title], [class*=Title], h3, h4');
            const title = normalize(titleNode?.innerText || titleNode?.textContent);
            if (title) return title;
            return normalize(link?.innerText || link?.textContent).slice(0, 120);
          };
          const statusFromText = (text) => {
            const statuses = ['已发布', '审核中', '未通过', '仅我可见', '草稿', '推荐中'];
            return statuses.find((item) => text.includes(item)) || '';
          };
          const ignoredTitles = new Set(['全部', '文章', '作品管理', '收益数据', '功能实验室', '西瓜视频', '微头条', '问答', '草稿箱', '状态', '创作权益']);
          const hasUsefulMetric = (metrics) => Object.values(metrics).some((value) => value !== '');
          const items = [];
          const seen = new Set();
          const containers = Array.from(document.querySelectorAll(
            '.byte-table-row, [class*=article], [class*=Article], [class*=content], [class*=Content], [class*=work], [class*=Work], li'
          ));
          for (const node of containers) {
            const text = normalize(node.innerText || node.textContent);
            if (!text || text.length < 4) continue;
            const link = Array.from(node.querySelectorAll('a[href]')).find((item) => {
              const href = item.href || '';
              return href.includes('toutiao.com') || href.includes('mp.toutiao.com');
            });
            const title = titleFromNode(node, link);
            const url = link?.href || '';
            if (!title || ignoredTitles.has(title) || !url || !/^https?:\\/\\//.test(url)) continue;
            const metrics = {
              views: metricValue(text, ['阅读', '展现', '播放']),
              likes: metricValue(text, ['点赞', '赞']),
              comments: metricValue(text, ['评论']),
              favorites: metricValue(text, ['收藏']),
              shares: metricValue(text, ['分享']),
              revenue: metricValue(text, ['收益'])
            };
            const status = statusFromText(text);
            if (!url && !status && !hasUsefulMetric(metrics)) continue;
            const key = url || title;
            if (seen.has(key)) continue;
            seen.add(key);
            items.push({
              platform_work_id: workIdFromUrl(url) || key,
              title,
              url,
              status,
              metrics,
              raw: { text }
            });
            if (items.length >= 50) break;
          }
          return items;

          function workIdFromUrl(url) {
            if (!url) return '';
            try {
              const parsed = new URL(url);
              const parts = parsed.pathname.split('/').filter(Boolean);
              return parts[parts.length - 1] || url;
            } catch {
              return url;
            }
          }
        }
        """
    )
    return dedupe_works(works)


def dedupe_works(works: list[dict]) -> list[dict]:
    cleaned = []
    seen = set()
    for item in works:
        title = (item.get("title") or "").strip()
        url = (item.get("url") or "").strip()
        platform_work_id = (item.get("platform_work_id") or work_id_from_url(url) or title).strip()
        item["metrics"] = normalize_metrics(item.get("metrics") or {})
        if not is_valid_work(title=title, url=url, status=item.get("status") or "", metrics=item["metrics"]):
            continue
        key = platform_work_id or url or title
        if key in seen:
            continue
        seen.add(key)
        item["platform_work_id"] = platform_work_id
        item["title"] = title
        item["content"] = (item.get("content") or "").strip()
        item["url"] = url
        cleaned.append(item)
    return cleaned


def fill_work_contents(context, works: list[dict]) -> None:
    detail_page = context.new_page()
    try:
        synced = 0
        for work in works:
            if synced >= MAX_CONTENT_SYNC_COUNT:
                break
            url = work.get("url") or ""
            if not url or work.get("content"):
                continue
            try:
                detail_page.goto(url, wait_until="domcontentloaded", timeout=45000)
                detail_page.wait_for_timeout(2500)
                content = extract_work_content(detail_page, work.get("title") or "")
                if content:
                    work["content"] = content
                    synced += 1
            except Exception as e:
                print(f"[toutiao-works] content extract failed: {url}: {e}", flush=True)
    finally:
        detail_page.close()


def extract_work_content(page, title: str) -> str:
    content = page.evaluate(
        """
        (title) => {
          const normalize = (text) => (text || '').replace(/\\u00a0/g, ' ').replace(/[ \\t]+/g, ' ').replace(/\\n{3,}/g, '\\n\\n').trim();
          const selectors = [
            'article',
            '[class*=article-content]',
            '[class*=ArticleContent]',
            '[class*=content-detail]',
            '[class*=ContentDetail]',
            '[class*=detail-content]',
            '[class*=syl-page-article]',
            '[class*=ProseMirror]',
            'main'
          ];
          const ignored = ['评论', '相关推荐', '广告', '登录', '打开App'];
          const candidates = [];
          for (const selector of selectors) {
            for (const node of Array.from(document.querySelectorAll(selector))) {
              const text = normalize(node.innerText || node.textContent);
              if (text.length < 20) continue;
              if (ignored.some((item) => text === item)) continue;
              candidates.push(text);
            }
          }
          if (!candidates.length) {
            const paragraphs = Array.from(document.querySelectorAll('p'))
              .map((node) => normalize(node.innerText || node.textContent))
              .filter((text) => text.length > 0);
            if (paragraphs.length) candidates.push(paragraphs.join('\\n'));
          }
          candidates.sort((a, b) => b.length - a.length);
          const best = candidates[0] || '';
          return best.startsWith(title) ? best.slice(title.length).trim() : best;
        }
        """,
        title,
    )
    return content[:20000]


def is_valid_work(title: str, url: str, status: str, metrics: dict) -> bool:
    if not title or title in NAVIGATION_TITLES:
        return False
    return url.startswith(("http://", "https://"))


def normalize_metrics(metrics: dict) -> dict:
    return {key: parse_number(value) for key, value in metrics.items() if value not in {"", None}}


def parse_number(value) -> int | float | str:
    text = str(value).replace(",", "").strip()
    if not text:
        return ""
    multiplier = 1
    if text.lower().endswith("k"):
        multiplier = 1000
        text = text[:-1]
    if text.endswith("万"):
        multiplier = 10000
        text = text[:-1]
    try:
        number = float(text)
    except ValueError:
        return value
    value = number * multiplier
    return int(value) if value.is_integer() else value


def work_id_from_url(url: str) -> str:
    if not url:
        return ""
    matches = re.findall(r"\\d{8,}", url)
    if matches:
        return matches[-1]
    return url.rstrip("/").split("/")[-1]


def write_result(result_file: Path, payload: dict) -> None:
    result_file.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()
