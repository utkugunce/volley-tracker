#!/usr/bin/env python3
"""
scripts/update_volleybox_team_names.py

data/volleybox-mappings.json içindeki `matched_as` takım adlarını Volleybox'taki
güncel adlarla yenileyen script.

Kurallar:
1. Her kayıttaki `volleybox_url` sayfasını açıp güncel takım adını alır (og:title / h1 / title).
2. Güncel ad `matched_as` ile farklıysa `matched_as` alanını günceller.
   Eski adı `aliases` içine ekler (zaten yoksa), böylece TVF'den gelen eski/sponsorlu
   adlar eşleşmeye devam eder. Slug, volleybox_url ve diğer alanlara dokunulmaz.
3. `--dry-run` modu ile yazmadan önce değişiklikleri listeler.
4. Rate limit'e uyar (istekler arası 1-2 sn, nazik yeniden deneme, Cloudflare doğrulaması
   çıkarsa kaydı atlayıp raporlar). Kesilirse kaldığı yerden devam edebilmesi için
   `data/.volleybox_names_cache.json` önbelleğini kullanır.
"""

import argparse
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

REPO_ROOT = Path(__file__).resolve().parent.parent
MAPPINGS_FILE = REPO_ROOT / "data" / "volleybox-mappings.json"
DEFAULT_CACHE_FILE = REPO_ROOT / "data" / ".volleybox_names_cache.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

HEADERS = {
    "User-Agent": USER_AGENT,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

STRIP_SUFFIXES = [
    r"\s*[-–|]\s*(?:takım kadrosu ve oyuncular|team roster and players).*$",
    r"\s*[-–|]\s*Volleybox.*$",
]


def clean_title(raw: str) -> str:
    name = html.unescape(raw).strip()
    for suffix_pat in STRIP_SUFFIXES:
        name = re.sub(suffix_pat, "", name, flags=re.I).strip()
    return name


def clean_h1(raw_h1: str) -> str:
    # İçerideki bağlantı, rozet ve madalya etiketlerini kaldır
    s = re.sub(r"<a\b[^>]*>.*?</a>", "", raw_h1, flags=re.I | re.DOTALL)
    s = re.sub(r"<span\b[^>]*>.*?</span>", "", s, flags=re.I | re.DOTALL)
    s = re.sub(r"<[^>]+>", "", s)
    return html.unescape(s).strip()


def extract_team_name(html_text: str) -> Optional[str]:
    # 1. og:title
    for pattern in [
        r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
        r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']',
    ]:
        m = re.search(pattern, html_text, re.I)
        if m:
            name = clean_title(m.group(1))
            if name and len(name) > 1:
                return name

    # 2. h1
    m_h1 = re.search(r"<h1\b[^>]*>(.*?)</h1>", html_text, re.I | re.DOTALL)
    if m_h1:
        name = clean_h1(m_h1.group(1))
        if name and len(name) > 1:
            return name

    # 3. title
    m_t = re.search(r"<title>([^<]+)</title>", html_text, re.I)
    if m_t:
        name = clean_title(m_t.group(1))
        if name and len(name) > 1:
            return name

    return None


def preserve_branch_suffix(old_name: Optional[str], new_name: str) -> str:
    """
    Volleybox kulüp için tek bir sayfa sunduğunda (örn. VakıfBank U16),
    mevcut eşlemedeki - A / - B veya (A) / (B) takım ayrımını korur.
    """
    if not old_name:
        return new_name
    if re.search(r"(?:^|[\s\-])[AB](?:\s|$|\))", new_name):
        return new_name
    m = re.search(r"\s*-\s*([AB])(?:\s+(U\d+))?$", old_name, re.I)
    if m:
        letter = m.group(1).upper()
        age_m = re.search(r"\s+(U\d+)$", new_name, re.I)
        if age_m:
            base = new_name[: age_m.start()]
            age = age_m.group(1)
            return f"{base} - {letter} {age}"
        else:
            return f"{new_name} - {letter}"
    m_paren = re.search(r"\s*\(([AB])\)", old_name, re.I)
    if m_paren:
        letter = m_paren.group(1).upper()
        return f"{new_name} ({letter})"
    m_mid = re.search(r"\s*-\s*([AB])\s+", old_name, re.I)
    if m_mid:
        letter = m_mid.group(1).upper()
        age_m = re.search(r"\s+(U\d+)$", new_name, re.I)
        if age_m:
            base = new_name[: age_m.start()]
            age = age_m.group(1)
            return f"{base} - {letter} {age}"
        else:
            return f"{new_name} - {letter}"
    return new_name


def is_cloudflare_challenge(html_text: str, status_code: int) -> bool:
    lower = html_text.lower()
    if status_code in (403, 429, 503):
        if (
            "cloudflare" in lower
            or "turnstile" in lower
            or "just a moment" in lower
            or "challenge-platform" in lower
        ):
            return True
    if "<title>just a moment...</title>" in lower or "cf-browser-verification" in lower:
        return True
    return False


def fetch_page(url: str, timeout: int = 15) -> Tuple[Optional[str], Optional[str]]:
    """
    (html, error_message) döndürür.
    Cloudflare tespit edilirse error_message == 'cloudflare' olur.
    """
    req = urllib.request.Request(url, headers=HEADERS)
    orig_slug = get_slug_from_url(url)
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                final_url = resp.geturl()
                final_slug = get_slug_from_url(final_url)
                if orig_slug and final_slug and orig_slug != final_slug:
                    # Yönlendirme tamamen farklı bir takıma gittiyse (örn. yanlış id)
                    return None, f"Farklı takıma yönlendi ({orig_slug} -> {final_slug})"

                status = resp.status
                body = resp.read().decode("utf-8", errors="ignore")
                if is_cloudflare_challenge(body, status):
                    return None, "cloudflare"
                if status == 200:
                    return body, None
        except urllib.error.HTTPError as he:
            body = ""
            try:
                body = he.read().decode("utf-8", errors="ignore")
            except Exception:
                pass
            if is_cloudflare_challenge(body, he.code):
                return None, "cloudflare"
            if he.code == 404:
                return None, f"HTTP {he.code} Not Found"
            if attempt == 0 and he.code in (500, 502, 503, 504):
                time.sleep(2.0)
                continue
            return None, f"HTTP {he.code}"
        except Exception as e:
            if attempt == 0:
                time.sleep(2.0)
                continue
            return None, str(e)
    return None, "Bilinmeyen hata"


def load_cache(cache_path: Path) -> Dict[str, Any]:
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"  [UYARI] Önbellek dosyası okunamadı: {e}")
            return {}
    return {}


def save_cache(cache: Dict[str, Any], cache_path: Path):
    try:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = cache_path.with_suffix(".tmp")
        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
        temp_path.replace(cache_path)
    except Exception as e:
        print(f"  [UYARI] Önbellek kaydedilemedi: {e}")


def get_slug_from_url(url: str) -> str:
    parts = url.rstrip("/").split("/")
    last = parts[-1]
    return re.sub(r"[^a-zA-Z0-9_\-]", "", last) or "team"


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Volleybox matched_as takım adlarını güncelleyen script"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Dosyaya yazmadan değişiklikleri listele",
    )
    parser.add_argument(
        "--cache-file",
        type=str,
        default=str(DEFAULT_CACHE_FILE),
        help="Önbellek dosya yolu",
    )
    parser.add_argument(
        "--no-cache",
        action="store_true",
        help="Önbelleği yoksay ve yeniden çek",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.2,
        help="İstekler arası bekleme süresi (sn, varsayılan: 1.2)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="İşlenecek maksimum URL sayısı (test amaçlı)",
    )
    parser.add_argument(
        "--slug",
        type=str,
        default=None,
        help="Yalnızca belirtilen slug/URL'yi güncelle",
    )
    args = parser.parse_args(argv)

    if not MAPPINGS_FILE.exists():
        print(f"HATA: {MAPPINGS_FILE} bulunamadı!", file=sys.stderr)
        return 1

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    mappings = data.get("mappings", [])
    total_records = len(mappings)
    print(f"📦 Toplam eşleme kaydı: {total_records}")

    cache_path = Path(args.cache_file)
    cache = {} if args.no_cache else load_cache(cache_path)

    # Hedef URL listesini oluştur
    urls_to_scan = []
    seen_urls = set()

    for item in mappings:
        url = item.get("volleybox_url")
        if not url:
            continue
        slug = item.get("slug") or get_slug_from_url(url)
        if args.slug and args.slug not in (slug, url):
            continue
        if url not in seen_urls:
            seen_urls.add(url)
            urls_to_scan.append(url)

    if args.limit:
        urls_to_scan = urls_to_scan[: args.limit]

    print(f"🎯 Taranacak benzersiz Volleybox URL sayısı: {len(urls_to_scan)}")
    if args.dry_run:
        print("🔍 Mod: DRY-RUN (dosyaya yazma yapılmayacak)")

    skipped_cloudflare: List[str] = []
    skipped_errors: List[Tuple[str, str]] = []
    cached_hits = 0
    fetched_count = 0

    for idx, url in enumerate(urls_to_scan, 1):
        cached_info = cache.get(url)
        if (
            not args.no_cache
            and cached_info
            and cached_info.get("status") == "ok"
            and cached_info.get("team_name")
        ):
            cached_hits += 1
            continue

        print(f"[{idx}/{len(urls_to_scan)}] Taranıyor: {url}")
        html_text, err = fetch_page(url)

        if err == "cloudflare":
            print(f"  ⚠️ Cloudflare doğrulaması çıktı, kayıt atlanıyor: {url}")
            skipped_cloudflare.append(url)
            cache[url] = {
                "status": "cloudflare",
                "error": "Cloudflare challenge",
                "updated_at": datetime.now().isoformat(),
            }
            save_cache(cache, cache_path)
            time.sleep(args.delay)
            continue
        elif err:
            print(f"  ⚠️ Sayfa okunamadı ({err}): {url}")
            skipped_errors.append((url, err))
            cache[url] = {
                "status": "error",
                "error": err,
                "updated_at": datetime.now().isoformat(),
            }
            save_cache(cache, cache_path)
            time.sleep(args.delay)
            continue

        team_name = extract_team_name(html_text) if html_text else None
        if not team_name:
            print(f"  ⚠️ Takım adı tespit edilemedi: {url}")
            skipped_errors.append((url, "Takım adı çıkarılamadı"))
            cache[url] = {
                "status": "not_found",
                "error": "Takım adı çıkarılamadı",
                "updated_at": datetime.now().isoformat(),
            }
        else:
            print(f"  -> Volleybox Adı: {team_name}")
            cache[url] = {
                "status": "ok",
                "team_name": team_name,
                "updated_at": datetime.now().isoformat(),
            }
            fetched_count += 1

        save_cache(cache, cache_path)
        time.sleep(args.delay)

    print("\n" + "=" * 60)
    print(f"📊 Tarama Tamamlandı:")
    print(f"   - Önceden önbellekte bulunan: {cached_hits}")
    print(f"   - Canlı çekilen: {fetched_count}")
    print(f"   - Cloudflare nedeniyle atlanan: {len(skipped_cloudflare)}")
    print(f"   - Hata nedeniyle atlanan: {len(skipped_errors)}")
    print("=" * 60 + "\n")

    # Değişiklikleri eşleme kayıtlarına uygula
    changes: List[Dict[str, Any]] = []

    for item in mappings:
        url = item.get("volleybox_url")
        if not url:
            continue
        if args.slug:
            slug = item.get("slug") or get_slug_from_url(url)
            if args.slug not in (slug, url):
                continue

        cache_entry = cache.get(url)
        if not cache_entry or cache_entry.get("status") != "ok":
            continue

        new_name = cache_entry.get("team_name")
        if not new_name:
            continue

        old_name = item.get("matched_as")
        target_name = preserve_branch_suffix(old_name, new_name)
        if old_name != target_name:
            changes.append(
                {
                    "internal_name": item.get("internal_name"),
                    "slug": item.get("slug") or get_slug_from_url(url),
                    "url": url,
                    "old_name": old_name,
                    "new_name": target_name,
                    "category": item.get("internal_category"),
                }
            )
            if not args.dry_run:
                item["matched_as"] = target_name
                aliases = item.setdefault("aliases", [])
                if old_name and old_name not in aliases:
                    aliases.append(old_name)

    print(f"🔄 Adı Değişen Eşleme Kaydı Sayısı: {len(changes)}")
    if changes:
        print("\n| Dahili Takım Adı | Slug | Eski matched_as | Yeni matched_as |")
        print("| --- | --- | --- | --- |")
        for ch in changes:
            print(
                f"| {ch['internal_name']} | {ch['slug']} | {ch['old_name']} | {ch['new_name']} |"
            )

    if not args.dry_run:
        if changes:
            with open(MAPPINGS_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"\n✅ {MAPPINGS_FILE} başarıyla güncellendi.")
        else:
            print("\nℹ️ Güncellenecek kayıt bulunamadı.")
    else:
        print("\nℹ️ DRY-RUN modunda çalıştırıldığı için dosyaya yazılmadı.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
