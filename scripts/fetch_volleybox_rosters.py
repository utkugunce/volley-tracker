#!/usr/bin/env python3
"""
scripts/fetch_volleybox_rosters.py
Volleybox.net üzerindeki takımların kadro (roster) ve oyuncu listelerini çeker,
mevkileri Türkçeleştirir ve data/team-rosters.json dosyasına kaydeder.

Kullanım:
    python scripts/fetch_volleybox_rosters.py --limit 10
    python scripts/fetch_volleybox_rosters.py --city istanbul
    python scripts/fetch_volleybox_rosters.py --team VakıfBank
    python scripts/fetch_volleybox_rosters.py --all
"""

import os
import sys
import re
import json
import time
import argparse
from pathlib import Path
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
MAPPINGS_FILE = DATA_DIR / "volleybox-mappings.json"
ROSTERS_FILE = DATA_DIR / "team-rosters.json"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Gerekli kütüphaneler
try:
    from bs4 import BeautifulSoup
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    HAS_CURL_CFFI = False
    try:
        from bs4 import BeautifulSoup
        import httpx
    except ImportError:
        print("[HATA] curl_cffi veya httpx ile beautifulsoup4 yüklü olmalıdır.")
        sys.exit(1)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
}

POSITION_MAP = {
    "setter": "Pasör",
    "outside hitter": "Smaçör",
    "wing spiker": "Smaçör",
    "middle-blocker": "Orta Oyuncu",
    "middle blocker": "Orta Oyuncu",
    "opposite": "Pasör Çaprazı",
    "libero": "Libero",
    "head coach": "Başantrenör",
    "coach assistant": "Yardımcı Antrenör",
    "assistant coach": "Yardımcı Antrenör",
    "sports director": "Takım Menajeri",
    "team manager": "Takım Menajeri",
    "statistician": "İstatistikçi",
    "scoutman": "İstatistikçi",
    "physiotherapist": "Fizyoterapist",
    "doctor": "Doktor",
    "fitness coach": "Kondisyoner",
}

COACH_KEYWORDS = [
    "coach", "antrenör", "trainer", "director", "manager",
    "scout", "statistician", "physio", "doktor", "fitness", "staff"
]

def translate_position(raw_pos: str) -> str:
    if not raw_pos:
        return "Bilinmiyor"
    p_lower = raw_pos.strip().lower()
    for eng, tr in POSITION_MAP.items():
        if eng in p_lower:
            return tr
    return raw_pos.strip()

def is_coach_position(raw_pos: str) -> bool:
    if not raw_pos:
        return False
    p_lower = raw_pos.strip().lower()
    return any(k in p_lower for k in COACH_KEYWORDS)

def extract_team_id(url: str) -> Optional[str]:
    """Örn: https://women.volleybox.net/vakfbank-u18-t19499 -> t19499"""
    m = re.search(r"-t(\d+)$", url.strip())
    if m:
        return f"t{m.group(1)}"
    m2 = re.search(r"/t(\d+)$", url.strip())
    if m2:
        return f"t{m2.group(1)}"
    # Yedek: slug sonundaki tXXXX
    parts = url.rstrip("/").split("/")[-1].split("-")
    for p in reversed(parts):
        if p.startswith("t") and p[1:].isdigit():
            return p
    return None

def fetch_html(session: Any, url: str) -> Optional[str]:
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 200:
            return resp.text
        elif resp.status_code == 429:
            print(f"  [UYARI] Rate limit (429)! 5 saniye bekleniyor...")
            time.sleep(5)
            return None
        else:
            print(f"  [HATA] HTTP {resp.status_code} - {url}")
            return None
    except Exception as e:
        print(f"  [HATA] İstek başarısız ({url}): {e}")
        return None

def parse_team_page(html: str, team_url: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    
    title_el = soup.find("h1")
    raw_name = ""
    if title_el:
        for badge in title_el.find_all(["span", "small", "sup", "sub"]):
            badge.decompose()
        raw_name = title_el.get_text(strip=True)
    if not raw_name:
        raw_name = team_url.split("/")[-1]
    cleaned_name = raw_name


    season_boxes = soup.find_all("section", class_="season-box")
    seasons_data: Dict[str, Any] = {}

    current_year = datetime.now().year

    for sb in season_boxes:
        h = sb.find(["h2", "h3", "h4"])
        season_title = h.get_text(strip=True) if h else ""
        m = re.search(r"(\d{4}/\d{2})", season_title)
        season_key = m.group(1) if m else season_title
        if not season_key:
            continue

        # Oyuncu ve antrenör satırlarını tara
        players: List[Dict[str, Any]] = []
        staff: List[Dict[str, Any]] = []
        heights: List[int] = []
        ages: List[int] = []

        for row in sb.find_all(class_="team-roster-row"):
            # 1. Numara
            num_input = row.find("input")
            number = ""
            if num_input and num_input.get("value"):
                number = num_input.get("value", "").strip()
            if not number:
                num_cell = row.find(class_="team-roster-number")
                if num_cell:
                    number = num_cell.get_text(strip=True)

            # 2. İsim & Link
            name_cell = row.find(class_="team-roster-name")
            name_a = name_cell.find("a") if name_cell else None
            p_name = name_a.get_text(strip=True) if name_a else (name_cell.get_text(strip=True) if name_cell else "")
            p_url = name_a.get("href") if name_a else ""
            if p_url and not p_url.startswith("http"):
                p_url = f"https://women.volleybox.net{p_url}"
            p_id = name_a.get("data-id") if name_a else ""

            if not p_name:
                continue

            # 3. Pozisyon
            pos_el = row.find(class_="team-roster-position")
            orig_pos = pos_el.get_text(strip=True) if pos_el else ""
            tr_pos = translate_position(orig_pos)
            is_coach = is_coach_position(orig_pos)

            # 4. Boy
            h_el = row.find(class_="team-roster-height")
            height_str = h_el.get_text(strip=True) if h_el else ""
            height_cm: Optional[int] = None
            if "cm" in height_str:
                m_h = re.search(r"(\d+)\s*cm", height_str)
                if m_h:
                    height_cm = int(m_h.group(1))

            # 5. Doğum yılı / Yaş
            b_el = row.find(class_="team-roster-birthday")
            b_str = b_el.get_text(strip=True) if b_el else ""
            birth_year: Optional[int] = None
            age: Optional[int] = None
            m_b = re.search(r"(\d{4})", b_str)
            if m_b:
                birth_year = int(m_b.group(1))
                if 1950 <= birth_year <= current_year:
                    age = current_year - birth_year

            # 6. Ülke & Bayrak
            flag_img = row.find("img", class_="middleFlag")
            nationality = flag_img.get("alt", "").strip() if flag_img else "Turkey"
            flag_url = flag_img.get("src", "").strip() if flag_img else "https://volleybox.net/media/img/flags/TR.png"

            item = {
                "id": p_id or None,
                "name": p_name,
                "number": number or None,
                "position": tr_pos,
                "position_original": orig_pos or None,
                "height_cm": height_cm,
                "birth_year": birth_year,
                "age": age,
                "nationality": nationality,
                "flag_url": flag_url,
                "profile_url": p_url or None,
                "is_coach": is_coach,
            }

            if is_coach:
                staff.append(item)
            else:
                players.append(item)
                if height_cm:
                    heights.append(height_cm)
                if age:
                    ages.append(age)

        if players or staff:
            avg_h = round(sum(heights) / len(heights), 1) if heights else None
            avg_a = round(sum(ages) / len(ages), 1) if ages else None

            # Pozisyonlara göre gruplama sayısı
            pos_counts: Dict[str, int] = {}
            for pl in players:
                pos = pl["position"]
                pos_counts[pos] = pos_counts.get(pos, 0) + 1

            seasons_data[season_key] = {
                "season": season_key,
                "total_players": len(players),
                "total_staff": len(staff),
                "avg_height_cm": avg_h,
                "avg_age": avg_a,
                "position_counts": pos_counts,
                "players": players,
                "staff": staff,
            }

    return {
        "team_name": cleaned_name,
        "volleybox_url": team_url,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "seasons": seasons_data,
    }

def main():
    parser = argparse.ArgumentParser(description="Volleybox Kadro Çekme Scripti")
    parser.add_argument("--team", type=str, help="Sadece ismi eşleşen takımı tara (örn: 'VakıfBank')")
    parser.add_argument("--city", type=str, help="Sadece bu şehre ait takımları tara (örn: 'istanbul')")
    parser.add_argument("--league", type=str, help="Sadece bu lige ait takımları tara (örn: 'Kadınlar 2. Ligi')")
    parser.add_argument("--limit", type=int, help="Maksimum taranacak takım sayısı")
    parser.add_argument("--delay", type=float, default=0.6, help="İstekler arası bekleme süresi (sn)")
    parser.add_argument("--force", action="store_true", help="Zaten çekilmiş takımları tekrar tara")
    parser.add_argument("--all", action="store_true", help="Tüm eşleşmiş takımları tara")
    args = parser.parse_args()

    print("🏐 VOLLEYBOX KADRO ÇEKME MOTORU")
    print("=" * 60)

    if not MAPPINGS_FILE.exists():
        print(f"[HATA] {MAPPINGS_FILE} bulunamadı.")
        sys.exit(1)

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    mappings = mappings_data.get("mappings", [])

    # Benzersiz Volleybox URL'lerini ve takım bilgilerini topla
    teams_to_scrape: Dict[str, Dict[str, Any]] = {}
    for m in mappings:
        u = (m.get("volleybox_url") or "").strip()
        if not u or m.get("confidence") == "broken":
            continue
        t_id = extract_team_id(u)
        if not t_id:
            continue

        # Lig filtresi
        if args.league:
            cat = (m.get("internal_category") or "").lower()
            if args.league.lower() not in cat:
                continue

        # Şehir veya takım filtresi
        if args.city:
            c_slug = (m.get("city_slug") or m.get("city") or "").lower()
            if args.city.lower() not in c_slug:
                continue

        if args.team:
            int_n = (m.get("internal_name") or "").lower()
            match_n = (m.get("matched_as") or "").lower()
            if args.team.lower() not in int_n and args.team.lower() not in match_n:
                continue

        if t_id not in teams_to_scrape:
            teams_to_scrape[t_id] = {
                "id": t_id,
                "url": u,
                "matched_as": m.get("matched_as"),
                "internal_name": m.get("internal_name"),
                "city": m.get("city"),
            }

    print(f"📌 Taranacak benzersiz takım sayısı: {len(teams_to_scrape)}")

    # Mevcut veriyi yükle
    existing_rosters: Dict[str, Any] = {}
    if ROSTERS_FILE.exists():
        try:
            with open(ROSTERS_FILE, "r", encoding="utf-8") as f:
                existing_rosters = json.load(f)
            print(f"📦 Mevcut veritabanında {len(existing_rosters)} takım kaydı yüklendi.")
        except Exception:
            existing_rosters = {}

    target_list = list(teams_to_scrape.values())
    if not args.force:
        target_list = [t for t in target_list if t["id"] not in existing_rosters or not existing_rosters[t["id"]].get("seasons")]

    if args.limit:
        target_list = target_list[:args.limit]

    print(f"🚀 Taranacak net hedef takım sayısı: {len(target_list)}")
    if not target_list:
        print("✅ Taranacak yeni takım bulunamadı. Tüm hedefler zaten güncel!")
        return

    # HTTP Client oluştur
    if HAS_CURL_CFFI:
        session = cffi_requests.Session(impersonate="chrome120")
        session.headers.update(HEADERS)
    else:
        session = httpx.Client(headers=HEADERS, follow_redirects=True, timeout=15)

    success_count = 0
    empty_count = 0

    try:
        for idx, t in enumerate(target_list, start=1):
            t_id = t["id"]
            url = t["url"]
            name = t["matched_as"] or t["internal_name"]
            print(f"[{idx}/{len(target_list)}] 🔍 {name} ({t_id})...", end="", flush=True)

            html = fetch_html(session, url)
            if not html:
                print(" [BAŞARISIZ]")
                continue

            parsed = parse_team_page(html, url)
            parsed["matched_as"] = t["matched_as"]
            parsed["internal_name"] = t["internal_name"]
            parsed["city"] = t["city"]
            parsed["team_id"] = t_id

            s_count = len(parsed["seasons"])
            p_total = sum(s["total_players"] for s in parsed["seasons"].values())

            existing_rosters[t_id] = parsed

            if p_total > 0:
                print(f" ✅ {s_count} sezon, {p_total} toplam oyuncu kaydı")
                success_count += 1
            else:
                print(f" ⚠️ Sayfa açıldı ancak henüz kadro girilmemiş")
                empty_count += 1

            # Her 5 takımda bir dosyaya yaz (güvenli kaydetme)
            if idx % 5 == 0 or idx == len(target_list):
                with open(ROSTERS_FILE, "w", encoding="utf-8") as f:
                    json.dump(existing_rosters, f, ensure_ascii=False, indent=2)

            time.sleep(args.delay)

    except KeyboardInterrupt:
        print("\n[BİLGİ] Kullanıcı tarafından durduruldu. Mevcut veriler kaydediliyor...")
    finally:
        with open(ROSTERS_FILE, "w", encoding="utf-8") as f:
            json.dump(existing_rosters, f, ensure_ascii=False, indent=2)
        print("\n" + "=" * 60)
        print(f"🎉 TAMAMLANDI! Toplam {len(existing_rosters)} takım veritabanında saklandı.")
        print(f"📁 Dosya: {ROSTERS_FILE}")

if __name__ == "__main__":
    main()
