#!/usr/bin/env python3
"""
Volleybox Profil Bağlantıları Doğrulama Scripti

data/volleybox-mappings.json içindeki her volleybox_url için HTTP GET isteği göndererek
bağlantıların geçerliliğini (HTTP 200) denetler. Rate limit ve nezaket kurallarına
uygun olarak istekler arasına gecikme koyar. Kırık link tespit edildiğinde detaylı
rapor üretir ve isteğe bağlı markdown raporu oluşturur.
"""

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


# Volleybox, Cloudflare bot korumasıyla GitHub runner IP'lerine "challenge" (403)
# dönebiliyor. Bu durumda bağlantının kırık olduğu söylenemez, sadece doğrulanamaz.
BLOCKED_PREFIX = "ENGELLENDI"

# Art arda bu kadar istek engellenirse tarama durdurulur (iş saatlerce sürmesin).
DEFAULT_MAX_CONSECUTIVE_BLOCKED = 10

# Rapor (ve GitHub issue gövdesi, limit 65536 karakter) şişmesin diye tablo satır sınırı.
MAX_REPORT_ROWS = 150

# Çıkış kodları
EXIT_OK = 0
EXIT_BROKEN = 1
EXIT_FILE_MISSING = 2
EXIT_BLOCKED = 3  # Doğrulama yapılamadı (bot koruması), kırık link kanıtı yok


def is_blocked_error(err: str) -> bool:
    return err.startswith(BLOCKED_PREFIX)


def check_url(url: str, timeout: int = 15) -> Tuple[bool, int, str]:
    """
    Belirtilen URL'e HTTP isteği gönderip durumu kontrol eder.
    Dönüş: (is_ok, status_code, error_message)
    Cloudflare challenge / 429 yanıtlarında hata mesajı BLOCKED_PREFIX ile başlar.
    """
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr,en-US;q=0.9,en;q=0.8",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            status = response.getcode()
            if status == 200:
                return True, status, ""
            return False, status, f"Beklenmeyen durum kodu: {status}"
    except urllib.error.HTTPError as e:
        if e.code == 429 or (e.headers and e.headers.get("cf-mitigated") == "challenge"):
            return False, e.code, f"{BLOCKED_PREFIX}: HTTP {e.code} (bot koruması / rate limit)"
        return False, e.code, f"HTTPError {e.code}: {e.reason}"
    except urllib.error.URLError as e:
        return False, 0, f"URLError: {e.reason}"
    except Exception as e:
        return False, 0, f"Hata: {str(e)}"


def verify_mappings(
    mappings_file: Path,
    delay: float = 1.5,
    timeout: int = 15,
    report_file: Path = None,
    mark_broken: bool = False,
    max_consecutive_blocked: int = DEFAULT_MAX_CONSECUTIVE_BLOCKED,
) -> int:
    if not mappings_file.exists():
        print(f"HATA: Eşleştirme dosyası bulunamadı: {mappings_file}", file=sys.stderr)
        return EXIT_FILE_MISSING

    with open(mappings_file, "r", encoding="utf-8") as f:
        data: Dict[str, Any] = json.load(f)

    mappings: List[Dict[str, Any]] = data.get("mappings", [])
    leagues: List[Dict[str, Any]] = data.get("leagues", [])
    print(f"Toplam takım eşleştirme kaydı: {len(mappings)}")
    print(f"Toplam lig eşleştirme kaydı: {len(leagues)}")

    # Benzersiz URL'leri topla
    unique_urls: Set[str] = set()
    for m in mappings + leagues:
        url = m.get("volleybox_url")
        if url:
            unique_urls.add(url.strip())

    total_urls = len(unique_urls)
    print(f"Denetlenecek benzersiz URL sayısı: {total_urls}")
    print(f"İstekler arası gecikme: {delay} sn\n" + "-" * 50)

    url_results: Dict[str, Tuple[bool, int, str]] = {}
    broken_urls: Dict[str, Tuple[int, str]] = {}
    blocked_count = 0
    consecutive_blocked = 0
    aborted = False

    for idx, url in enumerate(sorted(unique_urls), 1):
        print(f"[{idx}/{total_urls}] Kontrol ediliyor: {url} ... ", end="", flush=True)
        is_ok, status, err = check_url(url, timeout=timeout)

        url_results[url] = (is_ok, status, err)
        if is_ok:
            print("OK (200)")
            consecutive_blocked = 0
        elif is_blocked_error(err):
            print(f"ENGELLENDI ({status}) - doğrulanamadı")
            blocked_count += 1
            consecutive_blocked += 1
            if max_consecutive_blocked and consecutive_blocked >= max_consecutive_blocked:
                aborted = True
                print(
                    f"\nArt arda {consecutive_blocked} istek bot korumasına takıldı; "
                    "tarama erken durduruluyor."
                )
                break
        else:
            print(f"FAIL ({status}) - {err}")
            broken_urls[url] = (status, err)
            consecutive_blocked = 0

        if idx < total_urls:
            time.sleep(delay)

    print("-" * 50)
    checked = len(url_results)
    print(
        f"Kontrol tamamlandı. Kontrol edilen: {checked} / {total_urls}, "
        f"kırık link: {len(broken_urls)}, doğrulanamayan (engellenen): {blocked_count}"
    )

    # Kırık linkler varsa detayları listele
    broken_mappings: List[Tuple[Dict[str, Any], int, str]] = []
    if broken_urls:
        print("\nKIRIK BAĞLANTILAR DETAYI:")
        for m in mappings:
            url = m.get("volleybox_url")
            if url in broken_urls:
                status, err = broken_urls[url]
                broken_mappings.append((m, status, err))
                print(
                    f" - {m.get('internal_name')} ({m.get('internal_category')}): {url} -> {err}"
                )

        if mark_broken:
            print("\nEşleştirme dosyasında 'broken' işaretlemesi yapılıyor...")
            for m in mappings:
                if m.get("volleybox_url") in broken_urls:
                    m["confidence"] = "broken"
                    m["note"] = (
                        f"Kırık bağlantı ({time.strftime('%Y-%m-%d')}): {broken_urls[m['volleybox_url']][1]}"
                    )
            with open(mappings_file, "w", encoding="utf-8") as f:
                json.dump({"mappings": mappings}, f, ensure_ascii=False, indent=2)
            print("Eşleştirme dosyası güncellendi.")

    # Rapor dosyası istenmişse yaz
    if report_file:
        report_file.parent.mkdir(parents=True, exist_ok=True)
        with open(report_file, "w", encoding="utf-8") as rf:
            rf.write("# Volleybox Bağlantı Doğrulama Raporu\n\n")
            rf.write(f"- **Tarih:** {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}\n")
            rf.write(f"- **Toplam Eşleştirme:** {len(mappings)}\n")
            rf.write(f"- **Benzersiz URL:** {total_urls}\n")
            rf.write(f"- **Kontrol Edilen URL:** {checked}\n")
            rf.write(f"- **Kırık Link Sayısı:** {len(broken_urls)}\n")
            rf.write(f"- **Doğrulanamayan (bot koruması):** {blocked_count}\n\n")
            if aborted:
                rf.write(
                    "> Volleybox bot koruması (Cloudflare) istekleri engellediği için tarama "
                    "erken durduruldu. Bu durum bağlantıların kırık olduğu anlamına gelmez.\n\n"
                )

            if broken_mappings:
                rf.write("## Tespit Edilen Kırık Bağlantılar\n\n")
                rf.write("| Takım | Kategori | URL | Durum / Hata |\n")
                rf.write("| --- | --- | --- | --- |\n")
                for m, status, err in broken_mappings[:MAX_REPORT_ROWS]:
                    rf.write(
                        f"| {m.get('internal_name')} | {m.get('internal_category')} | [{m.get('volleybox_url')}]({m.get('volleybox_url')}) | {err} |\n"
                    )
                if len(broken_mappings) > MAX_REPORT_ROWS:
                    rf.write(
                        f"\n> Toplam {len(broken_mappings)} kırık bağlantıdan ilk "
                        f"{MAX_REPORT_ROWS} tanesi gösterildi. Tamamı için iş akışı günlüğüne bakın.\n"
                    )
                rf.write("\n> Lütfen bu bağlantıları güncelleyiniz veya siliniz.\n")
            elif blocked_count:
                rf.write("Kırık bağlantı tespit edilmedi; ancak bazı bağlantılar doğrulanamadı.\n")
            else:
                rf.write("Tüm bağlantılar başarıyla doğrulandı (HTTP 200 OK).\n")

        print(f"Rapor yazıldı: {report_file}")

    if broken_urls:
        return EXIT_BROKEN
    if blocked_count:
        return EXIT_BLOCKED
    return EXIT_OK


def main():
    parser = argparse.ArgumentParser(
        description="Volleybox profil bağlantılarını doğrula"
    )
    parser.add_argument(
        "--file",
        type=Path,
        default=Path("data/volleybox-mappings.json"),
        help="Eşleştirme JSON dosya yolu",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=1.5,
        help="İstekler arası gecikme (saniye, varsayılan: 1.5)",
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=15,
        help="HTTP istek zaman aşımı (saniye, varsayılan: 15)",
    )
    parser.add_argument(
        "--report-file",
        type=Path,
        default=None,
        help="Markdown rapor çıktısının yazılacağı dosya",
    )
    parser.add_argument(
        "--mark-broken",
        action="store_true",
        help="Kırık linkleri JSON dosyasında broken olarak işaretle",
    )
    parser.add_argument(
        "--max-consecutive-blocked",
        type=int,
        default=DEFAULT_MAX_CONSECUTIVE_BLOCKED,
        help="Art arda bu kadar istek bot korumasına takılırsa taramayı durdur (0: kapalı)",
    )
    args = parser.parse_args()

    exit_code = verify_mappings(
        mappings_file=args.file,
        delay=args.delay,
        timeout=args.timeout,
        report_file=args.report_file,
        mark_broken=args.mark_broken,
        max_consecutive_blocked=args.max_consecutive_blocked,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
