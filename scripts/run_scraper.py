"""
scripts/run_scraper.py
Terminalden çalıştırılan ana TVF Voleybol bülteni tetikleyicisi.
Resmi İstanbul Voleybol İl Temsilciliği (https://istanbul.voleyboliltemsilciligi.com)
üzerinden Genç Kızlar Süper Lig ve Yıldız Kızlar Süper Lig maç ve puan durumu
verilerini çeker ve data/fixtures.json dosyasına aktarır.

Kullanım:
    python scripts/run_scraper.py
    python scripts/run_scraper.py --city istanbul
"""

import os
import sys
import argparse
import json
from pathlib import Path
from datetime import datetime

# scripts/ modül yolunu ekle
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Eğer mevcut ortamda httpx yoksa ve .venv mevcutsa otomatik .venv python ile çalıştır
try:
    import httpx
except ImportError:
    venv_py = BASE_DIR / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python")
    if venv_py.exists():
        import subprocess
        sys.exit(subprocess.call([str(venv_py)] + sys.argv))
    raise

from scripts.parsers.istanbul import fetch_istanbul_live_data, save_fixtures_to_json, logger

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

def print_summary_banner(data: dict, output_path: Path):
    matches = data.get("matches", [])
    standings = data.get("standings", {})
    
    finished_count = sum(1 for m in matches if m.get("status") == "finished")
    scheduled_count = sum(1 for m in matches if m.get("status") == "upcoming" and m.get("date") != "TBD")
    tbd_count = sum(1 for m in matches if m.get("date") == "TBD")

    print("\n" + "=" * 70)
    print(f"[*] TVF İSTANBUL VOLEYBOL İL TEMSİLCİLİĞİ - CANLI VERİ RAPORU")
    print("=" * 70)
    print(f"  Kaynak        : {data.get('source')}")
    print(f"  Hedef Ligler  : Genç Kızlar Süper Lig & Yıldız Kızlar Süper Lig")
    print(f"  Çıktı Dosyası : {output_path}")
    print(f"  Toplam Maç    : {len(matches)}")
    print(f"    - Oynanmış  : {finished_count}")
    print(f"    - Planlanmış: {scheduled_count}")
    print(f"    - Fikstür   : {tbd_count}")
    print("-" * 70)
    
    print("\n🏆 PUAN DURUMU LİDERLERİ:")
    for group_name, items in standings.items():
        if items:
            leader = items[0]
            print(f"  * {group_name:<34} : {leader['team']} ({leader['points']} Puan | O:{leader['played']} G:{leader['won']})")
            
    print("\n⚡ YAKINDAKİ / OYNANMIŞ MAÇLAR (İLK 8):")
    active_matches = [m for m in matches if m.get("date") != "TBD"]
    for m in active_matches[:8]:
        status_tag = "[BITTI]" if m.get("status") == "finished" else "[PLAN ]"
        score_display = m.get("score") if m.get("status") == "finished" else f"{m.get('time')} @"
        print(f"  {status_tag} {m.get('date')} | {m.get('home_team')} {score_display} {m.get('away_team')} ({m.get('category')} - {m.get('group')})")

    print("=" * 70 + "\n")

def main():
    parser = argparse.ArgumentParser(description="TVF İstanbul Voleybol Ligleri Canlı Veri Çekici")
    parser.add_argument("--city", default="istanbul", help="Hedef şehir (varsayılan: istanbul)")
    parser.add_argument("--output", default="data/fixtures.json", help="Çıktı JSON dosya yolu")
    args = parser.parse_args()

    output_path = BASE_DIR / args.output
    logger.info("TVF İstanbul veri boru hattı başlatılıyor...")

    try:
        data = fetch_istanbul_live_data()
        save_fixtures_to_json(data, output_path)
        print_summary_banner(data, output_path)
    except Exception as e:
        logger.error(f"Veri çekme sırasında hata: {e}")
        # Eğer internet bağlantısı yoksa ve fixtures.json varsa onu kontrol et
        if output_path.exists():
            logger.warning("Mevcut data/fixtures.json dosyası kullanılıyor.")
            with open(output_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            print_summary_banner(data, output_path)
        else:
            sys.exit(1)

if __name__ == "__main__":
    main()
