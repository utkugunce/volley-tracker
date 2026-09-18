"""
scripts/scrape_all_provinces.py
Türkiye Voleybol Federasyonu (TVF) 81 İl Temsilciliği Canlı Tarama ve Veri Motoru.
Terminalde gerçek zamanlı görsel ilerleme çubuğu (Progress Bar) gösterir.
"""

import os
import sys
import re
import json
import html
import time
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_DIR = Path(__file__).resolve().parent.parent

# Eğer mevcut ortamda httpx yoksa ve .venv mevcutsa otomatik .venv python ile çalıştır
try:
    import httpx
    from bs4 import BeautifulSoup
except ImportError:
    venv_py = BASE_DIR / ".venv" / ("Scripts" if sys.platform == "win32" else "bin") / ("python.exe" if sys.platform == "win32" else "python")
    if venv_py.exists():
        import subprocess
        sys.exit(subprocess.call([str(venv_py)] + sys.argv))
    raise
DATA_DIR = BASE_DIR / "data"
CITIES_DIR = DATA_DIR / "cities"
CITIES_INDEX_JSON = DATA_DIR / "cities.json"
FIXTURES_JSON = DATA_DIR / "fixtures.json"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

CITIES_DIR.mkdir(parents=True, exist_ok=True)

# İstanbul için test edilmiş parser
sys.path.append(str(BASE_DIR))
try:
    from scripts.parsers.istanbul import fetch_istanbul_live_data
except ImportError:
    fetch_istanbul_live_data = None

# Resmi 81 İl Plaka ve İsim Tablosu
OFFICIAL_CITIES = {
    1: "Adana", 2: "Adıyaman", 3: "Afyonkarahisar", 4: "Ağrı", 5: "Amasya",
    6: "Ankara", 7: "Antalya", 8: "Artvin", 9: "Aydın", 10: "Balıkesir",
    11: "Bilecik", 12: "Bingöl", 13: "Bitlis", 14: "Bolu", 15: "Burdur",
    16: "Bursa", 17: "Çanakkale", 18: "Çankırı", 19: "Çorum", 20: "Denizli",
    21: "Diyarbakır", 22: "Edirne", 23: "Elazığ", 24: "Erzincan", 25: "Erzurum",
    26: "Eskişehir", 27: "Gaziantep", 28: "Giresun", 29: "Gümüşhane", 30: "Hakkari",
    31: "Hatay", 32: "Isparta", 33: "Mersin", 34: "İstanbul", 35: "İzmir",
    36: "Kars", 37: "Kastamonu", 38: "Kayseri", 39: "Kırklareli", 40: "Kırşehir",
    41: "Kocaeli", 42: "Konya", 43: "Kütahya", 44: "Malatya", 45: "Manisa",
    46: "Kahramanmaraş", 47: "Mardin", 48: "Muğla", 49: "Muş", 50: "Nevşehir",
    51: "Niğde", 52: "Ordu", 53: "Rize", 54: "Sakarya", 55: "Samsun",
    56: "Siirt", 57: "Sinop", 58: "Sivas", 59: "Tekirdağ", 60: "Tokat",
    61: "Trabzon", 62: "Tunceli", 63: "Şanlıurfa", 64: "Uşak", 65: "Van",
    66: "Yozgat", 67: "Zonguldak", 68: "Aksaray", 69: "Bayburt", 70: "Karaman",
    71: "Kırıkkale", 72: "Batman", 73: "Şırnak", 74: "Bartın", 75: "Ardahan",
    76: "Iğdır", 77: "Yalova", 78: "Karabük", 79: "Kilis", 80: "Osmaniye",
    81: "Düzce"
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "X-MicrosoftAjax": "Delta=true",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
}

def clean_str(s: str) -> str:
    if not s: return ""
    text = html.unescape(s).strip()
    return re.sub(r"\s+", " ", text)

def extract_group_name(c_text: str) -> str:
    cleaned = clean_str(c_text)
    cleaned = re.sub(r"^(?:Genç|Yıldız|Küçük|Midi)\s+Kızlar\s+(?:1\.\s*Lig(?:i)?|Süper\s*Lig(?:i)?)\s*", "", cleaned, flags=re.I).strip()
    cleaned = re.sub(r"^(?:Süper|1\.)\s*Lig\s*", "", cleaned, flags=re.I).strip()
    return cleaned or clean_str(c_text)

def decode_html(resp: httpx.Response) -> str:
    try:
        return resp.content.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return resp.content.decode("windows-1254")
        except Exception:
            return resp.text

def render_progress(current: int, total: int, plate: str, city_name: str, status_msg: str):
    percent = (current / total) * 100
    bar_width = 24
    filled = int(bar_width * current // total)
    bar = "█" * filled + "░" * (bar_width - filled)
    plate_str = f"[{int(plate):02d}]" if plate and plate.isdigit() else "[--]"
    
    line = f"[{current:2d}/{total}] [{bar}] {percent:5.1f}% | {plate_str} {city_name:<14} : {status_msg}"
    
    if sys.stdout.isatty():
        sys.stdout.write(f"\r{line}")
        sys.stdout.flush()
    else:
        print(line)
        sys.stdout.flush()

def build_volleybox_name_resolver():
    mappings_file = DATA_DIR / "volleybox-mappings.json"
    if not mappings_file.exists():
        return lambda name, cat="", city="": name
    try:
        with open(mappings_file, "r", encoding="utf-8") as f:
            d = json.load(f)
        mappings = d.get("mappings", [])
    except Exception:
        return lambda name, cat="", city="": name

    def norm(s):
        if not s: return ""
        return s.strip().lower().replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")

    def extract_age(cat):
        c = norm(cat)
        if "genc" in c or "u18" in c: return "u18"
        if "yildiz" in c or "u16" in c: return "u16"
        return ""

    lookup_exact = {}
    lookup_age_city = {}
    lookup_cat = {}
    lookup_age = {}
    lookup_city = {}
    lookup_general = {}

    for m in mappings:
        matched_as = m.get("matched_as")
        if not matched_as:
            continue
        names = [m.get("internal_name"), *(m.get("aliases") or []), *(m.get("synonyms") or [])]
        city = norm(m.get("city") or m.get("city_slug"))
        cat = norm(m.get("internal_category"))
        age = extract_age(m.get("internal_category") or m.get("age_category"))

        for n in names:
            if not n: continue
            nn = norm(n)
            if city and cat: lookup_exact[(nn, cat, city)] = matched_as
            if city and age: lookup_age_city[(nn, age, city)] = matched_as
            if cat: lookup_cat[(nn, cat)] = matched_as
            if age: lookup_age[(nn, age)] = matched_as
            if city: lookup_city[(nn, city)] = matched_as
            if nn not in lookup_general: lookup_general[nn] = matched_as

    def resolve(team_name, category="", city=""):
        if not team_name: return team_name
        nn = norm(team_name)
        c = norm(category)
        ct = norm(city)
        age = extract_age(category)

        if ct and c and (nn, c, ct) in lookup_exact: return lookup_exact[(nn, c, ct)]
        if ct and age and (nn, age, ct) in lookup_age_city: return lookup_age_city[(nn, age, ct)]
        if c and (nn, c) in lookup_cat: return lookup_cat[(nn, c)]
        if age and (nn, age) in lookup_age: return lookup_age[(nn, age)]
        if ct and (nn, ct) in lookup_city: return lookup_city[(nn, ct)]
        if nn in lookup_general: return lookup_general[nn]
        return team_name

    return resolve

RESOLVE_TEAM_NAME = build_volleybox_name_resolver()

def apply_volleybox_names(matches: list, standings: dict, city_name: str = ""):
    """Tüm maç ve puan durumu takımlarını Volleybox'taki resmi adıyla günceller."""
    for m in matches:
        cat = m.get("category", "")
        m_city = m.get("city") or city_name
        m["home_team"] = RESOLVE_TEAM_NAME(m.get("home_team", ""), cat, m_city)
        m["away_team"] = RESOLVE_TEAM_NAME(m.get("away_team", ""), cat, m_city)
    for grp, table in standings.items():
        if isinstance(table, list):
            for row in table:
                if isinstance(row, dict) and "team" in row:
                    row["team"] = RESOLVE_TEAM_NAME(row["team"], grp, city_name)

def merge_volleybox_data(new_matches: list, existing_file: Path) -> list:
    """Mevcut dosyadaki volleybox verilerini yeni taranan mac listesine aktar.
    Boylece scraper calistiktan sonra synced volleybox bilgileri kaybolmaz."""
    if not existing_file.exists():
        return new_matches
    try:
        with open(existing_file, "r", encoding="utf-8") as f:
            existing_data = json.load(f)
    except Exception:
        return new_matches

    existing_matches = existing_data.get("matches", [])
    if not existing_matches:
        return new_matches

    # Anahtar: (home_team, away_team, date) -> volleybox bilgisi
    vb_lookup = {}
    for em in existing_matches:
        vb = em.get("volleybox")
        if vb and vb.get("synced"):
            key = (em.get("home_team", "").strip(), em.get("away_team", "").strip(), em.get("date", ""))
            vb_lookup[key] = vb
            # id bazli yedek anahtar
            if em.get("id"):
                vb_lookup[em["id"]] = vb

    if not vb_lookup:
        return new_matches

    merged_count = 0
    for nm in new_matches:
        if nm.get("volleybox", {}).get("synced"):
            continue  # Zaten synced, dokunma
        key = (nm.get("home_team", "").strip(), nm.get("away_team", "").strip(), nm.get("date", ""))
        vb = vb_lookup.get(key) or vb_lookup.get(nm.get("id"))
        if vb:
            nm["volleybox"] = vb
            merged_count += 1

    if merged_count > 0:
        print(f"  ✨ {merged_count} macin mevcut Volleybox verisi korundu.")
    return new_matches

def scrape_single_city(city_info):
    ilid = str(city_info.get("ilid", "")).strip()
    ilid_int = int(ilid) if ilid.isdigit() else 0
    name = OFFICIAL_CITIES.get(ilid_int, clean_str(city_info.get("name") or "Bilinmeyen"))
    url_raw = city_info.get("url", "")
    
    clean_url = url_raw.replace("https://", "").replace("http://", "").split("/")[0]
    subdomain = clean_url.replace(".voleyboliltemsilciligi.com", "").strip().lower()
    if not subdomain:
        return {
            "ilid": ilid,
            "name": name,
            "slug": "unknown",
            "url": url_raw,
            "status": "URL Tanımlı Değil",
            "matches_count": 0,
            "standings_count": 0,
            "data_file": None
        }

    puan_url = f"https://{subdomain}.voleyboliltemsilciligi.com/PuanDurumu"

    def get_fallback_result(fallback_status):
        city_file = CITIES_DIR / f"{subdomain}.json"
        if city_file.exists():
            try:
                with open(city_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                cached_matches = cached_data.get("matches", [])
                cached_standings = cached_data.get("standings", {})
                m_count = len(cached_matches)
                s_count = len(cached_standings)
                if m_count > 0 or s_count > 0:
                    status_lbl = f"Aktif ({m_count} Maç Mevcut)" if m_count > 0 else f"Puan Durumu Var ({s_count} Tablo)"
                    return {
                        "ilid": ilid,
                        "name": name,
                        "slug": subdomain,
                        "url": puan_url,
                        "status": status_lbl,
                        "matches_count": m_count,
                        "standings_count": s_count,
                        "data_file": f"data/cities/{subdomain}.json"
                    }
            except Exception:
                pass
        return {
            "ilid": ilid,
            "name": name,
            "slug": subdomain,
            "url": puan_url,
            "status": fallback_status,
            "matches_count": 0,
            "standings_count": 0,
            "data_file": None
        }

    # Istanbul ozel durumu: Test edilmis canli motoru calistir
    if subdomain == "istanbul" and fetch_istanbul_live_data:
        try:
            ist_data = fetch_istanbul_live_data()
            matches = ist_data.get("matches", [])
            standings = ist_data.get("standings", {})
            apply_volleybox_names(matches, standings, "İstanbul")
            
            # Mevcut volleybox verilerini koru
            city_file = CITIES_DIR / "istanbul.json"
            ist_data["matches"] = merge_volleybox_data(matches, city_file)
            
            with open(city_file, "w", encoding="utf-8") as f:
                json.dump(ist_data, f, ensure_ascii=False, indent=2)
                
            with open(FIXTURES_JSON, "w", encoding="utf-8") as f:
                json.dump(ist_data, f, ensure_ascii=False, indent=2)

            return {
                "ilid": "34",
                "name": "İstanbul",
                "slug": "istanbul",
                "url": "https://istanbul.voleyboliltemsilciligi.com/PuanDurumu",
                "status": f"Aktif ({len(matches)} Maç Mevcut)",
                "matches_count": len(matches),
                "standings_count": len(standings),
                "data_file": "data/cities/istanbul.json"
            }
        except Exception as ex:
            return get_fallback_result(f"Hata: {ex}")

    # Diğer iller
    client = httpx.Client(
        headers={"User-Agent": HEADERS["User-Agent"]},
        timeout=httpx.Timeout(connect=3.0, read=5.0, write=5.0, pool=5.0),
        follow_redirects=True,
    )
    
    try:
        r0 = client.get(puan_url)
        if r0.status_code != 200:
            return get_fallback_result(f"HTTP {r0.status_code}")
    except Exception:
        return get_fallback_result("Bağlantı Zaman Aşımı")

    soup = BeautifulSoup(decode_html(r0), "html.parser")
    state = {inp.get("name"): inp.get("value", "") for inp in soup.find_all("input") if inp.get("name")}
    for s in soup.find_all("select"):
        if s.get("name"):
            o = s.find("option", selected=True) or s.find("option")
            state[s.get("name")] = o.get("value", "") if o else ""

    def update_state(st, delta_text):
        tokens = delta_text.split("|")
        for i in range(len(tokens)):
            if tokens[i] == "hiddenField" and i + 2 < len(tokens):
                st[tokens[i+1]] = tokens[i+2]

    # Kadın (B)
    p = state.copy()
    p["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlsbe"
    p["__EVENTTARGET"] = "ctl00$icerik$ddlsbe"
    p["__ASYNCPOST"] = "true"
    p["ctl00$icerik$ddlsbe"] = "B"
    try:
        r_b = client.post(puan_url, data=p, headers=HEADERS)
        update_state(state, decode_html(r_b))
    except Exception:
        pass

    city_matches = []
    city_standings = {}
    halls_set = set()
    match_counter = 1

    target_kumes = [
        ("GKSL", "Genç Kızlar Süper Lig", "Genç"),
        ("GK1L", "Genç Kızlar 1. Ligi", "Genç"),
        ("YKSL", "Yıldız Kızlar Süper Lig", "Yıldız"),
    ]

    for kume_code, cat_name, age_group in target_kumes:
        p_k = state.copy()
        p_k["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlskume"
        p_k["__EVENTTARGET"] = "ctl00$icerik$ddlskume"
        p_k["__ASYNCPOST"] = "true"
        p_k["ctl00$icerik$ddlsbe"] = "B"
        p_k["ctl00$icerik$ddlskume"] = kume_code
        try:
            r_k = client.post(puan_url, data=p_k, headers=HEADERS)
            r_k_text = decode_html(r_k)
            update_state(state, r_k_text)
        except Exception:
            continue

        tokens = r_k_text.split("|")
        comps = []
        for i in range(len(tokens)):
            if tokens[i] == "updatePanel":
                s_p = BeautifulSoup(tokens[i+2], "html.parser")
                comp_sel = s_p.find("select", id="icerik_ddlSyarismaadi")
                if comp_sel:
                    for opt in comp_sel.find_all("option"):
                        val = opt.get("value")
                        txt = clean_str(opt.text)
                        if val and val not in ["0", "-1", "Seçiniz", "Seciniz"]:
                            comps.append((val, txt))

        for c_val, c_text in comps:
            group_name = extract_group_name(c_text)
            standings_key = f"{cat_name} - {group_name}"

            p_c = state.copy()
            p_c["ctl00$ScriptManager1"] = "ctl00$icerik$UpdatePanel|ctl00$icerik$ddlSyarismaadi"
            p_c["__EVENTTARGET"] = "ctl00$icerik$ddlSyarismaadi"
            p_c["__ASYNCPOST"] = "true"
            p_c["ctl00$icerik$ddlsbe"] = "B"
            p_c["ctl00$icerik$ddlskume"] = kume_code
            p_c["ctl00$icerik$ddlSyarismaadi"] = c_val
            try:
                r_c = client.post(puan_url, data=p_c, headers=HEADERS)
                r_c_text = decode_html(r_c)
                update_state(state, r_c_text)
            except Exception:
                continue

            tokens_c = r_c_text.split("|")
            for k in range(len(tokens_c)):
                if tokens_c[k] == "updatePanel":
                    soup_c = BeautifulSoup(tokens_c[k+2], "html.parser")
                    
                    # Puan durumu
                    standings_table = soup_c.find("table", id=lambda x: x and "GvTemplate" in x)
                    if standings_table:
                        gr_st = []
                        r_idx = 1
                        for tr in standings_table.find_all("tr")[1:]:
                            tds = [clean_str(td.text) for td in tr.find_all("td")]
                            if len(tds) >= 8:
                                t_name = tds[1]
                                if "deneme" in t_name.lower() or "test" in t_name.lower():
                                    continue
                                try:
                                    played = int(tds[2]) if tds[2].isdigit() else 0
                                    won = int(tds[3]) if tds[3].isdigit() else 0
                                    lost = int(tds[4]) if tds[4].isdigit() else 0
                                    sets_won = int(tds[5]) if tds[5].isdigit() else 0
                                    sets_lost = int(tds[6]) if tds[6].isdigit() else 0
                                    points = int(tds[7]) if tds[7].isdigit() else 0
                                except Exception:
                                    played = won = lost = sets_won = sets_lost = points = 0
                                gr_st.append({
                                    "rank": r_idx, "team": t_name, "played": played, "won": won,
                                    "lost": lost, "points": points, "sets_won": sets_won,
                                    "sets_lost": sets_lost, "form": []
                                })
                                r_idx += 1
                        if gr_st:
                            city_standings[standings_key] = gr_st

                    # Fikstür maçları (Sadece tarihi açıklananlar)
                    matches_table = soup_c.find("table", id="icerik_gvmusabakaliste")
                    if matches_table:
                        for tr in matches_table.find_all("tr")[1:]:
                            tds = [clean_str(td.text) for td in tr.find_all("td")]
                            if len(tds) >= 8:
                                raw_date = tds[1]
                                if not raw_date or "." not in raw_date:
                                    continue
                                parts = raw_date.split(".")
                                if len(parts) == 3:
                                    iso_date = f"{parts[2]}-{int(parts[1]):02d}-{int(parts[0]):02d}"
                                else:
                                    continue

                                raw_time = tds[2] or "--:--"
                                raw_hall = tds[3] or "Açıklanacak"
                                home = tds[4]
                                score_h = tds[5]
                                score_a = tds[6]
                                away = tds[7]
                                raw_sets = tds[8] if len(tds) > 8 else ""

                                if "deneme" in home.lower() or "deneme" in away.lower() or "test" in home.lower() or "test" in away.lower():
                                    continue

                                if raw_hall and raw_hall != "Açıklanacak":
                                    halls_set.add(raw_hall)

                                is_finished = bool(score_h and score_a and (score_h.isdigit() or score_a.isdigit()))
                                status = "finished" if is_finished else "upcoming"
                                score_str = f"{score_h} - {score_a}" if is_finished else "- : -"

                                match_id = f"{subdomain}-{iso_date.replace('-','')}-{match_counter:03d}"
                                match_counter += 1

                                set_scores = re.findall(r"\((\d+-\d+)\)", raw_sets) if raw_sets else []

                                city_matches.append({
                                    "id": match_id,
                                    "city": name,
                                    "date": iso_date,
                                    "time": raw_time,
                                    "hall": raw_hall,
                                    "category": cat_name,
                                    "age_group": age_group,
                                    "gender": "Kız",
                                    "group": group_name,
                                    "match_no": tds[0],
                                    "home_team": home,
                                    "away_team": away,
                                    "score": score_str,
                                    "home_score": int(score_h) if is_finished and score_h.isdigit() else None,
                                    "away_score": int(score_a) if is_finished and score_a.isdigit() else None,
                                    "set_scores": set_scores,
                                    "status": status,
                                })

    data_file_rel = None
    if city_matches or city_standings:
        apply_volleybox_names(city_matches, city_standings, name)
        city_payload = {
            "updated_at": datetime.now().isoformat(),
            "city": name,
            "slug": subdomain,
            "title": f"TVF {name} Genç & Yıldız Kızlar Süper Lig",
            "total_matches": len(city_matches),
            "source": f"https://{subdomain}.voleyboliltemsilciligi.com",
            "filters": {
                "categories": ["Tümü", "Genç Kızlar Süper Lig", "Genç Kızlar 1. Ligi", "Yıldız Kızlar Süper Lig"],
                "age_groups": ["Tümü", "Genç", "Yıldız"],
                "genders": ["Kız"],
                "halls": ["Tümü"] + sorted(list(halls_set)),
            },
            "standings": city_standings,
            "matches": city_matches,
        }
        city_file = CITIES_DIR / f"{subdomain}.json"
        # Mevcut volleybox verilerini koru
        city_payload["matches"] = merge_volleybox_data(city_matches, city_file)
        with open(city_file, "w", encoding="utf-8") as f:
            json.dump(city_payload, f, ensure_ascii=False, indent=2)
        data_file_rel = f"data/cities/{subdomain}.json"
    else:
        # Eğer bu taramada yeni maç bulunamadıysa ama diskte önceden kaydedilmiş aktif veri varsa koru
        city_file = CITIES_DIR / f"{subdomain}.json"
        if city_file.exists():
            try:
                with open(city_file, "r", encoding="utf-8") as f:
                    cached_data = json.load(f)
                cached_matches = cached_data.get("matches", [])
                cached_standings = cached_data.get("standings", {})
                if cached_matches or cached_standings:
                    city_matches = cached_matches
                    city_standings = cached_standings
                    data_file_rel = f"data/cities/{subdomain}.json"
            except Exception:
                pass

    status_label = (
        f"Aktif ({len(city_matches)} Maç Mevcut)"
        if city_matches
        else (f"Puan Durumu Var ({len(city_standings)} Tablo)" if city_standings else "Fikstür Açıklanmadı")
    )
    return {
        "ilid": ilid,
        "name": name,
        "slug": subdomain,
        "url": puan_url,
        "status": status_label,
        "matches_count": len(city_matches),
        "standings_count": len(city_standings),
        "data_file": data_file_rel
    }

def main():
    import argparse
    parser = argparse.ArgumentParser(description="TVF İl Temsilcilikleri Canlı Veri Çekici")
    parser.add_argument("--city", default=None, help="Yalnızca belirli bir ili tara (ör: istanbul, izmir)")
    args = parser.parse_args()

    print("=" * 80)
    print("🏆 TVF 81 İL VOLEYBOL İL TEMSİLCİLİĞİ CANLI TARAMA VE VERİ MOTORU")
    print("=" * 80)
    print("📡 Merkezi il dizini (https://voleyboliltemsilciligi.com/api/cities) sorgulanıyor...")
    
    try:
        r = httpx.get("https://voleyboliltemsilciligi.com/api/cities", timeout=12.0)
        cities_raw = r.json()
    except Exception as e:
        print(f"❌ Hata: TVF Merkezi API'sine ulaşılamadı: {e}")
        return

    cities = []
    target_city = args.city.lower().strip() if args.city else None
    for c in cities_raw:
        ilid = str(c.get("ilid", "")).strip()
        ilid_num = int(ilid) if ilid.isdigit() else 999
        name = OFFICIAL_CITIES.get(ilid_num, clean_str(c.get("name") or ""))
        url = c.get("url", "")
        if name:
            subdomain = url.replace("https://", "").replace("http://", "").split("/")[0].replace(".voleyboliltemsilciligi.com", "").strip().lower()
            if target_city:
                if target_city not in [subdomain, ilid, name.lower()]:
                    continue
            cities.append({"name": name, "ilid": ilid, "url": url})

    def get_id(x):
        try: return int(x["ilid"])
        except: return 999
    cities.sort(key=get_id)
    total_cities = len(cities)

    print(f"✅ Toplam {total_cities} il tespit edildi. Gerçek zamanlı tarama başlatılıyor...\n")

    results = []
    completed_count = 0
    active_count = 0
    total_matches_all = 0

    with ThreadPoolExecutor(max_workers=16) as executor:
        future_to_city = {executor.submit(scrape_single_city, c): c for c in cities}
        for future in as_completed(future_to_city):
            completed_count += 1
            city = future_to_city[future]
            city_name = city["name"]
            plate = city.get("ilid", "")
            try:
                res = future.result()
                results.append(res)
                m_count = res.get("matches_count", 0)
                st_count = res.get("standings_count", 0)
                if m_count > 0:
                    active_count += 1
                    total_matches_all += m_count
                    extra = f"🔥 {m_count} Maç | {st_count} Puan Tablosu Bulundu!"
                elif st_count > 0:
                    extra = f"Puan Durumu Mevcut ({st_count} Tablo)"
                else:
                    extra = res.get("status", "Taranıyor...")
                render_progress(completed_count, total_cities, plate, city_name, extra)
            except Exception as ex:
                render_progress(completed_count, total_cities, plate, city_name, f"Hata: {ex}")

    if sys.stdout.isatty():
        sys.stdout.write("\n")
    print("\n" + "=" * 80)
    print("🎉 81 İLİN TARAMASI BAŞARIYLA TAMAMLANDI!")
    print("=" * 80)
    
    results.sort(key=lambda x: int(x["ilid"]) if str(x["ilid"]).isdigit() else 999)
    
    master_payload = {
        "updated_at": datetime.now().astimezone().isoformat(),
        "total_cities": len(results),
        "active_cities": active_count,
        "total_matches": total_matches_all,
        "cities": results
    }
    with open(CITIES_INDEX_JSON, "w", encoding="utf-8") as f:
        json.dump(master_payload, f, ensure_ascii=False, indent=2)

    print(f"  📊 Toplam Taranan İl   : {len(results)}")
    print(f"  ⭐ Aktif Fikstürü Olan : {active_count} İl")
    print(f"  🏐 Toplam Maç Sayısı   : {total_matches_all}")
    print(f"  📁 İndeks Dosyası      : {CITIES_INDEX_JSON.relative_to(BASE_DIR)}")
    print("-" * 80)
    
    active_list = [c for c in results if c["matches_count"] > 0 or c["standings_count"] > 0]
    if active_list:
        print("✅ AKTİF MAÇ BULUNAN İLLER:")
        for ac in active_list:
            print(f"  * [{int(ac['ilid']):02d}] {ac['name']:<14} : {ac['matches_count']} Maç | {ac['standings_count']} Puan Tablosu ({ac['status']})")
    print("=" * 80 + "\n")

    # Volleybox maç senkronizasyonunu otomatik çalıştır
    try:
        from scripts.sync_volleybox_matches import main as sync_vb_main
        sync_vb_main()
    except Exception as vb_ex:
        print(f"Volleybox maç senkronizasyonu atlandı: {vb_ex}")

if __name__ == "__main__":
    main()
