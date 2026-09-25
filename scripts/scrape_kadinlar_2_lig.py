"""
TVF Uzman Posta Kadınlar 2. Ligi Scraper & Volleybox Eşleştirici
---------------------------------------------------------------
16 grubun puan cetvelini ve fikstürünü TVF Livewire servisinden çeker,
Volleybox 2. Lig turnuva sayfasıyla eşleştirerek data/kadinlar_2_lig.json oluşturur.
"""

import sys
import os
import re
import json
import time
from datetime import datetime

# Windows terminal UTF-8 encoding support
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

import httpx
from bs4 import BeautifulSoup
try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    cffi_requests = None
    HAS_CURL_CFFI = False

DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "kadinlar_2_lig.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "X-Livewire": "true"
}

def clean_text(val):
    if not val:
        return ""
    if isinstance(val, str):
        return val.strip()
    return str(val).strip()

def fetch_volleybox_teams():
    print("🔍 Volleybox 2. Lig takımları taranıyor...")
    volleybox_url = "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047"
    try:
        if HAS_CURL_CFFI:
            s = cffi_requests.Session(impersonate="chrome120")
            r = s.get(volleybox_url, headers=HEADERS, timeout=20)
        else:
            r = httpx.get(volleybox_url, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=20)
        if r.status_code != 200:
            print(f"⚠️ Volleybox HTTP {r.status_code} döndü.")
            return {}
        soup = BeautifulSoup(r.text, "html.parser")
        team_links = {}
        for a in soup.find_all("a"):
            href = a.get("href", "")
            if re.search(r"-t\d+", href):
                name = a.get_text(strip=True)
                if name and len(name) > 1:
                    full_url = href if href.startswith("http") else f"https://women.volleybox.net{href}"
                    team_links[name.strip()] = full_url
        print(f"✅ Volleybox üzerinden {len(team_links)} takım bağlantısı tespit edildi.")
        return team_links
    except Exception as e:
        print(f"⚠️ Volleybox çekme hatası: {e}")
        return {}

def extract_standings_from_snapshot(snap_dict):
    lp = snap_dict.get("data", {}).get("leaguePoints", [])
    teams = []
    if lp and len(lp) > 0:
        table_obj = lp[0]
        if isinstance(table_obj, dict) and "puantablosu" in table_obj:
            pt = table_obj["puantablosu"]
            for sub in pt:
                if isinstance(sub, list):
                    for item in sub:
                        t = None
                        if isinstance(item, list) and len(item) > 0 and isinstance(item[0], dict) and "TAKIMADI" in item[0]:
                            t = item[0]
                        elif isinstance(item, dict) and "TAKIMADI" in item:
                            t = item
                        if t:
                            # Normalize fields
                            teams.append({
                                "sira": int(t.get("SNO", 0)) if str(t.get("SNO", "0")).isdigit() else 0,
                                "takim_id": str(t.get("TAKIMID", "")),
                                "takim_adi": clean_text(t.get("TAKIMADI", "")),
                                "o": int(t.get("O", 0) or 0),
                                "g": int(t.get("G", 0) or 0),
                                "m": int(t.get("M", 0) or 0),
                                "p": int(t.get("P", 0) or 0),
                                "as": int(t.get("A", 0) or 0),
                                "vs": int(t.get("V", 0) or 0),
                                "sav": clean_text(t.get("SAV", "0")),
                                "asp": int(t.get("ASP", 0) or 0),
                                "vsp": int(t.get("VSP", 0) or 0),
                                "spav": clean_text(t.get("SPAV", "0")),
                                "a3_0": int(t.get("A3_0", 0) or 0),
                                "a3_1": int(t.get("A3_1", 0) or 0),
                                "a3_2": int(t.get("A3_2", 0) or 0),
                                "v2_3": int(t.get("V2_3", 0) or 0),
                                "v1_3": int(t.get("V1_3", 0) or 0),
                                "v0_3": int(t.get("V0_3", 0) or 0),
                                "logo": t.get("LOGO") or "",
                                "sezon": clean_text(t.get("SEZON", "2026-2027")),
                            })
    return teams

def extract_fixtures_from_snapshot(snap_dict, group_id):
    lf = snap_dict.get("data", {}).get("leagueFixture", [])
    matches = []
    for item in lf:
        if isinstance(item, dict):
            for week_key, week_data in item.items():
                if isinstance(week_data, list):
                    for sub in week_data:
                        if isinstance(sub, list):
                            for match_item in sub:
                                m = None
                                if isinstance(match_item, list) and len(match_item) > 0 and isinstance(match_item[0], dict) and "ATAKIMI" in match_item[0]:
                                    m = match_item[0]
                                elif isinstance(match_item, dict) and "ATAKIMI" in match_item:
                                    m = match_item
                                if m and m.get("ATAKIMI"):
                                    set_sonuclari = clean_text(m.get("SETSONUCLARI", "")).strip()
                                    set_a = clean_text(m.get("SETA", ""))
                                    set_b = clean_text(m.get("SETB", ""))
                                    skor = f"{set_a} - {set_b}" if (set_a != "" and set_b != "") else "- : -"
                                    
                                    matches.append({
                                        "id": f"2lig_g{group_id}_m{m.get('MACNO', '')}_{m.get('ATAKIMIID', '')}_{m.get('BTAKIMIID', '')}",
                                        "mac_no": str(m.get("MACNO", "")),
                                        "grup_no": int(group_id),
                                        "grup_adi": f"Grup {group_id}",
                                        "hafta": int(week_key) if str(week_key).isdigit() else 1,
                                        "devre": int(m.get("DEVRE", 1) or 1),
                                        "tarih": clean_text(m.get("TARIH", "")),
                                        "gun": clean_text(m.get("GUN", "")),
                                        "saat": clean_text(m.get("SAAT", "")),
                                        "sehir": clean_text(m.get("IL", "")),
                                        "salon": clean_text(m.get("YER", "")),
                                        "takim_a": clean_text(m.get("ATAKIMI", "")),
                                        "takim_b": clean_text(m.get("BTAKIMI", "")),
                                        "takim_a_id": str(m.get("ATAKIMIID", "")),
                                        "takim_b_id": str(m.get("BTAKIMIID", "")),
                                        "takim_a_logo": m.get("ALOGONAME") or "",
                                        "takim_b_logo": m.get("BLOGONAME") or "",
                                        "set_a": set_a,
                                        "set_b": set_b,
                                        "skor": skor,
                                        "set_sonuclari": set_sonuclari,
                                        "durum": "BİTTİ" if (set_a != "" and set_b != "") else "OYNANACAK",
                                        "mac_durumu_kod": str(m.get("MACDURUMU", "")),
                                    })
    return matches

def normalize_for_match(name):
    n = name.lower()
    for tr, en in [("ç", "c"), ("ğ", "g"), ("ı", "i"), ("i", "i"), ("ö", "o"), ("ş", "s"), ("ü", "u")]:
        n = n.replace(tr, en)
    n = re.sub(r"\bbld\.?\b", "belediye", n)
    n = re.sub(r"\bbeld\.?\b", "belediye", n)
    n = re.sub(r"\bb\.bld\.?\b", "buyuksehir belediye", n)
    n = re.sub(r"\bbsehir\b", "buyuksehir", n)
    n = re.sub(r"\bgsk\b", "genclik spor", n)
    n = re.sub(r"\bsk\b", "spor", n)
    n = re.sub(r"\bkulubu\b", "", n)
    n = re.sub(r"[^a-z0-9]", "", n)
    return n

KNOWN_2_LIG_ALIASES = {
    "toyzz shop dinamo spor": ["dinamo kartal spor kulübü", "dinamo spor kulübü", "dinamo kartal"],
    "çanakkale onsekiz mart üniversitesi": ["çomü spor kulübü", "çomü", "comu spor kulubu"],
    "eskişehir şehir koleji eğt. kültür": ["şehir koleji eğitim kültür sk", "şehir koleji"],
    "bartın volley academy": ["bartın voleybol kulübü", "bartın voleybol"],
    "adana t.d.s.": ["adana tenis dağ ve su sporları kulübü", "atdsk"],
    "adana sporcu eğitim spor": ["adana sporcu eğitim merkezi spor kulübü"],
    "ahto": ["ahto spor kulübü", "ahto spor"],
    "tms spor": ["tms voleybol spor kulübü", "tms voleybol"],
    "kvk spor": ["kvk voleybol kulübü", "kvk voleybol"],
    "yalova çiftlikköy bld. spor": ["çiftlikköy belediyespor", "çiftlikköy belediye"],
    "galatasaray": ["galatasaray ll", "galatasaray ii"],
}

def match_volleybox(tvf_name, vb_dict):
    norm_tvf = normalize_for_match(tvf_name)
    
    # 0. Known explicit aliases
    for kn, extra_als in KNOWN_2_LIG_ALIASES.items():
        if normalize_for_match(kn) == norm_tvf:
            for extra in extra_als:
                extra_norm = normalize_for_match(extra)
                for vb_name, url in vb_dict.items():
                    if normalize_for_match(vb_name) == extra_norm:
                        return url, vb_name

    # 1. Exact normalized match
    for vb_name, url in vb_dict.items():
        norm_vb = normalize_for_match(vb_name)
        if norm_tvf == norm_vb:
            return url, vb_name
            
    # 2. Substring match (min 6 chars)
    for vb_name, url in vb_dict.items():
        norm_vb = normalize_for_match(vb_name)
        if len(norm_tvf) >= 6 and (norm_tvf in norm_vb or norm_vb in norm_tvf):
            return url, vb_name

    # 3. Leading token match (e.g. "arnavutkoy", "besiktas", "fenerbahce")
    tvf_tokens = [normalize_for_match(w) for w in tvf_name.split() if len(w) > 3]
    if tvf_tokens:
        primary = tvf_tokens[0]
        if len(primary) >= 5:
            for vb_name, url in vb_dict.items():
                norm_vb = normalize_for_match(vb_name)
                if primary in norm_vb:
                    return url, vb_name

    return None, None

def run_kadinlar_2_lig_scraper(silent: bool = False):
    def log(msg):
        if not silent:
            print(msg)

    log("=" * 70)
    log("🏐 TVF KADINLAR 2. LİGİ VERİ SENKRONİZASYON MOTORU")
    log("=" * 70)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    vb_teams = fetch_volleybox_teams()
    
    client = httpx.Client(headers=HEADERS, timeout=30)
    
    # 1. Fetch Standings across all 16 groups
    log("\n📊 16 Grubun Puan Durumu Çekiliyor...")
    r_standings = client.get("https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=puan-durumu")
    soup_s = BeautifulSoup(r_standings.text, "html.parser")
    csrf_tag = soup_s.find("meta", attrs={"name": "csrf-token"})
    if not csrf_tag:
        log("❌ TVF Standings CSRF token bulunamadı!")
        return None
    csrf_s = csrf_tag["content"]
    client.headers["X-CSRF-TOKEN"] = csrf_s
    
    target_s = None
    for tag in soup_s.find_all(attrs={"wire:snapshot": True}):
        if "leaguePoints" in tag["wire:snapshot"]:
            target_s = tag
            break
            
    if not target_s:
        log("❌ TVF Standings snapshot bulunamadı!")
        return None
        
    curr_s_str = target_s["wire:snapshot"]
    initial_s = json.loads(curr_s_str)
    
    groups_standings = {1: extract_standings_from_snapshot(initial_s)}
    log(f"  ✅ Grup 1: {len(groups_standings[1])} takım")
    
    for g in range(2, 17):
        payload = {
            "_token": csrf_s,
            "components": [{
                "snapshot": curr_s_str,
                "updates": {},
                "calls": [{"path": "", "method": "setFilter", "params": ["GR", str(g)]}]
            }]
        }
        res = client.post("https://tvf.org.tr/livewire/update", json=payload)
        if res.status_code == 200:
            comp = res.json()["components"][0]
            curr_s_str = comp["snapshot"]
            snap_dict = json.loads(curr_s_str)
            teams = extract_standings_from_snapshot(snap_dict)
            groups_standings[g] = teams
            log(f"  ✅ Grup {g}: {len(teams)} takım")
        else:
            log(f"  ⚠️ Grup {g} puan durumu alınamadı (HTTP {res.status_code})")
            groups_standings[g] = []
            
    # 2. Fetch Fixtures across all 16 groups
    log("\n📅 16 Grubun Fikstürü Çekiliyor...")
    r_fix = client.get("https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=fikstur")
    soup_f = BeautifulSoup(r_fix.text, "html.parser")
    csrf_f_tag = soup_f.find("meta", attrs={"name": "csrf-token"})
    if not csrf_f_tag:
        log("❌ TVF Fixture CSRF token bulunamadı!")
        return None
    csrf_f = csrf_f_tag["content"]
    client.headers["X-CSRF-TOKEN"] = csrf_f
    
    target_f = None
    for tag in soup_f.find_all(attrs={"wire:snapshot": True}):
        if "leagueFixture" in tag["wire:snapshot"]:
            target_f = tag
            break
            
    if not target_f:
        log("❌ TVF Fixture snapshot bulunamadı!")
        return None
        
    curr_f_str = target_f["wire:snapshot"]
    initial_f = json.loads(curr_f_str)
    
    groups_fixtures = {1: extract_fixtures_from_snapshot(initial_f, 1)}
    log(f"  ✅ Grup 1: {len(groups_fixtures[1])} maç")
    
    for g in range(2, 17):
        payload = {
            "_token": csrf_f,
            "components": [{
                "snapshot": curr_f_str,
                "updates": {},
                "calls": [{"path": "", "method": "setFilter", "params": ["GR", str(g)]}]
            }]
        }
        res = client.post("https://tvf.org.tr/livewire/update", json=payload)
        if res.status_code == 200:
            comp = res.json()["components"][0]
            curr_f_str = comp["snapshot"]
            snap_dict = json.loads(curr_f_str)
            matches = extract_fixtures_from_snapshot(snap_dict, g)
            groups_fixtures[g] = matches
            log(f"  ✅ Grup {g}: {len(matches)} maç")
        else:
            log(f"  ⚠️ Grup {g} fikstürü alınamadı (HTTP {res.status_code})")
            groups_fixtures[g] = []

    # 3. Match Volleybox & Enrich
    log("\n🔗 Takımlar Volleybox profilleri ile eşleştiriliyor...")
    all_teams_map = {}
    matched_count = 0
    total_unique_teams = 0
    
    for g, teams in groups_standings.items():
        for t in teams:
            t_name = t["takim_adi"]
            vb_url, vb_name = match_volleybox(t_name, vb_teams)
            t["volleybox_url"] = vb_url
            t["volleybox_name"] = vb_name
            t["grup_no"] = g
            if vb_url:
                matched_count += 1
            if t_name not in all_teams_map:
                all_teams_map[t_name] = t
                total_unique_teams += 1

    for g, matches in groups_fixtures.items():
        for m in matches:
            t_a = all_teams_map.get(m["takim_a"])
            t_b = all_teams_map.get(m["takim_b"])
            if t_a and t_a.get("volleybox_url"):
                m["takim_a_volleybox_url"] = t_a["volleybox_url"]
            if t_b and t_b.get("volleybox_url"):
                m["takim_b_volleybox_url"] = t_b["volleybox_url"]

    # Flatten all matches
    all_matches = []
    for g, matches in groups_fixtures.items():
        all_matches.extend(matches)

    # Sort all matches by date / time if available
    def match_sort_key(m):
        tarih = m.get("tarih", "")
        saat = m.get("saat", "00:00")
        try:
            parts = tarih.split(".")
            if len(parts) == 3:
                return f"{parts[2]}-{parts[1]}-{parts[0]} {saat}"
        except Exception:
            pass
        return f"9999-99-99 {saat}"

    all_matches.sort(key=match_sort_key)

    # Construct final payload
    payload_data = {
        "metadata": {
            "lig_adi": "Uzman Posta Kadınlar Voleybol 2. Ligi",
            "sezon": "2026-2027",
            "kategori": "Büyük Kadınlar",
            "guncellenme_zamani": datetime.now().isoformat(),
            "toplam_grup_sayisi": 16,
            "toplam_takim_sayisi": total_unique_teams,
            "toplam_mac_sayisi": len(all_matches),
            "volleybox_eslesme_sayisi": matched_count,
            "resmi_kaynaklar": {
                "tvf_puan_durumu": "https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=puan-durumu",
                "tvf_fikstur": "https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=fikstur",
                "tvf_fsw_portal": "https://fikstur.tvf.org.tr/FSW/MjAyNi0yMDI3/Sw%3d%3d/MkxL/VXptYW4gUG9zdGEgS2FkxLFubGFyIDIuIExpZw%3d%3d",
                "volleybox_turnuva": "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047",
                "volleybox_maclar": "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047/matches"
            }
        },
        "gruplar": [
            {
                "grup_no": g,
                "grup_adi": f"Grup {g}",
                "takim_sayisi": len(groups_standings.get(g, [])),
                "mac_sayisi": len(groups_fixtures.get(g, [])),
                "puan_durumu": groups_standings.get(g, []),
                "fikstur": groups_fixtures.get(g, []),
            }
            for g in range(1, 17)
        ],
        "tum_maclar": all_matches,
        "tum_takimlar": list(all_teams_map.values())
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload_data, f, ensure_ascii=False, indent=2)

    log(f"\n🎉 Veriler başarıyla kaydedildi: {OUTPUT_FILE}")
    log(f"   - 16 Grup")
    log(f"   - {total_unique_teams} Takım ({matched_count} Volleybox eşleşti)")
    log(f"   - {len(all_matches)} Karşılaşma")

    # Mappings dosyasını da otomatik güncelle
    try:
        from scripts.merge_kadinlar_2_lig_mappings import merge_kadinlar_2_lig_mappings
        merge_kadinlar_2_lig_mappings(silent=silent)
    except Exception as me:
        try:
            from merge_kadinlar_2_lig_mappings import merge_kadinlar_2_lig_mappings
            merge_kadinlar_2_lig_mappings(silent=silent)
        except Exception:
            pass

    return payload_data

def main():
    run_kadinlar_2_lig_scraper(silent=False)
    try:
        from scripts.sync_volleybox_matches import sync_kadinlar_2_lig_matches
        from pathlib import Path
        print("\n🏐 Volleybox Kadınlar 2. Ligi maçları doğrulanıyor...")
        k2_path = Path(OUTPUT_FILE)
        sync_kadinlar_2_lig_matches(k2_path, {}, {})
    except Exception as e:
        print(f"Volleybox doğrulaması atlandı: {e}")

if __name__ == "__main__":
    main()

