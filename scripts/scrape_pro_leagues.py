"""
TVF Profesyonel Ligler Scraper & Volleybox Eşleştirici
-------------------------------------------------------
Vodafone Sultanlar Ligi ve KFC Kadınlar 1. Ligi (ve isteğe bağlı Kadınlar 2. Ligi)
resmi TVF puan durumlarını ve fikstürlerini çeker, Volleybox maçlarıyla senkronize eder.

Kullanım:
    python scripts/scrape_pro_leagues.py              # Sultanlar Ligi ve 1. Lig (Varsayılan)
    python scripts/scrape_pro_leagues.py --sultanlar  # Yalnızca Sultanlar Ligi
    python scripts/scrape_pro_leagues.py --1-lig      # Yalnızca KFC Kadınlar 1. Ligi
    python scripts/scrape_pro_leagues.py --2-lig      # Yalnızca Kadınlar 2. Ligi
    python scripts/scrape_pro_leagues.py --all        # Sultanlar + 1. Lig + 2. Lig
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime

# Windows terminal UTF-8 encoding support
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from scripts.scrape_sultanlar_ligi import main as run_sultanlar
from scripts.scrape_kadinlar_1_lig import main as run_kadinlar_1
from scripts.scrape_kadinlar_2_lig import main as run_kadinlar_2


def main():
    parser = argparse.ArgumentParser(description="TVF Profesyonel Ligler Scraper")
    parser.add_argument("--sultanlar", action="store_true", help="Yalnızca Vodafone Sultanlar Ligi'ni çek")
    parser.add_argument("--1-lig", dest="kadinlar_1", action="store_true", help="Yalnızca KFC Kadınlar 1. Ligi'ni çek")
    parser.add_argument("--2-lig", dest="kadinlar_2", action="store_true", help="Yalnızca Kadınlar 2. Ligi'ni çek")
    parser.add_argument("--all", action="store_true", help="Sultanlar + 1. Lig + 2. Lig tamamını çek")
    args = parser.parse_args()

    # Varsayılan: Eğer spesifik bayrak belirtilmemişse Sultanlar + 1. Lig çalıştırılır
    run_all = args.all
    run_sult = run_all or args.sultanlar or (not args.sultanlar and not args.kadinlar_1 and not args.kadinlar_2)
    run_k1 = run_all or args.kadinlar_1 or (not args.sultanlar and not args.kadinlar_1 and not args.kadinlar_2)
    run_k2 = run_all or args.kadinlar_2

    print("=" * 80)
    print("🏆 TVF PROFESYONEL LİGLER VERİ SENKRONİZASYONU")
    print(f"⏰ Başlangıç Zamanı: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    results = {}

    if run_sult:
        print("\n" + "#" * 70)
        print("🌟 1. VODAFONE SULTANLAR LİGİ")
        print("#" * 70)
        try:
            results["Sultanlar Ligi"] = run_sultanlar()
        except Exception as e:
            print(f"❌ Sultanlar Ligi hatası: {e}")
            results["Sultanlar Ligi"] = False

    if run_k1:
        print("\n" + "#" * 70)
        print("⚡ 2. KFC KADINLAR 1. LİGİ")
        print("#" * 70)
        try:
            results["Kadınlar 1. Ligi"] = run_kadinlar_1()
        except Exception as e:
            print(f"❌ Kadınlar 1. Ligi hatası: {e}")
            results["Kadınlar 1. Ligi"] = False

    if run_k2:
        print("\n" + "#" * 70)
        print("🏐 3. KADINLAR 2. LİGİ")
        print("#" * 70)
        try:
            run_kadinlar_2()
            results["Kadınlar 2. Ligi"] = True
        except Exception as e:
            print(f"❌ Kadınlar 2. Ligi hatası: {e}")
            results["Kadınlar 2. Ligi"] = False

    print("\n" + "=" * 80)
    print("📋 ÖZET SONUÇLAR:")
    for league, status in results.items():
        icon = "✅ BAŞARILI" if status else "❌ BAŞARISIZ"
        print(f"   • {league}: {icon}")
    print("=" * 80 + "\n")

    all_success = all(results.values())
    sys.exit(0 if all_success else 1)


if __name__ == "__main__":
    main()
