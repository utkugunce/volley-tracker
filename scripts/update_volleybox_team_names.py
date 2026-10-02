#!/usr/bin/env python3
"""
scripts/update_volleybox_team_names.py

data/volleybox-mappings.json içindeki `matched_as` takım adlarını Volleybox'taki
güncel adlarla (aktif sezon / sponsorlu ad veya ana kulüp adı) yenileyen script.

Kurallar & Mantık:
1. Her kayıttaki `volleybox_url` sayfası taranır.
2. Sayfadan 3 katmanlı bilgi çıkarılır:
   a. Aktif Sezon / Sponsorlu Ad: `dl.club_alternative_names` içinde "present" içeren
      veya güncel sezona ait kayıt, ya da kadro bölümündeki `div.fontSize125rem`.
   b. Temel Kulüp Adı: `<h1>` etiketi (fallback: `og:title` / `<title>`).
   c. Geçmiş Adlar: `dl.club_alternative_names` listesindeki tüm adlar.
3. Öncelik: Aktif sezon / sponsorlu ad varsa `matched_as` olarak o kullanılır;
   yoksa temel kulüp adı (`h1`) kullanılır.
4. `matched_as` güncellendiğinde:
   - Eski `matched_as` adı `aliases` dizisine eklenir.
   - Temel kulüp adı (h1) `matched_as`'tan farklıysa o da `aliases` dizisine eklenir.
   - Varsa geçmiş adlar da `aliases` dizisine eklenir.
   - Slug, volleybox_url ve diğer alanlara dokunulmaz.
5. Şube / Takım Takısı Koruması: Volleybox tek sayfa sunduğunda (- A, - B, (A), (B))
   şube takıları korunur.
6. Yönlendirme (Redirect) Koruması: Yanlış ID/slug yönlendirmeleri tespit edilip atlanır.
7. Performans ve Güvenlik:
   - İstekler arası nazik bekleme ve retry.
   - Çoklu iş parçacığı desteği (`--workers`, varsayılan: 4).
   - `data/.volleybox_names_cache.json` önbelleği ile kesintiye dayanıklı çalışma.
   - `--dry-run` modu ile önizleme.
"""

import argparse
import html
import json
import os
import re
import sys
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from bs4 import BeautifulSoup

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

PRINT_LOCK = threading.Lock()
CACHE_LOCK = threading.Lock()


def safe_print(*args, **kwargs):
    with PRINT_LOCK:
        print(*args, **kwargs)


def clean_title(raw: str) -> str:
    name = html.unescape(raw).strip()
    for suffix_pat in STRIP_SUFFIXES:
        name = re.sub(suffix_pat, "", name, flags=re.I).strip()
    return name


def clean_tag_text(raw_tag_str: str) -> str:
    s = re.sub(r"<a\b[^>]*>.*?</a>", "", raw_tag_str, flags=re.I | re.DOTALL)
    s = re.sub(r"<span\b[^>]*>.*?</span>", "", s, flags=re.I | re.DOTALL)
    s = re.sub(r"<[^>]+>", "", s)
    return clean_title(s)


def extract_team_info(html_text: str) -> Optional[Dict[str, Any]]:
    """
    Volleybox HTML metninden temel ad, aktif sezon adı ve geçmiş adları çıkarır.
    """
    soup = BeautifulSoup(html_text, "html.parser")

    # 1. Temel kulüp adı (H1)
    h1 = soup.find("h1")
    base_name = None
    if h1:
        base_name = clean_tag_text(str(h1))

    if not base_name:
        for pattern in [
            r'<meta\s+property=["\']og:title["\']\s+content=["\']([^"\']+)["\']',
            r'<meta\s+content=["\']([^"\']+)["\']\s+property=["\']og:title["\']',
        ]:
            m = re.search(pattern, html_text, re.I)
            if m:
                base_name = clean_title(m.group(1))
                break
        if not base_name:
            m_t = re.search(r"<title>([^<]+)</title>", html_text, re.I)
            if m_t:
                base_name = clean_title(m_t.group(1))

    # 2. Geçmiş adlar & Aktif sezon sponsorlu adı (Historical names)
    historical_names: List[str] = []
    active_sponsored_name: Optional[str] = None

    dl = soup.find("dl", class_="club_alternative_names")
    if dl:
        for div in dl.find_all("div", class_="display-flex"):
            dt = div.find("dt")
            dd = div.find("dd")
            if dt and dd:
                period = dd.get_text(strip=True)
                name = clean_title(dt.get_text(strip=True))
                if name:
                    if name not in historical_names:
                        historical_names.append(name)
                    if not active_sponsored_name:
                        if "present" in period.lower() or re.search(r"202[6-9]/\d{2}", period):
                            active_sponsored_name = name

    # 3. Eğer dl'de aktif ad bulunamadıysa, kadro bölümündeki `div.fontSize125rem` kontrol et
    if not active_sponsored_name:
        season_div = soup.find("div", class_="fontSize125rem")
        if season_div:
            s_name = clean_title(season_div.get_text(strip=True))
            if s_name and len(s_name) > 1:
                active_sponsored_name = s_name
                if s_name not in historical_names:
                    historical_names.append(s_name)

    chosen_name = active_sponsored_name if active_sponsored_name else base_name

    if not chosen_name:
        return None

    return {
        "chosen_name": chosen_name,
        "base_name": base_name,
        "active_sponsored_name": active_sponsored_name,
        "historical_names": historical_names,
    }


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
    if status_code in (403, 503):
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


def get_slug_from_url(url: str) -> str:
    parts = url.rstrip("/").split("/")
    last = parts[-1]
    return re.sub(r"[^a-zA-Z0-9_\-]", "", last) or "team"


def fetch_page(url: str, timeout: int = 15) -> Tuple[Optional[str], Optional[str]]:
    """
    (html, error_message) döndürür.
    Cloudflare captcha/turnstile tespit edilirse error_message == 'cloudflare' olur.
    """
    req = urllib.request.Request(url, headers=HEADERS)
    orig_slug = get_slug_from_url(url)
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                final_url = resp.geturl()
                final_slug = get_slug_from_url(final_url)
                if orig_slug and final_slug and orig_slug != final_slug:
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
            if he.code == 429:
                retry_after_str = he.headers.get("Retry-After")
                wait_sec = (
                    int(retry_after_str) + 3
                    if retry_after_str and retry_after_str.isdigit()
                    else 60
                )
                safe_print(f"  ⏳ HTTP 429 (Hız sınırı). {wait_sec} sn beklenip yeniden denenecek...")
                time.sleep(wait_sec)
                continue
            if is_cloudflare_challenge(body, he.code):
                return None, "cloudflare"
            if he.code == 404:
                return None, f"HTTP {he.code} Not Found"
            if attempt < max_retries - 1 and he.code in (500, 502, 503, 504):
                time.sleep(3.0)
                continue
            return None, f"HTTP {he.code}"
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(3.0)
                continue
            return None, str(e)
    return None, "Bilinmeyen hata"


def load_cache(cache_path: Path) -> Dict[str, Any]:
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            safe_print(f"  [UYARI] Önbellek dosyası okunamadı: {e}")
            return {}
    return {}


def save_cache(cache: Dict[str, Any], cache_path: Path):
    with CACHE_LOCK:
        try:
            cache_path.parent.mkdir(parents=True, exist_ok=True)
            temp_path = cache_path.with_suffix(".tmp")
            with open(temp_path, "w", encoding="utf-8") as f:
                json.dump(cache, f, ensure_ascii=False, indent=2)
            temp_path.replace(cache_path)
        except Exception as e:
            safe_print(f"  [UYARI] Önbellek kaydedilemedi: {e}")


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        description="Volleybox matched_as takım adlarını güncelleyen script (Seçenek A: Güncel Sezon/Sponsor Adı Öncelikli)"
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
        default=1.3,
        help="İstekler arası bekleme süresi (sn, varsayılan: 1.3)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Eşzamanlı istek iş parçacığı sayısı (varsayılan: 1)",
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
        safe_print(f"HATA: {MAPPINGS_FILE} bulunamadı!", file=sys.stderr)
        return 1

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    mappings = data.get("mappings", [])
    total_records = len(mappings)
    safe_print(f"📦 Toplam eşleme kaydı: {total_records}")

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

    safe_print(f"🎯 Taranacak benzersiz Volleybox URL sayısı: {len(urls_to_scan)}")
    if args.dry_run:
        safe_print("🔍 Mod: DRY-RUN (dosyaya yazma yapılmayacak)")

    # İhtiyaç duyulan URL'ler (önbellekte 'chosen_name' veya 'historical_names' eksikse yeniden taranır)
    pending_urls = []
    cached_hits = 0
    for u in urls_to_scan:
        c = cache.get(u)
        if not args.no_cache and c and c.get("status") == "ok" and "chosen_name" in c:
            cached_hits += 1
        else:
            pending_urls.append(u)

    safe_print(f"⚡ Önbellekte mevcut (güncel şemada): {cached_hits} | Taranacak: {len(pending_urls)}")

    skipped_cloudflare: List[str] = []
    skipped_errors: List[Tuple[str, str]] = []
    fetched_count = 0
    total_to_fetch = len(pending_urls)
    completed_count = 0

    def worker_fetch(u: str) -> Tuple[str, Optional[Dict[str, Any]], Optional[str]]:
        nonlocal completed_count
        time.sleep(args.delay)
        html_text, err = fetch_page(u)
        with PRINT_LOCK:
            completed_count += 1
            cur = completed_count
        if err:
            return u, None, err
        if not html_text:
            return u, None, "Boş yanıt"
        info = extract_team_info(html_text)
        if not info or not info.get("chosen_name"):
            return u, None, "Takım adı çıkarılamadı"
        return u, info, None

    if pending_urls:
        safe_print(f"🚀 Tarama başlatılıyor ({args.workers} iş parçacığı, istek başı {args.delay}sn bekleme)...")
        with ThreadPoolExecutor(max_workers=args.workers) as executor:
            future_to_url = {executor.submit(worker_fetch, u): u for u in pending_urls}
            for fut in as_completed(future_to_url):
                u, info, err = fut.result()
                if err == "cloudflare":
                    safe_print(f"  ⚠️ [{completed_count}/{total_to_fetch}] Cloudflare doğrulaması: {u}")
                    skipped_cloudflare.append(u)
                    with CACHE_LOCK:
                        cache[u] = {
                            "status": "cloudflare",
                            "error": "Cloudflare challenge",
                            "updated_at": datetime.now().isoformat(),
                        }
                    save_cache(cache, cache_path)
                elif err:
                    safe_print(f"  ⚠️ [{completed_count}/{total_to_fetch}] Hata ({err}): {u}")
                    skipped_errors.append((u, err))
                    with CACHE_LOCK:
                        cache[u] = {
                            "status": "error",
                            "error": err,
                            "updated_at": datetime.now().isoformat(),
                        }
                    save_cache(cache, cache_path)
                else:
                    fetched_count += 1
                    chosen = info["chosen_name"]
                    base = info["base_name"]
                    spons = info.get("active_sponsored_name")
                    extra = f" (Sponsor: {spons})" if spons and spons != base else ""
                    safe_print(f"  ✅ [{completed_count}/{total_to_fetch}] {chosen}{extra} [{get_slug_from_url(u)}]")
                    with CACHE_LOCK:
                        cache[u] = {
                            "status": "ok",
                            "chosen_name": chosen,
                            "team_name": chosen,
                            "base_name": base,
                            "active_sponsored_name": spons,
                            "historical_names": info.get("historical_names", []),
                            "updated_at": datetime.now().isoformat(),
                        }
                    save_cache(cache, cache_path)

    safe_print("\n" + "=" * 60)
    safe_print(f"📊 Tarama Tamamlandı:")
    safe_print(f"   - Önceden önbellekte bulunan: {cached_hits}")
    safe_print(f"   - Canlı çekilen: {fetched_count}")
    safe_print(f"   - Cloudflare nedeniyle atlanan: {len(skipped_cloudflare)}")
    safe_print(f"   - Hata nedeniyle atlanan: {len(skipped_errors)}")
    safe_print("=" * 60 + "\n")

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

        chosen_name = cache_entry.get("chosen_name") or cache_entry.get("team_name")
        if not chosen_name:
            continue

        old_name = item.get("matched_as")
        target_name = preserve_branch_suffix(old_name, chosen_name)
        base_name = cache_entry.get("base_name")
        historical_names = cache_entry.get("historical_names", [])

        name_changed = old_name != target_name

        if name_changed:
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
            if name_changed:
                item["matched_as"] = target_name
                aliases = item.setdefault("aliases", [])
                if old_name and old_name not in aliases:
                    aliases.append(old_name)

            # Temel kulüp adı (base_name) ve geçmiş adları aliases içine ekle
            aliases = item.setdefault("aliases", [])
            if base_name:
                base_target = preserve_branch_suffix(old_name, base_name)
                if base_target not in aliases and base_target != target_name:
                    aliases.append(base_target)

            for h_name in historical_names:
                h_target = preserve_branch_suffix(old_name, h_name)
                if h_target not in aliases and h_target != target_name:
                    aliases.append(h_target)

    safe_print(f"🔄 Adı Değişen Eşleme Kaydı Sayısı: {len(changes)}")
    if changes:
        safe_print("\n| Dahili Takım Adı | Slug | Eski matched_as | Yeni matched_as |")
        safe_print("| --- | --- | --- | --- |")
        for ch in changes:
            safe_print(
                f"| {ch['internal_name']} | {ch['slug']} | {ch['old_name']} | {ch['new_name']} |"
            )

    if not args.dry_run:
        with open(MAPPINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        safe_print(f"\n✅ {MAPPINGS_FILE} başarıyla güncellendi.")
    else:
        safe_print("\nℹ️ DRY-RUN modunda çalıştırıldığı için dosyaya yazılmadı.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
