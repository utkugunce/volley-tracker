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

from scripts.data_quality import validate_kadinlar_2_lig_data, print_validation_summary
from scripts.k2l_volleybox_names import load_k2_mappings

import httpx
from bs4 import BeautifulSoup
from scripts.data_quality import fetch_with_retry
try:
    from curl_cffi import requests as cffi_requests
    HAS_CURL_CFFI = True
except ImportError:
    cffi_requests = None
    HAS_CURL_CFFI = False

DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "kadinlar_2_lig.json")
VBM_FILE = os.path.join(DATA_DIR, "volleybox-mappings.json")
LOGOS_DIR = os.path.join(BASE_DIR, "public", "logos")

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
        def fetch_teams():
            if HAS_CURL_CFFI:
                s = cffi_requests.Session(impersonate="chrome120")
                return s.get(volleybox_url, headers=HEADERS, timeout=20)
            return httpx.get(volleybox_url, headers={"User-Agent": HEADERS["User-Agent"]}, timeout=20)

        r = fetch_with_retry("Volleybox teams fetch", fetch_teams, max_attempts=3, initial_delay=1.0)
        if r.status_code != 200:
            if r.status_code == 403:
                print("⚠️ Volleybox otomatik erişimi HTTP 403 ile reddetti; kayıtlı takım eşleşmeleri kullanılacak.")
            else:
                print(f"⚠️ Volleybox HTTP {r.status_code} döndü; kayıtlı takım eşleşmeleri kullanılacak.")
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

# TVF veya Volleybox üzerinde ligden çekilen/çıkarılan takımlar
WITHDRAWN_TEAMS = {
    "BARTIN VOLLEY ACADEMY",
    "BARTIN VOLEYBOL KULÜBÜ",
}

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

    # Ligden çekilen / çıkarılan takımları filtrele ve sıralamayı yeniden düzenle
    filtered_teams = []
    for t in teams:
        t_name = clean_text(t.get("takim_adi", ""))
        if any(w in t_name.upper() for w in WITHDRAWN_TEAMS):
            continue
        filtered_teams.append(t)

    for idx, t in enumerate(filtered_teams, 1):
        t["sira"] = idx

    return filtered_teams

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

    # Ligden çekilen / çıkarılan takımların maçlarını filtrele
    filtered_matches = []
    for m in matches:
        t_a = clean_text(m.get("takim_a", "")).upper()
        t_b = clean_text(m.get("takim_b", "")).upper()
        if any(w in t_a for w in WITHDRAWN_TEAMS) or any(w in t_b for w in WITHDRAWN_TEAMS):
            continue
        filtered_matches.append(m)

    return filtered_matches

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
    "adana t.d.s.": ["adana tenis dağ ve su sporları kulübü", "atdsk"],
    "adana sporcu eğitim spor": ["adana sporcu eğitim merkezi spor kulübü"],
    "ahto": ["ahto spor kulübü", "ahto spor"],
    "tms spor": ["tms voleybol spor kulübü", "tms voleybol"],
    "kvk spor": ["kvk voleybol kulübü", "kvk voleybol"],
    "yalova çiftlikköy bld. spor": ["çiftlikköy belediyespor", "çiftlikköy belediye"],
    "galatasaray": ["galatasaray ll", "galatasaray ii"],
}

KNOWN_2_LIG_PROFILE_OVERRIDES = {
    "alpspor": ("https://women.volleybox.net/tr/stanbul-alp-spor-t36171", "Alp Voleybol Kulübü"),
    "asyakartallarikamarinspor": ("https://women.volleybox.net/tr/kamarin-spor-kulubu-t36145", "Kamarin Asya Kartalları SK"),
    "muglaturkfethiyezirve": ("https://women.volleybox.net/tr/fethiye-zirve-spor-kulubu-t19942", "Fethiye Zirve Spor Kulübü"),
    "ptt": ("https://women.volleybox.net/tr/ptt-spor-ii-t9985", "PTT Spor II"),
    "ahmethamditanpinarortaokulu": ("https://women.volleybox.net/tr/ahmet-hamdi-tanpnar-ortaokulu-t20533", "AHTO Spor Kulübü"),
    "tekmetalsportif": ("https://women.volleybox.net/tr/als-voleybol-t19501", "Tek Metal Sportif SK"),
    "buffgymparsakademi": ("https://women.volleybox.net/tr/pars-akademi-spor-t36227", "Sivas Pars Akademi Spor Kulübü"),
    "lanuevakozmetikanadolumarmara": ("https://women.volleybox.net/tr/anadolu-marmara-sk-t36159", "Anadolu Marmara SK"),
    "parsakademi": ("https://women.volleybox.net/tr/pars-akademi-spor-t36227", "Sivas Pars Akademi Spor Kulübü"),
    "mardinderikrota": ("https://women.volleybox.net/tr/derik-rota-spor-kulubu-t45209", "Derik Rota Spor Kulübü"),
}

def match_volleybox(tvf_name, vb_dict):
    norm_tvf = normalize_for_match(tvf_name)

    if norm_tvf in KNOWN_2_LIG_PROFILE_OVERRIDES:
        return KNOWN_2_LIG_PROFILE_OVERRIDES[norm_tvf]
    
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
    r_standings = fetch_with_retry(
        "TVF standings page",
        lambda: client.get("https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=puan-durumu"),
        max_attempts=3,
        initial_delay=1.0,
    )
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
        res = fetch_with_retry(
            f"TVF standings group {g}",
            lambda: client.post("https://tvf.org.tr/livewire/update", json=payload),
            max_attempts=3,
            initial_delay=1.0,
        )
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
    r_fix = fetch_with_retry(
        "TVF fixtures page",
        lambda: client.get("https://tvf.org.tr/lig/kadinlar-2-ligi?sekme=fikstur"),
        max_attempts=3,
        initial_delay=1.0,
    )
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
        res = fetch_with_retry(
            f"TVF fixtures group {g}",
            lambda: client.post("https://tvf.org.tr/livewire/update", json=payload),
            max_attempts=3,
            initial_delay=1.0,
        )
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
    
    # volleybox-mappings.json yükle (öncelikli ve güvenilir kaynak)
    k2_mappings = {}
    try:
        k2_mappings = load_k2_mappings(VBM_FILE)
        log(f"  📖 {len(k2_mappings)} kayıtlı Volleybox eşleşmesi yüklendi.")
    except Exception as mex:
        log(f"  ⚠️ Mappings yüklenemedi: {mex}")

    all_teams_map = {}
    matched_count = 0
    total_unique_teams = 0
    
    for g, teams in groups_standings.items():
        for t in teams:
            t_name = t["takim_adi"]
            name_clean = t_name.strip().lower()
            
            # 1. Önce volleybox-mappings.json'a bak
            m_info = k2_mappings.get(name_clean)
            if m_info:
                vb_url = m_info.get("volleybox_url")
                vb_name = m_info.get("matched_as")
                logo_val = m_info.get("local_logo") or m_info.get("logo_url")
            else:
                # 2. Canlı Volleybox fuzzy matching fallback
                vb_url, vb_name = match_volleybox(t_name, vb_teams)
                logo_val = None

            t["volleybox_url"] = vb_url
            t["volleybox_name"] = vb_name
            t["grup_no"] = g
            
            # Disk'te logo varsa set et
            if vb_url:
                slug_m = re.search(r"([^/]+)$", vb_url.rstrip("/"))
                if slug_m:
                    slug = re.sub(r"[^a-zA-Z0-9_\-]", "", slug_m.group(1))
                    dest_path = os.path.join(LOGOS_DIR, f"{slug}.png")
                    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 100:
                        logo_val = f"/logos/{slug}.png"
            
            if logo_val:
                t["logo"] = logo_val

            if vb_url:
                matched_count += 1
            if t_name not in all_teams_map:
                all_teams_map[t_name] = t
                total_unique_teams += 1

    # Önceki dosyadan Volleybox maç senkronizasyon verilerini koru (GitHub Actions veya periyodik cronlarda kaybolmasın)
    existing_matches_map = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as ef:
                prev_data = json.load(ef)
                for pm in prev_data.get("tum_maclar", []):
                    m_id = pm.get("id") or f"{pm.get('grup_no')}_{pm.get('mac_no')}"
                    existing_matches_map[m_id] = pm
        except Exception:
            pass

    for g, matches in groups_fixtures.items():
        for m in matches:
            t_a = all_teams_map.get(m["takim_a"])
            t_b = all_teams_map.get(m["takim_b"])
            if t_a:
                if t_a.get("volleybox_url"):
                    m["takim_a_volleybox_url"] = t_a["volleybox_url"]
                if t_a.get("volleybox_name"):
                    m["takim_a_volleybox_name"] = t_a["volleybox_name"]
                if t_a.get("logo") and "takimlogoyok" not in t_a.get("logo", ""):
                    m["takim_a_logo"] = t_a["logo"]
            if t_b:
                if t_b.get("volleybox_url"):
                    m["takim_b_volleybox_url"] = t_b["volleybox_url"]
                if t_b.get("volleybox_name"):
                    m["takim_b_volleybox_name"] = t_b["volleybox_name"]
                if t_b.get("logo") and "takimlogoyok" not in t_b.get("logo", ""):
                    m["takim_b_logo"] = t_b["logo"]

            m_id = m.get("id") or f"{m.get('grup_no')}_{m.get('mac_no')}"
            prev_m = existing_matches_map.get(m_id)
            if prev_m:
                if prev_m.get("volleybox") and not m.get("volleybox"):
                    m["volleybox"] = prev_m["volleybox"]
                if prev_m.get("discrepancy") and not m.get("discrepancy"):
                    m["discrepancy"] = prev_m["discrepancy"]

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

    synced_matches_count = sum(1 for m in all_matches if m.get("volleybox", {}).get("synced"))
    if synced_matches_count > 0:
        payload_data["metadata"]["volleybox_synced_matches"] = synced_matches_count
        payload_data["metadata"]["volleybox_sync_updated_at"] = datetime.now().isoformat()

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(payload_data, f, ensure_ascii=False, indent=2)

    validation_result = validate_kadinlar_2_lig_data(payload_data)
    print_validation_summary("Kadınlar 2. Lig", validation_result)

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

