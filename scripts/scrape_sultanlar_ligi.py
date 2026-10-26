"""
TVF Vodafone Sultanlar Ligi Scraper & Volleybox Eşleştirici
------------------------------------------------------------
Vodafone Sultanlar Ligi resmi puan cetvelini ve fikstürünü TVF Livewire servisinden çeker,
data/sultanlar_ligi.json dosyasını oluşturur.
"""

import sys
import os
import re
import json
from datetime import datetime

# Windows terminal UTF-8 encoding support
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from scripts.atomic_write import atomic_write_json
from scripts.data_quality import fetch_with_retry
import httpx
from bs4 import BeautifulSoup

DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_FILE = os.path.join(DATA_DIR, "sultanlar_ligi.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "X-Livewire": "true",
}

KNOWN_SULTANLAR_VOLLEYBOX = {
    "VAKIFBANK": ("https://women.volleybox.net/vakfbank-t19499", "VakıfBank SK"),
    "FENERBAHÇE MEDICANA": ("https://women.volleybox.net/fenerbahce-t27716", "Fenerbahçe Medicana"),
    "FENERBAHCE MEDICANA": ("https://women.volleybox.net/fenerbahce-t27716", "Fenerbahçe Medicana"),
    "ECZACIBAŞI DYNAVIT": ("https://women.volleybox.net/eczacbas-t10844", "Eczacıbaşı Dynavit"),
    "ECZACIBAŞI PERON İSTANBUL": ("https://women.volleybox.net/eczacbas-t10844", "Eczacıbaşı Dynavit"),
    "ECZACIBASI PERON ISTANBUL": ("https://women.volleybox.net/eczacbas-t10844", "Eczacıbaşı Dynavit"),
    "GALATASARAY DAIKIN": ("https://women.volleybox.net/galatasaray-daikin-t36341", "Galatasaray Daikin"),
    "TÜRK HAVA YOLLARI": ("https://women.volleybox.net/turk-hava-yollar-sk-t41166", "Türk Hava Yolları SK"),
    "TURK HAVA YOLLARI": ("https://women.volleybox.net/turk-hava-yollar-sk-t41166", "Türk Hava Yolları SK"),
    "KUZEYBORU": ("https://women.volleybox.net/kuzeyboru-genclik-ve-spor-kulubu-t41165", "Kuzeyboru"),
    "NİLÜFER BELEDİYESPOR EKER": ("https://women.volleybox.net/nilufer-belediyespor-t41168", "Nilüfer Belediyespor Eker"),
    "NILUFER BELEDIYESPOR EKER": ("https://women.volleybox.net/nilufer-belediyespor-t41168", "Nilüfer Belediyespor Eker"),
    "MURATPAŞA BŞ. BLD. SİGORTA SHOP": ("https://women.volleybox.net/muratpasa-bld-sigorta-shop-t41167", "Muratpaşa Bld. Sigorta Shop"),
    "MURATPASA BS. BLD. SIGORTA SHOP": ("https://women.volleybox.net/muratpasa-bld-sigorta-shop-t41167", "Muratpaşa Bld. Sigorta Shop"),
    "BEŞİKTAŞ": ("https://women.volleybox.net/besiktas-t12698", "Beşiktaş"),
    "BESIKTAS": ("https://women.volleybox.net/besiktas-t12698", "Beşiktaş"),
    "AYDIN BÜYÜKŞEHİR BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t41169", "Aydın Büyükşehir Belediyespor"),
    "AYDIN BUYUKSEHIR BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t41169", "Aydın Büyükşehir Belediyespor"),
    "ÇUKUROVA BELEDİYESPOR": ("https://women.volleybox.net/cukurova-belediyesi-adana-demirspor-t41170", "Çukurova Belediyespor"),
    "CUKUROVA BELEDIYESPOR": ("https://women.volleybox.net/cukurova-belediyesi-adana-demirspor-t41170", "Çukurova Belediyespor"),
    "SARIYER BELEDİYESPOR": ("https://women.volleybox.net/saryer-belediyespor-t41171", "Sarıyer Belediyespor"),
    "SARIYER BELEDIYESPOR": ("https://women.volleybox.net/saryer-belediyespor-t41171", "Sarıyer Belediyespor"),
    "ARAS KARGO": ("https://women.volleybox.net/aras-kargo-spor-kulubu-t41172", "Aras Kargo Spor Kulübü"),
    "BAHÇELİEVLER BELEDİYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t41163", "Bahçelievler Belediyespor"),
    "BAHCELIEVLER BELEDIYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t41163", "Bahçelievler Belediyespor"),
    "ZEREN SPOR": ("https://women.volleybox.net/zeren-spor-kulubu-t41173", "Zeren Spor Kulübü"),
}

def clean_text(val):
    if not val:
        return ""
    if isinstance(val, str):
        return val.strip()
    return str(val).strip()

def extract_standings(snap_dict):
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
                            t_name = clean_text(t.get("TAKIMADI", ""))
                            vb_info = KNOWN_SULTANLAR_VOLLEYBOX.get(t_name.upper()) or KNOWN_SULTANLAR_VOLLEYBOX.get(t_name)
                            vb_url = vb_info[0] if vb_info else None
                            vb_name = vb_info[1] if vb_info else t_name
                            
                            teams.append({
                                "sira": int(t.get("SNO", 0)) if str(t.get("SNO", "0")).isdigit() else 0,
                                "takim_id": str(t.get("TAKIMID", "")),
                                "takim_adi": t_name,
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
                                "grup_no": 1,
                                "grup_adi": "Lig Etabı",
                                "volleybox_url": vb_url,
                                "volleybox_name": vb_name,
                            })
    return teams

def extract_fixtures(snap_dict):
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
                                    
                                    t_a = clean_text(m.get("ATAKIMI", ""))
                                    t_b = clean_text(m.get("BTAKIMI", ""))
                                    vb_a = KNOWN_SULTANLAR_VOLLEYBOX.get(t_a.upper()) or KNOWN_SULTANLAR_VOLLEYBOX.get(t_a)
                                    vb_b = KNOWN_SULTANLAR_VOLLEYBOX.get(t_b.upper()) or KNOWN_SULTANLAR_VOLLEYBOX.get(t_b)
                                    
                                    matches.append({
                                        "id": f"sultanlar_m{m.get('MACNO', '')}_{m.get('ATAKIMIID', '')}_{m.get('BTAKIMIID', '')}",
                                        "mac_no": str(m.get("MACNO", "")),
                                        "grup_no": 1,
                                        "grup_adi": "Lig Etabı",
                                        "hafta": int(week_key) if str(week_key).isdigit() else 1,
                                        "devre": int(m.get("DEVRE", 1) or 1),
                                        "tarih": clean_text(m.get("TARIH", "")),
                                        "gun": clean_text(m.get("GUN", "")),
                                        "saat": clean_text(m.get("SAAT", "")),
                                        "sehir": clean_text(m.get("IL", "")),
                                        "salon": clean_text(m.get("YER", "")),
                                        "takim_a": t_a,
                                        "takim_b": t_b,
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
                                        "takim_a_volleybox_url": vb_a[0] if vb_a else None,
                                        "takim_b_volleybox_url": vb_b[0] if vb_b else None,
                                        "takim_a_volleybox_name": vb_a[1] if vb_a else t_a,
                                        "takim_b_volleybox_name": vb_b[1] if vb_b else t_b,
                                    })
    return matches

def run_sultanlar_scraper():
    print("=" * 70)
    print("🏐 TVF VODAFONE SULTANLAR LİGİ VERİ SENKRONİZASYONU")
    print("=" * 70)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    client = httpx.Client(headers=HEADERS, timeout=30)
    
    # 1. Puan Durumu Çek
    print("📊 Puan Durumu Çekiliyor...")
    r_standings = fetch_with_retry(
        "TVF Sultanlar standings page",
        lambda: client.get("https://tvf.org.tr/lig/sultanlar-ligi?sekme=puan-durumu"),
        max_attempts=3,
        initial_delay=1.0,
    )
    soup_s = BeautifulSoup(r_standings.text, "html.parser")
    target_s = None
    for tag in soup_s.find_all(attrs={"wire:snapshot": True}):
        if "leaguePoints" in tag["wire:snapshot"]:
            target_s = tag
            break
            
    if not target_s:
        print("❌ TVF Sultanlar Ligi Standings snapshot bulunamadı!")
        return False
        
    snap_s = json.loads(target_s["wire:snapshot"])
    teams = extract_standings(snap_s)
    print(f"  ✅ {len(teams)} takım puan durumu başarıyla alındı.")
    
    # 2. Fikstür Çek
    print("📅 Fikstür Çekiliyor...")
    r_fix = fetch_with_retry(
        "TVF Sultanlar fixtures page",
        lambda: client.get("https://tvf.org.tr/lig/sultanlar-ligi?sekme=fikstur"),
        max_attempts=3,
        initial_delay=1.0,
    )
    soup_f = BeautifulSoup(r_fix.text, "html.parser")
    target_f = None
    for tag in soup_f.find_all(attrs={"wire:snapshot": True}):
        if "leagueFixture" in tag["wire:snapshot"]:
            target_f = tag
            break
            
    if not target_f:
        print("❌ TVF Sultanlar Ligi Fixtures snapshot bulunamadı!")
        return False
        
    snap_f = json.loads(target_f["wire:snapshot"])
    matches = extract_fixtures(snap_f)
    print(f"  ✅ {len(matches)} maç fikstürü başarıyla alındı.")
    
    finished_count = sum(1 for m in matches if m["durum"] == "BİTTİ")
    print(f"  🏁 Tamamlanan Maç: {finished_count}, Planlanan Maç: {len(matches) - finished_count}")
    
    payload = {
        "metadata": {
            "lig_adi": "Vodafone Sultanlar Ligi",
            "sezon": "2026-2027",
            "kategori": "Sultanlar Ligi",
            "guncellenme_zamani": datetime.now().isoformat(),
            "toplam_grup_sayisi": 1,
            "toplam_takim_sayisi": len(teams),
            "toplam_mac_sayisi": len(matches),
            "volleybox_eslesme_sayisi": sum(1 for t in teams if t.get("volleybox_url")),
            "resmi_kaynaklar": {
                "tvf_puan_durumu": "https://tvf.org.tr/lig/sultanlar-ligi?sekme=puan-durumu",
                "tvf_fikstur": "https://tvf.org.tr/lig/sultanlar-ligi?sekme=fikstur",
                "tvf_fsw_portal": "https://tvf.org.tr/lig/sultanlar-ligi",
                "volleybox_turnuva": "https://women.volleybox.net/tr/tournaments/turkey",
                "volleybox_maclar": "https://women.volleybox.net/tr/tournaments/turkey",
            },
        },
        "gruplar": [
            {
                "grup_no": 1,
                "grup_adi": "Lig Etabı",
                "takim_sayisi": len(teams),
                "mac_sayisi": len(matches),
                "puan_durumu": teams,
                "fikstur": matches,
            }
        ],
        "tum_maclar": matches,
        "tum_takimlar": teams,
    }
    
    atomic_write_json(OUTPUT_FILE, payload)
    print(f"\n🎉 Sultanlar Ligi verisi kaydedildi -> {OUTPUT_FILE}")
    return True

if __name__ == "__main__":
    success = run_sultanlar_scraper()
    sys.exit(0 if success else 1)
