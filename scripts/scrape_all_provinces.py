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

import httpx
from bs4 import BeautifulSoup

BASE_DIR = Path(__file__).resolve().parent.parent
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

def decode_html(resp: httpx.Response) -> str:
    try:
        return resp.content.decode("windows-1254")
    except Exception:
        try:
            return resp.content.decode("utf-8")
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
        sys.stdout.write(f"\r{line[:92].ljust(92)}")
        sys.stdout.flush()
    else:
        print(line)
        sys.stdout.flush()

def scrape_single_city(city_info):
    ilid = str(city_info.get("ilid", "")).strip()
    ilid_int = int(ilid) if ilid.isdigit() else 0
    name = OFFICIAL_CITIES.get(ilid_int, clean_str(city_info.get("name") or "Bilinmeyen"))
    url_raw = city_info.get("url", "")
    
    subdomain = url_raw.replace(".voleyboliltemsilciligi.com", "").replace("https://", "").replace("http://", "").strip().lower()
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

    # İstanbul özel durumu: Test edilmiş canlı motoru çalıştır
    if subdomain == "istanbul" and fetch_istanbul_live_data:
        try:
            ist_data = fetch_istanbul_live_data()
            matches = ist_data.get("matches", [])
            standings = ist_data.get("standings", {})
            
            city_file = CITIES_DIR / "istanbul.json"
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
            return {
                "ilid": "34",
                "name": "İstanbul",
                "slug": "istanbul",
                "url": "https://istanbul.voleyboliltemsilciligi.com/PuanDurumu",
                "status": f"Hata: {ex}",
                "matches_count": 0,
                "standings_count": 0,
                "data_file": None
            }

    # Diğer iller
    puan_url = f"https://{subdomain}.voleyboliltemsilciligi.com/PuanDurumu"
    client = httpx.Client(headers={"User-Agent": HEADERS["User-Agent"]}, timeout=7.0, follow_redirects=True)
    
    try:
        r0 = client.get(puan_url)
        if r0.status_code != 200:
            return {
                "ilid": ilid,
                "name": name,
                "slug": subdomain,
                "url": puan_url,
                "status": f"HTTP {r0.status_code}",
                "matches_count": 0,
                "standings_count": 0,
                "data_file": None
            }
    except Exception:
        return {
            "ilid": ilid,
            "name": name,
            "slug": subdomain,
            "url": puan_url,
            "status": "Bağlantı Zaman Aşımı",
            "matches_count": 0,
            "standings_count": 0,
            "data_file": None
        }

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
            group_name = "A Grubu" if " A " in c_text or "- A" in c_text else ("B Grubu" if " B " in c_text or "- B" in c_text else c_text)
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
        city_payload = {
            "updated_at": datetime.now().isoformat(),
            "city": name,
            "slug": subdomain,
            "title": f"TVF {name} Genç & Yıldız Kızlar Süper Lig",
            "total_matches": len(city_matches),
            "source": f"https://{subdomain}.voleyboliltemsilciligi.com",
            "filters": {
                "categories": ["Tümü", "Genç Kızlar Süper Lig", "Yıldız Kızlar Süper Lig"],
                "age_groups": ["Tümü", "Genç", "Yıldız"],
                "genders": ["Kız"],
                "halls": ["Tümü"] + sorted(list(halls_set)),
            },
            "standings": city_standings,
            "matches": city_matches,
        }
        city_file = CITIES_DIR / f"{subdomain}.json"
        with open(city_file, "w", encoding="utf-8") as f:
            json.dump(city_payload, f, ensure_ascii=False, indent=2)
        data_file_rel = f"data/cities/{subdomain}.json"

    status_label = "Aktif (Maçlar Mevcut)" if city_matches else ("Puan Durumu Var" if city_standings else "Fikstür Açıklanmadı")
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
    for c in cities_raw:
        ilid = str(c.get("ilid", "")).strip()
        ilid_num = int(ilid) if ilid.isdigit() else 999
        name = OFFICIAL_CITIES.get(ilid_num, clean_str(c.get("name") or ""))
        url = c.get("url", "")
        if name:
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

    with ThreadPoolExecutor(max_workers=6) as executor:
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
        "updated_at": datetime.now().isoformat(),
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

if __name__ == "__main__":
    main()
