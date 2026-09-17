"""
scripts/parsers/istanbul.py
Resmi TVF İstanbul Voleybol İl Temsilciliği Veri Ayrıştırıcı Modülü.
Kaynaklar:
- Fikstür: https://istanbul.voleyboliltemsilciligi.com/Fiksturler
- Puan Durumu: https://istanbul.voleyboliltemsilciligi.com/PuanDurumu

YALNIZCA "Genç Kızlar Süper Lig" ve "Yıldız Kızlar Süper Lig" maçlarını hedefler ve filtreler.
"""

import os
import re
import json
import html
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Tuple

import httpx
from bs4 import BeautifulSoup

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
logger = logging.getLogger("IstanbulLiveParser")

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
OUTPUT_JSON = DATA_DIR / "fixtures.json"

CATEGORIES_CONFIG = [
    ("GKSL", "Genç Kızlar Süper Lig", "Genç"),
    ("GK1L", "Genç Kızlar 1. Ligi", "Genç"),
    ("YKSL", "Yıldız Kızlar Süper Lig", "Yıldız"),
]

HALL_STANDARDIZATION = {
    "50. Yıl Deniz Esinduy": "TVF 50. Yıl Deniz Esinduy",
    "Tozkoparan": "Tozkoparan Spor Salonu",
    "Şehit Mustafa Özel": "Şehit Mustafa Özel Spor Salonu",
    "Yakacıkito": "Yakacık İTO Spor Salonu",
    "Yakacık İto": "Yakacık İTO Spor Salonu",
    "Halkalı Ata 2. Salon": "Halkalı Ata 2. Spor Salonu",
    "Halkalı Ata 3. Salon": "Halkalı Ata 3. Spor Salonu",
}

TEAM_STANDARDIZATION = {
    "Eczacıbaşı": "Eczacıbaşı",
    "Fenerbahçe": "Fenerbahçe",
    "Beşiktaş": "Beşiktaş",
    "Galatasaray": "Galatasaray",
    "Vakıfbank": "VakıfBank",
    "Vakıfbank A": "VakıfBank A",
    "Vakıfbank B": "VakıfBank B",
    "Thy": "THY",
    "Thy A": "THY A",
    "Thy B": "THY B",
    "İbb": "İBB",
    "İnsped": "İnsped",
}

def clean_str(s: str) -> str:
    if not s:
        return ""
    # Unescape HTML entities (&nbsp;, &#231;, etc.)
    text = html.unescape(s).strip()
    # Normalize whitespaces
    text = re.sub(r"\s+", " ", text)
    return text

def standardize_hall(hall: str) -> str:
    cleaned = clean_str(hall)
    if not cleaned:
        return "Belirlenecek"
    for key, std in HALL_STANDARDIZATION.items():
        if key.lower() in cleaned.lower():
            return std
    return cleaned

def standardize_team(team: str) -> str:
    cleaned = clean_str(team)
    for key, std in TEAM_STANDARDIZATION.items():
        if cleaned.lower() == key.lower():
            return std
    return cleaned

def extract_form_state(soup: BeautifulSoup) -> Dict[str, str]:
    state = {}
    for inp in soup.find_all("input"):
        name = inp.get("name")
        if name:
            state[name] = inp.get("value", "")
    for sel in soup.find_all("select"):
        name = sel.get("name")
        if name:
            opt = sel.find("option", selected=True) or sel.find("option")
            state[name] = opt.get("value", "") if opt else ""
    return state

def update_state(state: Dict[str, str], delta_text: str) -> None:
    tokens = delta_text.split("|")
    for i in range(len(tokens)):
        if tokens[i] == "hiddenField" and i + 2 < len(tokens):
            state[tokens[i+1]] = tokens[i+2]

def decode_html(resp: httpx.Response) -> str:
    try:
        return resp.content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return resp.content.decode("windows-1254")
        except Exception:
            return resp.text

def fetch_istanbul_live_data() -> Dict[str, Any]:
    """
    Resmi istanbul.voleyboliltemsilciligi.com sitesinden
    Genç Kızlar Süper Lig ve Yıldız Kızlar Süper Lig için
    bütün fikstür maçlarını ve puan durumu tablolarını çeker.
    """
    logger.info("Resmi TVF İstanbul sitesine bağlanılıyor...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "X-MicrosoftAjax": "Delta=true",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    }

    client = httpx.Client(headers={"User-Agent": headers["User-Agent"]}, timeout=40.0, follow_redirects=True)

    # 1. PuanDurumu sayfasına GET
    puan_url = "https://istanbul.voleyboliltemsilciligi.com/PuanDurumu"
    res = client.get(puan_url)
    if res.status_code != 200:
        raise RuntimeError(f"PuanDurumu sayfasına erişilemedi: HTTP {res.status_code}")

    soup = BeautifulSoup(decode_html(res), "html.parser")
    state = extract_form_state(soup)

    # Post Kadın (B)
    p = state.copy()
    p["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlsbe"
    p["__EVENTTARGET"] = "ctl00$icerik$ddlsbe"
    p["__ASYNCPOST"] = "true"
    p["ctl00$icerik$ddlsbe"] = "B"
    r = client.post(puan_url, data=p, headers=headers)
    update_state(state, decode_html(r))

    all_matches = []
    all_standings = {}
    halls_set = set()
    match_counter = 1

    for kume_code, cat_name, age_group in CATEGORIES_CONFIG:
        logger.info(f"Kategori sorgulanıyor: {cat_name} ({kume_code})")
        p = state.copy()
        p["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlskume"
        p["__EVENTTARGET"] = "ctl00$icerik$ddlskume"
        p["__ASYNCPOST"] = "true"
        p["ctl00$icerik$ddlsbe"] = "B"
        p["ctl00$icerik$ddlskume"] = kume_code
        r = client.post(puan_url, data=p, headers=headers)
        r_text = decode_html(r)
        update_state(state, r_text)

        tokens = r_text.split("|")
        comps = []
        for i in range(len(tokens)):
            if tokens[i] == "updatePanel":
                s_panel = BeautifulSoup(tokens[i+2], "html.parser")
                comp_sel = s_panel.find("select", id="icerik_ddlSyarismaadi")
                if comp_sel:
                    for opt in comp_sel.find_all("option"):
                        val = opt.get("value")
                        txt = clean_str(opt.text)
                        if val and val not in ["0", "-1", "Seçiniz", "Seciniz"]:
                            comps.append((val, txt))

        logger.info(f"{cat_name} altında {len(comps)} grup bulundu.")

        for c_val, c_text in comps:
            group_label = c_text
            if " A Grubu" in c_text: group_name = "A Grubu"
            elif " B Grubu" in c_text: group_name = "B Grubu"
            elif " C Grubu" in c_text: group_name = "C Grubu"
            else: group_name = c_text

            standings_key = f"{cat_name} - {group_name}"
            logger.info(f"Grup verileri çekiliyor: {standings_key}")

            p_c = state.copy()
            p_c["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlSyarismaadi"
            p_c["__EVENTTARGET"] = "ctl00$icerik$ddlSyarismaadi"
            p_c["__ASYNCPOST"] = "true"
            p_c["ctl00$icerik$ddlsbe"] = "B"
            p_c["ctl00$icerik$ddlskume"] = kume_code
            p_c["ctl00$icerik$ddlSyarismaadi"] = c_val
            r_c = client.post(puan_url, data=p_c, headers=headers)
            r_c_text = decode_html(r_c)
            update_state(state, r_c_text)

            tokens_c = r_c_text.split("|")
            for k in range(len(tokens_c)):
                if tokens_c[k] == "updatePanel":
                    soup_c = BeautifulSoup(tokens_c[k+2], "html.parser")

                    # 1. Puan Durumu Tablosu (icerik_GvTemplate_1)
                    standings_table = soup_c.find("table", id=lambda x: x and "GvTemplate" in x)
                    group_standings = []
                    if standings_table:
                        rank_idx = 1
                        for tr in standings_table.find_all("tr")[1:]:
                            tds = [clean_str(td.text) for td in tr.find_all("td")]
                            if len(tds) >= 8:
                                team_name = standardize_team(tds[1])
                                try:
                                    played = int(tds[2]) if tds[2].isdigit() else 0
                                    won = int(tds[3]) if tds[3].isdigit() else 0
                                    lost = int(tds[4]) if tds[4].isdigit() else 0
                                    sets_won = int(tds[5]) if tds[5].isdigit() else 0
                                    sets_lost = int(tds[6]) if tds[6].isdigit() else 0
                                    points = int(tds[7]) if tds[7].isdigit() else 0
                                    set_ratio = tds[8] if len(tds) > 8 else "0.0"
                                    points_won = int(tds[9]) if len(tds) > 9 and tds[9].isdigit() else 0
                                    points_lost = int(tds[10]) if len(tds) > 10 and tds[10].isdigit() else 0
                                    point_ratio = tds[11] if len(tds) > 11 else "0.0"
                                except Exception:
                                    played = won = lost = sets_won = sets_lost = points = points_won = points_lost = 0
                                    set_ratio = point_ratio = "0.0"

                                group_standings.append({
                                    "rank": rank_idx,
                                    "team": team_name,
                                    "played": played,
                                    "won": won,
                                    "lost": lost,
                                    "points": points,
                                    "sets_won": sets_won,
                                    "sets_lost": sets_lost,
                                    "set_ratio": set_ratio,
                                    "points_won": points_won,
                                    "points_lost": points_lost,
                                    "point_ratio": point_ratio,
                                    "form": []
                                })
                                rank_idx += 1
                    all_standings[standings_key] = group_standings

                    # 2. Maç Listesi Tablosu (icerik_gvmusabakaliste)
                    matches_table = soup_c.find("table", id="icerik_gvmusabakaliste")
                    if matches_table:
                        for tr in matches_table.find_all("tr")[1:]:
                            tds = [clean_str(td.text) for td in tr.find_all("td")]
                            if len(tds) >= 8:
                                s_no = tds[0]
                                raw_date = tds[1]
                                raw_time = tds[2]
                                raw_hall = tds[3]
                                home = standardize_team(tds[4])
                                score_h = tds[5]
                                score_a = tds[6]
                                away = standardize_team(tds[7])
                                raw_sets = tds[8] if len(tds) > 8 else ""

                                # SADECE TARİHİ AÇIKLANAN MAÇLAR: Tarihi henüz girilmemiş olanları atla
                                if not raw_date or "." not in raw_date:
                                    continue

                                parts = raw_date.split(".")
                                if len(parts) == 3:
                                    iso_date = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"
                                else:
                                    continue

                                time_str = raw_time if raw_time else "--:--"
                                hall_str = standardize_hall(raw_hall)
                                if hall_str and hall_str != "Belirlenecek":
                                    halls_set.add(hall_str)

                                is_finished = bool(score_h and score_a and (score_h.isdigit() or score_a.isdigit()))
                                status = "finished" if is_finished else "upcoming"

                                score_str = f"{score_h} - {score_a}" if is_finished else "- : -"
                                h_score_val = int(score_h) if is_finished and score_h.isdigit() else None
                                a_score_val = int(score_a) if is_finished and score_a.isdigit() else None

                                # Set skorlarını yakala: (25-10) (25-14) (25-13)
                                set_scores = []
                                if raw_sets:
                                    found = re.findall(r"\((\d+-\d+)\)", raw_sets)
                                    if found:
                                        set_scores = found
                                    else:
                                        set_scores = [p.strip("()") for p in raw_sets.split() if "-" in p]

                                date_slug = iso_date.replace("-", "") if iso_date != "TBD" else "tbd"
                                match_id = f"ist-{date_slug}-{match_counter:03d}"
                                match_counter += 1

                                match_obj = {
                                    "id": match_id,
                                    "city": "İstanbul",
                                    "date": iso_date,
                                    "time": time_str,
                                    "hall": hall_str,
                                    "category": cat_name,
                                    "age_group": age_group,
                                    "gender": "Kız",
                                    "group": group_name,
                                    "match_no": s_no,
                                    "home_team": home,
                                    "away_team": away,
                                    "score": score_str,
                                    "home_score": h_score_val,
                                    "away_score": a_score_val,
                                    "set_scores": set_scores,
                                    "status": status,
                                }
                                all_matches.append(match_obj)

                                # Puan durumu form dizisini güncelle
                                if is_finished and standings_key in all_standings:
                                    h_won = (h_score_val or 0) > (a_score_val or 0)
                                    for st in all_standings[standings_key]:
                                        if st["team"] == home:
                                            st["form"].append("W" if h_won else "L")
                                        elif st["team"] == away:
                                            st["form"].append("L" if h_won else "W")

    # Form dizilerini son 5 maça sınırla
    for grp in all_standings:
        for st in all_standings[grp]:
            st["form"] = st["form"][-5:]

    # Tarihe göre sırala: Önce oynanmış ve takvimi belli maçlar, en son TBD maçlar
    def sort_key(m):
        d = m["date"]
        t = m["time"]
        if d == "TBD":
            return ("9999-99-99", "99:99")
        return (d, t)

    all_matches.sort(key=sort_key)

    halls_list = sorted(list(halls_set))
    if "TVF 50. Yıl Deniz Esinduy" not in halls_list:
        halls_list.insert(0, "TVF 50. Yıl Deniz Esinduy")

    result = {
        "updated_at": datetime.now().isoformat(),
        "city": "İstanbul",
        "slug": "istanbul",
        "title": "TVF İstanbul Genç & Yıldız Ligleri",
        "total_matches": len(all_matches),
        "source": "https://istanbul.voleyboliltemsilciligi.com",
        "filters": {
            "categories": ["Tümü", "Genç Kızlar Süper Lig", "Genç Kızlar 1. Ligi", "Yıldız Kızlar Süper Lig"],
            "age_groups": ["Tümü", "Genç", "Yıldız"],
            "genders": ["Kız"],
            "halls": ["Tümü"] + halls_list,
        },
        "standings": all_standings,
        "matches": all_matches,
    }

    return result

def save_fixtures_to_json(data: Dict[str, Any], output_path: Path = OUTPUT_JSON) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Mevcut dosyadaki volleybox verilerini koru
    if output_path.exists():
        try:
            with open(output_path, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
            existing_matches = existing_data.get("matches", [])
            vb_lookup: Dict[str, Any] = {}
            for em in existing_matches:
                vb = em.get("volleybox")
                if vb and vb.get("synced"):
                    key = f"{em.get('home_team','').strip()}|{em.get('away_team','').strip()}|{em.get('date','')}"
                    vb_lookup[key] = vb
                    if em.get("id"):
                        vb_lookup[em["id"]] = vb
            if vb_lookup:
                merged = 0
                for nm in data.get("matches", []):
                    if nm.get("volleybox", {}).get("synced"):
                        continue
                    key = f"{nm.get('home_team','').strip()}|{nm.get('away_team','').strip()}|{nm.get('date','')}"
                    vb = vb_lookup.get(key) or vb_lookup.get(nm.get("id"))
                    if vb:
                        nm["volleybox"] = vb
                        merged += 1
                if merged:
                    logger.info(f"{merged} maçın mevcut Volleybox verisi korundu.")
        except Exception as e:
            logger.warning(f"Volleybox veri koruma sırasında hata (devam ediliyor): {e}")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Veriler başarıyla yazıldı: {output_path} (Toplam {data['total_matches']} maç)")

    city_path = DATA_DIR / "cities" / "istanbul.json"
    city_path.parent.mkdir(parents=True, exist_ok=True)
    with open(city_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Şehir dosyası güncellendi: {city_path}")

if __name__ == "__main__":
    data = fetch_istanbul_live_data()
    save_fixtures_to_json(data)
