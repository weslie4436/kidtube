"""Read playlist.json and write catalog.json.

Prefer the playlist page (about the first 100 videos, with channel and
duration). If that parse fails, fall back to the public RSS feed (15 videos).
Never replace a good catalog with an empty one.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ATOM = "http://www.w3.org/2005/Atom"
YT = "http://www.youtube.com/xml/schemas/2015"
MEDIA = "http://search.yahoo.com/mrss/"


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0",
            "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read()


def extract_object(html: str, marker: str) -> dict | None:
    start = html.find(marker)
    if start < 0:
        return None
    start = html.find("{", start)
    if start < 0:
        return None
    depth = 0
    in_str = False
    esc = False
    for index in range(start, len(html)):
        char = html[index]
        if in_str:
            if esc:
                esc = False
            elif char == "\\":
                esc = True
            elif char == '"':
                in_str = False
            continue
        if char == '"':
            in_str = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(html[start : index + 1])
    return None


def dig(node: dict, *path: str):
    current = node
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def playlist_title(data: dict) -> str:
    title = dig(data, "metadata", "playlistMetadataRenderer", "title")
    if isinstance(title, str) and title.strip():
        return title.strip()
    page_title = dig(data, "header", "pageHeaderRenderer", "pageTitle")
    if isinstance(page_title, str):
        return page_title.strip()
    return ""


def duration_of(lock: dict) -> str:
    overlays = dig(lock, "contentImage", "thumbnailViewModel", "overlays") or []
    for overlay in overlays:
        badges = dig(overlay, "thumbnailBottomOverlayViewModel", "badges") or []
        for badge in badges:
            text = dig(badge, "thumbnailBadgeViewModel", "text")
            if isinstance(text, str) and any(char.isdigit() for char in text):
                return text.strip()
    return ""


def channel_bits(meta: dict) -> tuple[str, str, str, str, str]:
    rows = dig(meta, "metadata", "contentMetadataViewModel", "metadataRows") or []
    name = ""
    channel_id = ""
    views = ""
    when = ""
    if rows:
        parts = rows[0].get("metadataParts") or []
        if parts:
            text = parts[0].get("text") or {}
            name = (text.get("content") or "").strip()
            runs = text.get("commandRuns") or []
            if runs:
                channel_id = dig(runs[0], "onTap", "innertubeCommand", "browseEndpoint", "browseId") or ""
    if len(rows) > 1:
        parts = rows[1].get("metadataParts") or []
        if parts:
            views = ((parts[0].get("text") or {}).get("content") or "").strip()
        if len(parts) > 1:
            when = ((parts[1].get("text") or {}).get("content") or "").strip()
    if not channel_id:
        channel_id = (
            dig(
                meta,
                "image",
                "decoratedAvatarViewModel",
                "rendererContext",
                "commandContext",
                "onTap",
                "innertubeCommand",
                "browseEndpoint",
                "browseId",
            )
            or ""
        )
    avatar = ""
    sources = dig(
        meta,
        "image",
        "decoratedAvatarViewModel",
        "avatar",
        "avatarViewModel",
        "image",
        "sources",
    )
    if isinstance(sources, list) and sources:
        avatar = sources[0].get("url") or ""
    return name, channel_id, avatar, views, when


def videos_from_page(data: dict) -> list[dict]:
    try:
        sections = data["contents"]["twoColumnBrowseResultsRenderer"]["tabs"][0]["tabRenderer"][
            "content"
        ]["sectionListRenderer"]["contents"]
    except (KeyError, IndexError, TypeError):
        return []
    videos = []
    for section in sections:
        items = (section.get("itemSectionRenderer") or {}).get("contents") or []
        for item in items:
            lock = item.get("lockupViewModel")
            if not lock:
                continue
            content_type = lock.get("contentType") or ""
            if content_type and "VIDEO" not in content_type:
                continue
            video_id = (lock.get("contentId") or "").strip()
            if len(video_id) != 11:
                continue
            meta = dig(lock, "metadata", "lockupMetadataViewModel") or {}
            title = ((meta.get("title") or {}).get("content") or "").strip()
            if not title:
                continue
            channel, channel_id, avatar, views, when = channel_bits(meta)
            videos.append(
                {
                    "id": video_id,
                    "title": title,
                    "channel": channel,
                    "channelId": channel_id,
                    "avatar": avatar,
                    "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                    "duration": duration_of(lock),
                    "views": views,
                    "when": when,
                    "published": "",
                    "index": len(videos) + 1,
                }
            )
    return videos


def videos_from_rss(playlist_id: str) -> list[dict]:
    raw = fetch(f"https://www.youtube.com/feeds/videos.xml?playlist_id={playlist_id}")
    root = ET.fromstring(raw)
    videos = []
    for entry in root.findall(f"{{{ATOM}}}entry"):
        video_id = (entry.findtext(f"{{{YT}}}videoId") or "").strip()
        title = (entry.findtext(f"{{{ATOM}}}title") or "").strip()
        channel = (entry.findtext(f"{{{ATOM}}}author/{{{ATOM}}}name") or "").strip()
        channel_id = (entry.findtext(f"{{{YT}}}channelId") or "").strip()
        published = (entry.findtext(f"{{{ATOM}}}published") or "").strip()
        if len(video_id) != 11 or not title:
            continue
        videos.append(
            {
                "id": video_id,
                "title": title,
                "channel": channel,
                "channelId": channel_id,
                "avatar": "",
                "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
                "duration": "",
                "views": "",
                "when": "",
                "published": published,
                "index": len(videos) + 1,
            }
        )
    return videos


def load_playlist(playlist_id: str) -> tuple[str, list[dict], str]:
    page_url = f"https://www.youtube.com/playlist?list={playlist_id}"
    try:
        html = fetch(page_url).decode("utf-8", "replace")
        data = extract_object(html, "ytInitialData")
    except Exception as error:  # noqa: BLE001 - keep the previous catalog
        print(f"page fetch failed: {error}")
        data = None
    if data:
        videos = videos_from_page(data)
        if videos:
            return playlist_title(data), videos, "page"
        print("page parsed but no videos")
    try:
        videos = videos_from_rss(playlist_id)
    except Exception as error:  # noqa: BLE001
        print(f"rss fetch failed: {error}")
        videos = []
    return "", videos, "rss" if videos else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--playlist", default="")
    parser.add_argument("--out", default="")
    args = parser.parse_args()

    config = json.loads((ROOT / "playlist.json").read_text(encoding="utf-8"))
    playlist_id = (args.playlist or config.get("playlistId") or "").strip()
    out = Path(args.out) if args.out else ROOT / "catalog.json"
    if not playlist_id:
        print("playlist.json has no playlistId; catalog left unchanged")
        return 0

    title, videos, source = load_playlist(playlist_id)
    if not videos:
        print("no videos read; catalog left unchanged")
        return 0

    payload = {
        "playlistId": playlist_id,
        "title": title,
        "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": source,
        "videos": videos,
    }
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {len(videos)} videos via {source} -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
