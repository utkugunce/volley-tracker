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
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

# Eğer mevcut ortamda bs4/httpx yoksa ve .venv mevcutsa otomatik .venv python ile çalıştır
try:
    from bs4 import BeautifulSoup
    import httpx
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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Upgrade-Insecure-Requests": "1",
}

CITY_STOPWORDS = {
    "istanbul", "izmir", "ankara", "bursa", "nigde", "yalova", "antalya", "duzce", 
    "adana", "konya", "samsun", "trabzon", "kocaeli", "sakarya", "tekirdag", 
    "mersin", "gaziantep", "kayseri", "denizli", "eskisehir", "turkiye",
    "alanya", "manavgat", "kepez", "kemer", "gazipasa"
}

GENERIC_WORDS = {
    "sk", "gsk", "kulubu", "kulub", "spor", "bld", "belediyesi", 
    "belediyespor", "belediye", "voleybol", "atletik", "akademi",
    "koleji", "kolej", "okullari", "okulu"
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
    s = s.replace(".", "")
    # Yaş kategorilerini ve kulüp eklerini temizle
    s = re.sub(r"\s+u\d+", "", s)
    s = re.sub(r"\bthy\b", "turk hava yollari", s)
    pattern = r"\b(" + "|".join(GENERIC_WORDS) + r")\b"
    s = re.sub(pattern, "", s)
    s = re.sub(r"[^a-z0-9]", "", s)
    return s.strip()


def extract_team_meta(name: str) -> Tuple[str, Optional[str]]:
    """
    Takım isminden ana kök ismi ve varsa takım harfini ('a', 'b') ayıklar.
    Örn: 'Eczacıbaşı A' -> ('eczacibasi', 'a')
         'VakıfBank - B U16' -> ('vakifbank', 'b')
         'THY A' -> ('turk hava yollari', 'a')
         'Sarıyer Konak Spor Kulübü U16' -> ('sariyer konak', None)
    """
    if not name:
        return "", None
    s = name.strip().lower()
    s = (
        s.replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
        .replace("İ", "i")
    )
    s = s.replace(".", "")
    s = re.sub(r"\s+u\d+", "", s)
    s = re.sub(r"\bthy\b", "turk hava yollari", s)

    # Takım harfi (A veya B) tespiti:
    # Hem parantezli (a)/(b), hem tireli - a/- b, hem de boşluklu a/b formatlarını yakala
    letter = None
    m_letter = re.search(r"(?:[\s\-_]+|\()([abc])(?:\s*[\)]|\s+|$)", s)
    if m_letter:
        letter = m_letter.group(1).lower()
        s = s[:m_letter.start()] + " " + s[m_letter.end():]

    pattern = r"\b(" + "|".join(GENERIC_WORDS) + r")\b"
    s = re.sub(pattern, " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    base = " ".join(s.split())
    return base, letter


def team_match_score(tvf_name: str, vb_name: str, synonyms: set) -> int:
    # 0. Doğrudan veya Synonym / Alias Eşleşmesi (En Yüksek Öncelik):
    # Özel harf dönüşümleri (örn: Dost A = Dost Spor - B U18, Dost B = Dost Spor - C U18)
    for syn in synonyms:
        s_norm = normalize_name(syn)
        v_norm = normalize_name(vb_name)
        if s_norm and v_norm and (s_norm == v_norm or s_norm in v_norm or v_norm in s_norm):
            return 100
        s_base, s_letter = extract_team_meta(syn)
        vb_base, vb_letter = extract_team_meta(vb_name)
        if s_base and vb_base and (s_base == vb_base or s_base.replace(" ", "") == vb_base.replace(" ", "")):
            if s_letter is not None and s_letter == vb_letter:
                return 100

    tvf_base, tvf_letter = extract_team_meta(tvf_name)
    vb_base, vb_letter = extract_team_meta(vb_name)

    if not tvf_base or not vb_base:
        return 0

    # 1. Harf (A / B / C) uyumu kontrolü:
    if tvf_letter and vb_letter and tvf_letter != vb_letter:
        return 0
    if tvf_letter in ("b", "c") and vb_letter != tvf_letter:
        return 0
    if vb_letter in ("b", "c") and tvf_letter != vb_letter:
        return 0

    # 2. İsim kökü kontrolü:
    tvf_compact = tvf_base.replace(" ", "")
    vb_compact = vb_base.replace(" ", "")

    if tvf_compact == vb_compact:
        return 100

    # 3. Alt kelime (substring) kontrolü:
    if tvf_compact not in CITY_STOPWORDS and vb_compact not in CITY_STOPWORDS:
        if (len(tvf_compact) >= 4 and tvf_compact in vb_compact) or (len(vb_compact) >= 4 and vb_compact in tvf_compact):
            return 70

    # 4. Kelime bazlı eşleşme (en az 3 harfli kelimeler):
    tvf_words = [w for w in tvf_base.split() if len(w) >= 3 and w not in CITY_STOPWORDS]
    vb_words = [w for w in vb_base.split() if len(w) >= 3 and w not in CITY_STOPWORDS]
    if any(w in vb_words for w in tvf_words):
        return 50

    return 0


def is_team_compatible(tvf_name: str, vb_name: str, synonyms: set) -> bool:
    return team_match_score(tvf_name, vb_name, synonyms) > 0


def extract_tournament_id(url: str) -> Optional[str]:
    # Örn: https://women.volleybox.net/women-stanbul-super-ligi-u18-2026-27-o50864 -> 50864
    m = re.search(r"-o(\d+)", url)
    return m.group(1) if m else None


def fetch_volleybox_tournament_matches(tournament_url: str) -> List[Dict[str, Any]]:
    tournament_id = extract_tournament_id(tournament_url)
    if not tournament_id:
        return []

    matches_url = tournament_url.rstrip("/") + "/matches"

    try:
        client = httpx.Client(headers=HEADERS, timeout=15.0, follow_redirects=True)
        resp = client.get(matches_url)
        if resp.status_code == 429:
            print(f"  [UYARI] Volleybox hız sınırına (429) ulaşıldı ({tournament_url.split('/')[-1]}). Mevcut veriler korunuyor.")
            client.close()
            return []
        resp.raise_for_status()
        html = resp.text
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
        try:
            r_resp = client.get(round_url)
            if r_resp.status_code == 429:
                print(f"  [UYARI] Round {rid} için hız sınırına (429) ulaşıldı, ana sayfadaki maçlar kullanılıyor.")
                break
            r_resp.raise_for_status()
            r_soup = BeautifulSoup(r_resp.text, "html.parser")
            boxes = r_soup.find_all("div", class_=lambda c: c and "match_box" in str(c))
            all_match_boxes.extend(boxes)
            time.sleep(1.0)
        except Exception as ex:
            print(f"  [UYARI] Round {rid} maçları çekilemedi ({round_url}): {ex}")

    client.close()

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
        arena_name = b.get("data-hid_arena_name") or ""
        hour_time = b.get("data-hid_hour_time")
        date_val = b.get("data-hid_date")

        # Tarih ve Saat (Türkiye saati UTC+3)
        tr_tz = timezone(timedelta(hours=3))
        match_date = ""
        match_time = None

        if hour_time and hour_time.isdigit():
            try:
                dt = datetime.fromtimestamp(int(hour_time), tz=tr_tz)
                match_date = dt.strftime("%Y-%m-%d")
                match_time = dt.strftime("%H:%M")
            except Exception:
                pass
        elif date_val and date_val.isdigit():
            try:
                dt = datetime.fromtimestamp(int(date_val), tz=tr_tz)
                match_date = dt.strftime("%Y-%m-%d")
                match_time = dt.strftime("%H:%M")
            except Exception:
                pass

        if not match_date:
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

        has_score = False
        score_str = None
        if host_sets is not None and guest_sets is not None:
            try:
                h_sets = int(host_sets)
                g_sets = int(guest_sets)
                # Voleybolda maç skoru 0-0 olamaz; bir takım en az 1 set almışsa skor girilmiştir
                if h_sets > 0 or g_sets > 0:
                    has_score = True
                    score_str = f"{h_sets} - {g_sets}"
            except (ValueError, TypeError):
                pass

        parsed_matches.append({
            "match_id": m_id,
            "host_name": host,
            "guest_name": guest,
            "date": match_date,
            "time": match_time,
            "arena": arena_name.strip() if arena_name else "",
            "score": score_str,
            "has_score": has_score,
            "url": m_link,
            "round": round_name
        })

    return parsed_matches


def normalize_hall_name(hall: str) -> str:
    if not hall:
        return ""
    s = hall.strip().lower()
    s = (
        s.replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
        .replace("İ", "i")
    )
    s = re.sub(r"\b(spor|salonu|kompleksi|merkezi|sahasi|tesisleri|kucuk|buyuk)\b", " ", s)
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    return " ".join(s.split())


def halls_match(tvf_hall: str, vb_hall: str) -> bool:
    if not tvf_hall or not vb_hall:
        return True
    
    t_clean = normalize_hall_name(tvf_hall)
    v_clean = normalize_hall_name(vb_hall)
    if not t_clean or not v_clean:
        return True

    # 4 karakter ve üzeri kelimelerin kontrolü
    t_words = [w for w in t_clean.split() if len(w) >= 4]
    if not t_words:
        t_words = [w for w in t_clean.split() if len(w) >= 3]

    if not t_words:
        return True

    return any(w in v_clean for w in t_words)


def check_discrepancy(tvf_match: Dict[str, Any], vb_match: Dict[str, Any]) -> Dict[str, Any]:
    tvf_date = tvf_match.get("date", "")
    tvf_time = tvf_match.get("time", "")
    tvf_hall = tvf_match.get("hall", "")

    vb_date = vb_match.get("date", "")
    vb_time = vb_match.get("time")
    vb_hall = vb_match.get("arena", "")

    date_diff = False
    time_diff = False
    hall_diff = False
    details_list = []

    # 1. Tarih farkı
    if tvf_date and tvf_date != "TBD" and vb_date and tvf_date != vb_date:
        date_diff = True
        details_list.append(f"Tarih Değişti (TVF: {tvf_date} / VB: {vb_date})")

    # 2. Saat farkı (vb_time "00:00" veya None ise saat henüz girilmemiş demektir, fark sayılmaz)
    if tvf_time and tvf_time != "--:--" and vb_time and vb_time != "00:00" and tvf_time != vb_time:
        time_diff = True
        details_list.append(f"Saat Değişti (TVF: {tvf_time} / VB: {vb_time})")

    # 3. Salon / Yer farkı
    if tvf_hall and tvf_hall not in ("TBD", "Belirtilmedi", "-") and vb_hall:
        if not halls_match(tvf_hall, vb_hall):
            hall_diff = True
            details_list.append(f"Salon Değişti (TVF: {tvf_hall} / VB: {vb_hall})")

    has_diff = date_diff or time_diff or hall_diff
    return {
        "has_diff": has_diff,
        "date_diff": date_diff,
        "time_diff": time_diff,
        "hall_diff": hall_diff,
        "vb_date": vb_date or None,
        "vb_time": vb_time if vb_time != "00:00" else None,
        "vb_hall": vb_hall or None,
        "details": " | ".join(details_list) if details_list else None
    }


def match_tvf_with_vb(
    tvf_match: Dict[str, Any], 
    vb_matches: List[Dict[str, Any]], 
    team_alias_map: Dict[str, set],
    used_vb_ids: Optional[set] = None
) -> Optional[Dict[str, Any]]:
    tvf_home = tvf_match.get("home_team", "")
    tvf_away = tvf_match.get("away_team", "")
    tvf_date = tvf_match.get("date", "")

    home_synonyms = team_alias_map.get(tvf_home.lower().strip(), set())
    away_synonyms = team_alias_map.get(tvf_away.lower().strip(), set())

    best_vb = None
    best_score = -1

    for vb in vb_matches:
        if used_vb_ids and vb["match_id"] in used_vb_ids:
            continue

        vb_host = vb["host_name"]
        vb_guest = vb["guest_name"]
        vb_date = vb.get("date", "")

        s_dir_h = team_match_score(tvf_home, vb_host, home_synonyms)
        s_dir_a = team_match_score(tvf_away, vb_guest, away_synonyms)
        direct_compatible = (s_dir_h > 0 and s_dir_a > 0)

        s_rev_h = team_match_score(tvf_home, vb_guest, home_synonyms)
        s_rev_a = team_match_score(tvf_away, vb_host, away_synonyms)
        rev_compatible = (s_rev_h > 0 and s_rev_a > 0)

        if not (direct_compatible or rev_compatible):
            continue

        # Sezon yılı ve tarih uyumluluğu kontrolü:
        # TVF fikstürleri 2026/27 sezonuna aittir (Ağustos 2026 - Temmuz 2027).
        # Volleybox'taki 2025 veya daha eski tarihli maçlar ASLA 2026/27 maçlarıyla eşleşemez!
        if vb_date:
            try:
                d_vb = datetime.strptime(vb_date, "%Y-%m-%d")
                if d_vb.year < 2026 or (d_vb.year == 2026 and d_vb.month < 8):
                    continue
            except Exception:
                if str(vb_date).startswith("2025") or str(vb_date).startswith("2024") or str(vb_date).startswith("2023"):
                    continue

        if tvf_date and vb_date and tvf_date != "TBD":
            try:
                d1 = datetime.strptime(tvf_date, "%Y-%m-%d")
                d2 = datetime.strptime(vb_date, "%Y-%m-%d")
                diff = abs((d1 - d2).days)
                if diff > 30:
                    continue
                if d1.year >= 2026 and d2.year < 2026:
                    continue
            except Exception:
                pass

        if direct_compatible:
            base_team_score = s_dir_h + s_dir_a + 5
        else:
            base_team_score = s_rev_h + s_rev_a

        date_score = 0
        if tvf_date and vb_date and tvf_date != "TBD":
            if tvf_date == vb_date:
                date_score = 100
            else:
                try:
                    d1 = datetime.strptime(tvf_date, "%Y-%m-%d")
                    d2 = datetime.strptime(vb_date, "%Y-%m-%d")
                    diff = abs((d1 - d2).days)
                    if diff == 1:
                        date_score = 50
                    elif diff <= 7:
                        date_score = 25
                    elif diff <= 14:
                        date_score = 10
                    elif diff <= 30:
                        date_score = 2
                    else:
                        continue
                except Exception:
                    pass
        else:
            date_score = 20

        total_score = base_team_score + date_score
        if total_score > best_score:
            best_score = total_score
            best_vb = vb

    if best_vb and used_vb_ids is not None:
        used_vb_ids.add(best_vb["match_id"])

    return best_vb


def normalize_tourn_key(cat: str, city: str) -> str:
    c = (city or "").replace("İ", "i").replace("I", "i").lower().replace("\u0307", "").strip()
    k = (cat or "").replace("İ", "i").replace("I", "i").lower().replace("\u0307", "").strip()
    return f"{k}::{c}"


def sync_fixtures_file(fixtures_path: Path, vb_tournaments: Dict[str, List[Dict[str, Any]]], team_alias_map: Dict[str, set]) -> Tuple[int, int]:
    if not fixtures_path.exists():
        return 0, 0

    with open(fixtures_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    matches = data.get("matches", [])
    synced_count = 0
    total_count = len(matches)
    used_vb_ids = set()

    for m in matches:
        cat = m.get("category", "")
        city = m.get("city") or ("İstanbul" if fixtures_path.name == "fixtures.json" else fixtures_path.stem)
        
        # Uygun Volleybox turnuvasını bul (Kategori, İl ve Yaş Grubu esnekliğiyle)
        age_group = m.get("age_group", "")
        age_code = (
            "u18" if "genç" in age_group.lower() or "genc" in age_group.lower() or "u18" in cat.lower() or "genç" in cat.lower()
            else ("u16" if "yıldız" in age_group.lower() or "yildiz" in age_group.lower() or "u16" in cat.lower() or "yıldız" in cat.lower() else "")
        )

        tourn_key = normalize_tourn_key(cat, city)
        vb_m_list = vb_tournaments.get(tourn_key) or vb_tournaments.get(f"{cat}::{city}".lower())
        if not vb_m_list and age_code:
            vb_m_list = (
                vb_tournaments.get(f"{normalize_name(city)}::{age_code}".lower())
                or vb_tournaments.get(f"{city}::{age_code}".lower()) 
            )
        if not vb_m_list:
            old_vb = m.get("volleybox", {})
            if old_vb.get("synced"):
                vb_d = str(old_vb.get("vb_date") or "")
                vb_url = str(old_vb.get("url") or "")
                # Eski sezona (2025/26) ait hatalı eşleşmeleri temizle
                if vb_d.startswith("2025") or vb_d.startswith("2024") or "-2025-26-" in vb_url:
                    m["volleybox"] = {
                        "synced": False,
                        "match_id": None,
                        "url": None,
                        "host_name": None,
                        "guest_name": None,
                        "score": None,
                        "has_score": False,
                        "vb_date": None,
                        "vb_time": None,
                        "vb_hall": None,
                        "discrepancy": {"has_diff": False}
                    }
                else:
                    # Mevcut doğrulanmış 2026/27 eşleşmesini koru
                    synced_count += 1
            else:
                m["volleybox"] = {
                    "synced": False,
                    "match_id": None,
                    "url": None,
                    "host_name": None,
                    "guest_name": None,
                    "score": None,
                    "has_score": False,
                    "vb_date": None,
                    "vb_time": None,
                    "vb_hall": None,
                    "discrepancy": {"has_diff": False}
                }
            continue

        matched_vb = match_tvf_with_vb(m, vb_m_list, team_alias_map, used_vb_ids)
        if matched_vb:
            discrepancy = check_discrepancy(m, matched_vb)
            m["volleybox"] = {
                "synced": True,
                "match_id": matched_vb["match_id"],
                "url": matched_vb["url"],
                "host_name": matched_vb["host_name"],
                "guest_name": matched_vb["guest_name"],
                "score": matched_vb.get("score"),
                "has_score": matched_vb.get("has_score", False),
                "vb_date": matched_vb.get("date"),
                "vb_time": matched_vb.get("time") if matched_vb.get("time") != "00:00" else None,
                "vb_hall": matched_vb.get("arena") or None,
                "discrepancy": discrepancy
            }
            synced_count += 1
        else:
            m["volleybox"] = {
                "synced": False,
                "match_id": None,
                "url": None,
                "host_name": None,
                "guest_name": None,
                "score": None,
                "has_score": False,
                "vb_date": None,
                "vb_time": None,
                "vb_hall": None,
                "discrepancy": {
                    "has_diff": False
                }
            }


    # Manuel düzeltmeleri (manual overrides) koru - scrape işlemi elle girilen skorları ezemez
    overrides_file = DATA_DIR / "manual-overrides.json"
    if overrides_file.exists():
        try:
            with open(overrides_file, "r", encoding="utf-8") as f:
                ov_data = json.load(f)
                manual_overrides = ov_data.get("overrides", {})
                for m in matches:
                    m_id = m.get("id")
                    if m_id in manual_overrides:
                        ov = manual_overrides[m_id]
                        if ov.get("home_score") is not None:
                            m["home_score"] = ov["home_score"]
                        if ov.get("away_score") is not None:
                            m["away_score"] = ov["away_score"]
                        if ov.get("set_scores"):
                            m["set_scores"] = ov["set_scores"]
                        if ov.get("status"):
                            m["status"] = ov["status"]
                        m["manual_override"] = True
        except Exception as e:
            print(f"⚠️ Manuel overrides yüklenirken hata: {e}")

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

    # 1. Takım takma adları (aliases / synonyms) haritasını oluştur
    team_alias_map = {}
    for item in mappings_data.get("mappings", []):
        in_name = item.get("internal_name", "").strip()
        matched = item.get("matched_as", "").strip()
        aliases = item.get("aliases", []) or []
        synonyms = item.get("synonyms", []) or []
        all_names = [in_name, matched] + aliases + synonyms
        for n in all_names:
            if n:
                k = n.strip().lower()
                for target in all_names:
                    if target:
                        team_alias_map.setdefault(k, set()).add(target.strip())

    # Aktif şehirleri belirle
    active_city_names = {"istanbul", "izmir", "yalova", "nigde"}
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
    if CITIES_DIR.exists():
        for cj in CITIES_DIR.glob("*.json"):
            try:
                with open(cj, "r", encoding="utf-8") as f:
                    cdata = json.load(f)
                    if len(cdata.get("matches", [])) > 0:
                        active_city_names.add(cj.stem.lower())
                        if "city" in cdata:
                            active_city_names.add(normalize_name(cdata["city"]))
                            active_city_names.add(cdata["city"].lower())
            except Exception:
                pass

    # 2. Kayıtlı lig turnuva sayfalarından maçları çek
    leagues = mappings_data.get("leagues", [])
    CURRENT_SEASON = "2026/27"
    
    # Filtrele: args.city veya aktif iller (SADECE 2026/27 sezonu!)
    target_leagues = []
    for l in leagues:
        # Sezon kontrolü: Eski sezonlara (örn. 2025/26) ait turnuvalar asla 2026/27 fikstürüne bağlanamaz
        season = (l.get("season") or "").strip()
        url = (l.get("volleybox_url") or "").strip()
        if season and season != CURRENT_SEASON:
            continue
        if "-2025-26-" in url or "-2024-25-" in url or "-2023-24-" in url:
            continue

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

    print(f"📋 Toplam {len(target_leagues)} aktif ({CURRENT_SEASON} sezonu) turnuva taranıyor...")

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

        age_cat = l.get("age_category", "").lower()
        if city:
            vb_tournaments[normalize_tourn_key(internal_name, city)] = vb_matches
            vb_tournaments[f"{internal_name}::{city}".lower()] = vb_matches
            if age_cat:
                vb_tournaments[f"{city}::{age_cat}".lower()] = vb_matches
                vb_tournaments[f"{normalize_name(city)}::{age_cat}".lower()] = vb_matches
        time.sleep(0.8)

    # 3. data/fixtures.json senkronizasyonu
    if not args.city or args.city.lower() == "istanbul":
        print("\n🔄 data/fixtures.json senkronize ediliyor...")
        ist_synced, ist_total = sync_fixtures_file(FIXTURES_FILE, vb_tournaments, team_alias_map)
        print(f"✅ İstanbul Bülteni: {ist_synced} / {ist_total} maç Volleybox ile eşleşti!")

    # 4. data/cities/*.json dosyalarının senkronizasyonu
    if CITIES_DIR.exists():
        for city_json in CITIES_DIR.glob("*.json"):
            if args.city:
                stem = city_json.stem.lower()
                c_norm = normalize_name(stem)
                arg_norm = normalize_name(args.city.lower())
                if stem != args.city.lower() and c_norm != arg_norm:
                    continue
            c_synced, c_total = sync_fixtures_file(city_json, vb_tournaments, team_alias_map)
            if c_total > 0:
                print(f"✅ {city_json.name:<18} : {c_synced} / {c_total} maç Volleybox ile eşleşti.")

    print("\n" + "=" * 75)
    print("🎉 VOLLEYBOX MAÇ SENKRONİZASYONU BAŞARIYLA TAMAMLANDI!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    main()
