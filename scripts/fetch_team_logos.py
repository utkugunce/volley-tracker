#!/usr/bin/env python3
"""
Volleybox Takım Logoları İndirme Scripti

data/volleybox-mappings.json içindeki benzersiz takım sayfalarından og:image
logosunu çeker, public/logos/<slug>.png olarak yerel diske kaydeder ve
eşleştirmelere logo_url ve local_logo alanlarını ekler.
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "tr,en-US;q=0.9,en;q=0.8",
}


def get_slug_from_url(url: str) -> str:
    parts = url.rstrip("/").split("/")
    last = parts[-1]
    # slug usually like vakfbank-u18-t19499
    slug = re.sub(r"[^a-zA-Z0-9_\-]", "", last)
    return slug or "team_logo"


def fetch_og_image(url: str, timeout: int = 15) -> str | None:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status != 200:
                return None
            html = resp.read().decode("utf-8", errors="ignore")
            # Extract og:image
            match = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']+)["\']', html, re.I)
            if not match:
                match = re.search(r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:image["\']', html, re.I)
            if match:
                img_url = match.group(1).strip()
                # Ignore default generic placeholders
                if "/default" in img_url.lower() or "logo_women.png" in img_url.lower():
                    return None
                return img_url
    except Exception as e:
        print(f"  [HATA] HTML okunamadı ({url}): {e}")
    return None


def download_image(img_url: str, dest_path: Path, timeout: int = 15) -> bool:
    req = urllib.request.Request(img_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                raw_bytes = resp.read()
                try:
                    from PIL import Image
                    import io
                    with Image.open(io.BytesIO(raw_bytes)) as im:
                        im.thumbnail((96, 96), Image.Resampling.LANCZOS)
                        im.save(dest_path, format="PNG", optimize=True)
                except Exception:
                    with open(dest_path, "wb") as f:
                        f.write(raw_bytes)
                return True
    except Exception as e:
        print(f"  [HATA] Görsel indirilemedi ({img_url}): {e}")
    return False


def main():
    repo_root = Path(__file__).resolve().parent.parent
    mappings_file = repo_root / "data" / "volleybox-mappings.json"
    logos_dir = repo_root / "public" / "logos"
    logos_dir.mkdir(parents=True, exist_ok=True)

    if not mappings_file.exists():
        print(f"HATA: {mappings_file} bulunamadı!", file=sys.stderr)
        sys.exit(1)

    with open(mappings_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    mappings = data.get("mappings", [])
    unique_urls = sorted(list(set(m.get("volleybox_url") for m in mappings if m.get("volleybox_url"))))
    print(f"Toplam takım eşleştirmesi: {len(mappings)}")
    print(f"Taranacak benzersiz Volleybox URL sayısı: {len(unique_urls)}")

    url_to_logo = {}

    for idx, url in enumerate(unique_urls, 1):
        slug = get_slug_from_url(url)
        dest_filename = f"{slug}.png"
        dest_path = logos_dir / dest_filename
        local_rel_path = f"/logos/{dest_filename}"

        # If already downloaded locally, reuse
        if dest_path.exists() and dest_path.stat().st_size > 0:
            print(f"[{idx}/{len(unique_urls)}] Mevcut: {slug}")
            url_to_logo[url] = {
                "local_logo": local_rel_path,
                "logo_url": None
            }
            continue

        print(f"[{idx}/{len(unique_urls)}] Taranıyor: {url}")
        img_url = fetch_og_image(url)

        if img_url:
            success = download_image(img_url, dest_path)
            if success:
                print(f"  -> İndirildi: {dest_filename} ({dest_path.stat().st_size} byte)")
                url_to_logo[url] = {
                    "local_logo": local_rel_path,
                    "logo_url": img_url
                }
            else:
                url_to_logo[url] = {
                    "local_logo": None,
                    "logo_url": img_url
                }
        else:
            print(f"  -> Logo bulunamadı.")
            url_to_logo[url] = {
                "local_logo": None,
                "logo_url": None
            }

        time.sleep(0.2)

    # Update mappings in json
    updated_count = 0
    for m in mappings:
        u = m.get("volleybox_url")
        if u in url_to_logo:
            info = url_to_logo[u]
            if info["local_logo"]:
                m["local_logo"] = info["local_logo"]
            if info["logo_url"]:
                m["logo_url"] = info["logo_url"]
            elif "logo_url" not in m:
                m["logo_url"] = None
            updated_count += 1

    data["mappings"] = mappings

    with open(mappings_file, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\nİşlem tamamlandı!")
    print(f"Toplam güncellenen eşleştirme kaydı: {updated_count}")
    print(f"İndirilen yerel logolar: {len(list(logos_dir.glob('*.png')))} adet")


if __name__ == "__main__":
    main()
