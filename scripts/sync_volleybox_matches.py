#!/usr/bin/env python3
"""
scripts/sync_volleybox_matches.py
TVF resmi maçları ile Volleybox.net üzerindeki maçları senkronize eden motor.

Volleybox turnuva sayfalarındaki (/matches ve /ajax/get_matches) maçları çeker,
data/fixtures.json ve data/cities/*.json dosyalarındaki maçlarla karşılaştırır
ve her maça Volleybox senkronizasyon durumunu ve doğrudan maç bağlantısını ekler.

Kullanım:
    python scripts/sync_volleybox_matches.py
    python scripts/sync_volleybox_matches.py --city istanbul
"""

import os
import sys
import re
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Eğer mevcut ortamda bs4 yoksa ve .venv mevcutsa otomatik .venv python ile çalıştır
try:
    from bs4 import BeautifulSoup
except ImportError:
    venv_py = BASE_DIR / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python")
    if venv_py.exists():
        import subprocess
        sys.exit(subprocess.call([str(venv_py)] + sys.argv))
    raise

DATA_DIR = BASE_DIR / "data"
MAPPINGS_FILE = DATA_DIR / "volleybox-mappings.json"
FIXTURES_FILE = DATA_DIR / "fixtures.json"
CITIES_DIR = DATA_DIR / "cities"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr,en-US;q=0.9,en;q=0.8",
    "X-Requested-With": "XMLHttpRequest",
}


def normalize_name(name: str) -> str:
    if not name:
        return ""
    s = name.strip().lower()
    # Türkçe karakter normalizasyonu
    s = (
        s.replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
        .replace("İ", "i")
    )
    # Yaş kategorilerini ve kulüp eklerini temizle
    s = re.sub(r"\s+u\d+", "", s)
    s = re.sub(r"\b(sk|kulubu|kulub|spor|bld|belediyesi|belediyespor|voleybol|atletik|akademi)\b", "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s.strip()


def extract_tournament_id(url: str) -> Optional[str]:
    # Örn: https://women.volleybox.net/women-stanbul-super-ligi-u18-2026-27-o50864 -> 50864
    m = re.search(r"-o(\d+)", url)
    return m.group(1) if m else None


def fetch_volleybox_tournament_matches(tournament_url: str) -> List[Dict[str, Any]]:
    tournament_id = extract_tournament_id(tournament_url)
    if not tournament_id:
        return []

    matches_url = tournament_url.rstrip("/") + "/matches"
    req = urllib.request.Request(matches_url, headers=HEADERS)

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  [UYARI] Turnuva sayfası okunamadı ({tournament_url}): {e}")
        return []

    soup = BeautifulSoup(html, "html.parser")
    
    # 1. Tur / Round butonlarını bul
    round_ids = set()
    r_div = soup.find("div", class_="matches_tournament_rounds")
    if r_div:
        for btn in r_div.find_all("button"):
            onclick = btn.get("onclick", "")
            m = re.search(r"changeTournamentRound\(\s*\d+\s*,\s*(\d+)\s*\)", onclick)
            if m:
                round_ids.add(m.group(1))

    # Eğer round butonu yoksa varsayılan 1
    if not round_ids:
        round_ids.add("1")

    all_match_boxes = []

    # 2. Her round için maçları topla (GET matches_url?round_id=X)
    for rid in sorted(round_ids, key=lambda x: int(x) if x.isdigit() else 0):
        round_url = f"{matches_url}?round_id={rid}"
        round_req = urllib.request.Request(round_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(round_req, timeout=15) as resp:
                r_html = resp.read().decode("utf-8", errors="ignore")
                r_soup = BeautifulSoup(r_html, "html.parser")
                boxes = r_soup.find_all("div", class_=lambda c: c and "match_box" in str(c))
                all_match_boxes.extend(boxes)
        except Exception as ex:
            print(f"  [UYARI] Round {rid} maçları çekilemedi ({round_url}): {ex}")

    # Eğer round'lardan hiç maç gelmediyse ana sayfadaki match_box'ları al
    if not all_match_boxes:
        all_match_boxes = soup.find_all("div", class_=lambda c: c and "match_box" in str(c))

    parsed_matches = []
    seen_ids = set()

    for b in all_match_boxes:
        m_id = b.get("data-hid_match_id") or b.get("data-id")
        if not m_id or m_id in seen_ids:
            continue
        seen_ids.add(m_id)

        host = b.get("data-hid_host_name", "")
        guest = b.get("data-hid_guest_name", "")
        host_sets = b.get("data-hid_host_sets")
        guest_sets = b.get("data-hid_guest_sets")
        round_name = b.get("data-hid_round_name", "")
        
        # Tarih
        time_tag = b.find("time", class_="date")
        dt_iso = time_tag.get("datetime", "") if time_tag else ""
        match_date = dt_iso.split("T")[0] if "T" in dt_iso else ""

        # Volleybox Maç Bağlantısı
        m_link = None
        for a in b.find_all("a"):
            href = a.get("href", "")
            if f"-c{m_id}" in href:
                m_link = href if href.startswith("http") else f"https://women.volleybox.net{href}"
                break
        if not m_link:
            m_link = f"https://women.volleybox.net/m{m_id}"

        score_str = None
        if host_sets is not None and guest_sets is not None and (host_sets != "" or guest_sets != ""):
            score_str = f"{host_sets} - {guest_sets}"

        parsed_matches.append({
            "match_id": m_id,
            "host_name": host,
            "guest_name": guest,
            "date": match_date,
            "score": score_str,
            "url": m_link,
            "round": round_name
        })

    return parsed_matches


def match_tvf_with_vb(tvf_match: Dict[str, Any], vb_matches: List[Dict[str, Any]], team_alias_map: Dict[str, set]) -> Optional[Dict[str, Any]]:
    tvf_home = tvf_match.get("home_team", "")
    tvf_away = tvf_match.get("away_team", "")
    tvf_date = tvf_match.get("date", "")

    tvf_home_norm = normalize_name(tvf_home)
    tvf_away_norm = normalize_name(tvf_away)

    home_synonyms = team_alias_map.get(tvf_home.lower().strip(), {tvf_home_norm}) | {tvf_home_norm}
    away_synonyms = team_alias_map.get(tvf_away.lower().strip(), {tvf_away_norm}) | {tvf_away_norm}

    for vb in vb_matches:
        vb_host_norm = normalize_name(vb["host_name"])
        vb_guest_norm = normalize_name(vb["guest_name"])
        vb_date = vb.get("date", "")

        # Tarih kontrolü (Eğer TVF tarihi açıklanmışsa)
        date_matches = False
        if tvf_date and tvf_date != "TBD" and vb_date:
            # Tarihler aynı gün veya saat dilimi farkı nedeniyle +/- 1 gün tolerans
            if tvf_date == vb_date:
                date_matches = True
            else:
                try:
                    d1 = datetime.strptime(tvf_date, "%Y-%m-%d")
                    d2 = datetime.strptime(vb_date, "%Y-%m-%d")
                    if abs((d1 - d2).days) <= 1:
                        date_matches = True
                except Exception:
                    pass
        elif not tvf_date or tvf_date == "TBD":
            # Tarih henüz açıklanmamışsa sadece takımlardan eşleştir
            date_matches = True

        # Takım kontrolü: Doğrudan veya çapraz eşleşme
        teams_direct = (
            (vb_host_norm in home_synonyms or any(s in vb_host_norm for s in home_synonyms if len(s) > 3)) and
            (vb_guest_norm in away_synonyms or any(s in vb_guest_norm for s in away_synonyms if len(s) > 3))
        )
        teams_reversed = (
            (vb_host_norm in away_synonyms or any(s in vb_host_norm for s in away_synonyms if len(s) > 3)) and
            (vb_guest_norm in home_synonyms or any(s in vb_guest_norm for s in home_synonyms if len(s) > 3))
        )

        if (teams_direct or teams_reversed) and date_matches:
            return vb

    return None


def sync_fixtures_file(fixtures_path: Path, vb_tournaments: Dict[str, List[Dict[str, Any]]], team_alias_map: Dict[str, set]) -> Tuple[int, int]:
    if not fixtures_path.exists():
        return 0, 0

    with open(fixtures_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    matches = data.get("matches", [])
    synced_count = 0
    total_count = len(matches)

    for m in matches:
        cat = m.get("category", "")
        city = m.get("city", "İstanbul")
        
        # Uygun Volleybox turnuvasını bul
        tourn_key = f"{cat}::{city}".lower()
        vb_m_list = vb_tournaments.get(tourn_key)
        if not vb_m_list:
            # Kategori bazlı fallback
            tourn_key_alt = cat.lower()
            vb_m_list = vb_tournaments.get(tourn_key_alt, [])

        matched_vb = match_tvf_with_vb(m, vb_m_list, team_alias_map)
        if matched_vb:
            m["volleybox"] = {
                "synced": True,
                "match_id": matched_vb["match_id"],
                "url": matched_vb["url"],
                "host_name": matched_vb["host_name"],
                "guest_name": matched_vb["guest_name"],
                "score": matched_vb["score"]
            }
            synced_count += 1
        else:
            m["volleybox"] = {
                "synced": False,
                "match_id": None,
                "url": None,
                "host_name": None,
                "guest_name": None,
                "score": None
            }

    data["matches"] = matches
    data["volleybox_synced_matches"] = synced_count
    data["volleybox_sync_updated_at"] = datetime.now().isoformat()

    with open(fixtures_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return synced_count, total_count


def main():
    import argparse
    parser = argparse.ArgumentParser(description="TVF - Volleybox Maç Senkronizasyonu")
    parser.add_argument("--city", default=None, help="Belirli bir şehri senkronize et (örn: istanbul, izmir)")
    parser.add_argument("--all", action="store_true", help="Tüm 32 turnuvayı tara (varsayılan: sadece aktif fikstürü olan iller)")
    args = parser.parse_args()

    print("\n" + "=" * 75)
    print("🏐 TVF - VOLLEYBOX MAÇ SENKRONİZASYON MOTORU")
    print("=" * 75)

    if not MAPPINGS_FILE.exists():
        print(f"❌ Hata: {MAPPINGS_FILE} bulunamadı!")
        sys.exit(1)

    with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
        mappings_data = json.load(f)

    # 1. Takım takma adları (synonyms) haritasını oluştur
    team_alias_map = {}
    for item in mappings_data.get("mappings", []):
        in_name = item.get("internal_name", "").strip()
        matched = item.get("matched_as", "").strip()
        if in_name:
            key = in_name.lower()
            team_alias_map.setdefault(key, set()).add(normalize_name(in_name))
            if matched:
                team_alias_map[key].add(normalize_name(matched))

    # Aktif şehirleri belirle
    active_city_names = {"istanbul", "izmir"}
    if FIXTURES_FILE.exists():
        active_city_names.add("istanbul")
    cities_index = DATA_DIR / "cities.json"
    if cities_index.exists():
        try:
            with open(cities_index, "r", encoding="utf-8") as f:
                c_data = json.load(f)
                for c in c_data.get("cities", []):
                    if c.get("matches_count", 0) > 0:
                        active_city_names.add(normalize_name(c.get("name", "")))
                        active_city_names.add(c.get("slug", "").lower())
        except Exception:
            pass

    # 2. Kayıtlı lig turnuva sayfalarından maçları çek
    leagues = mappings_data.get("leagues", [])
    
    # Filtrele: args.city veya aktif iller
    target_leagues = []
    for l in leagues:
        c_name = l.get("city", "")
        c_slug = l.get("city_slug", "")
        c_norm = normalize_name(c_name)
        if args.city:
            if args.city.lower() in [c_slug.lower(), c_norm, c_name.lower()]:
                target_leagues.append(l)
        elif args.all:
            target_leagues.append(l)
        else:
            if c_slug.lower() in active_city_names or c_norm in active_city_names:
                target_leagues.append(l)

    print(f"📋 Toplam {len(target_leagues)} aktif turnuva taranıyor...")

    vb_tournaments: Dict[str, List[Dict[str, Any]]] = {}

    for l in target_leagues:
        url = l.get("volleybox_url")
        internal_name = l.get("internal_name", "")
        city = l.get("city", "")
        if not url:
            continue

        print(f"🔍 Volleybox turnuvası taranıyor: {internal_name} ({city}) -> {url.split('/')[-1]}")
        vb_matches = fetch_volleybox_tournament_matches(url)
        print(f"   -> {len(vb_matches)} maç tespit edildi.")

        if city:
            vb_tournaments[f"{internal_name}::{city}".lower()] = vb_matches
        vb_tournaments[internal_name.lower()] = vb_matches
        time.sleep(0.3)

    # 3. data/fixtures.json senkronizasyonu
    print("\n🔄 data/fixtures.json senkronize ediliyor...")
    ist_synced, ist_total = sync_fixtures_file(FIXTURES_FILE, vb_tournaments, team_alias_map)
    print(f"✅ İstanbul Bülteni: {ist_synced} / {ist_total} maç Volleybox ile eşleşti!")

    # 4. data/cities/*.json dosyalarının senkronizasyonu
    if CITIES_DIR.exists():
        for city_json in CITIES_DIR.glob("*.json"):
            c_synced, c_total = sync_fixtures_file(city_json, vb_tournaments, team_alias_map)
            if c_total > 0:
                print(f"✅ {city_json.name:<18} : {c_synced} / {c_total} maç Volleybox ile eşleşti.")

    print("\n" + "=" * 75)
    print("🎉 VOLLEYBOX MAÇ SENKRONİZASYONU BAŞARIYLA TAMAMLANDI!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
