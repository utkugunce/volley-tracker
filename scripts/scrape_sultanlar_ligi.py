"""
TVF Vodafone Sultanlar Ligi Scraper & Volleybox Eşleştirici
------------------------------------------------------------
Vodafone Sultanlar Ligi resmi puan cetvelini ve fikstürünü TVF Livewire servisinden çeker,
data/sultanlar_ligi.json dosyasını oluşturur ve Volleybox maçlarıyla senkronize eder.
"""

import sys
import os
import re
import json
from pathlib import Path
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
    "VAKIFBANK": ("https://women.volleybox.net/vakfbank-t2309", "VakıfBank"),
    "FENERBAHÇE MEDICANA": ("https://women.volleybox.net/fenerbahce-t2110", "Fenerbahçe Medicana"),
    "FENERBAHCE MEDICANA": ("https://women.volleybox.net/fenerbahce-t2110", "Fenerbahçe Medicana"),
    "ECZACIBAŞI DYNAVIT": ("https://women.volleybox.net/eczacbas-dynavit-t2102", "Eczacıbaşı Dynavit"),
    "ECZACIBAŞI PERON İSTANBUL": ("https://women.volleybox.net/eczacbas-dynavit-t2102", "Eczacıbaşı Peron İstanbul"),
    "ECZACIBASI PERON ISTANBUL": ("https://women.volleybox.net/eczacbas-dynavit-t2102", "Eczacıbaşı Peron İstanbul"),
    "ECZACIBAŞI": ("https://women.volleybox.net/eczacbas-dynavit-t2102", "Eczacıbaşı Dynavit"),
    "ECZACIBASI": ("https://women.volleybox.net/eczacbas-dynavit-t2102", "Eczacıbaşı Dynavit"),
    "GALATASARAY DAIKIN": ("https://women.volleybox.net/galatasaray-daikin-t2114", "Galatasaray Daikin"),
    "TÜRK HAVA YOLLARI": ("https://women.volleybox.net/turk-hava-yollar-sk-t5656", "Türk Hava Yolları SK"),
    "TURK HAVA YOLLARI": ("https://women.volleybox.net/turk-hava-yollar-sk-t5656", "Türk Hava Yolları SK"),
    "THY": ("https://women.volleybox.net/turk-hava-yollar-sk-t5656", "Türk Hava Yolları SK"),
    "KUZEYBORU": ("https://women.volleybox.net/kuzeyboru-t7366", "Kuzeyboru"),
    "NİLÜFER BELEDİYESPOR EKER": ("https://women.volleybox.net/nilufer-belediyespor-t2202", "Nilüfer Belediyespor Eker"),
    "NILUFER BELEDIYESPOR EKER": ("https://women.volleybox.net/nilufer-belediyespor-t2202", "Nilüfer Belediyespor Eker"),
    "BEŞİKTAŞ": ("https://women.volleybox.net/besiktas-t2041", "Beşiktaş"),
    "BESIKTAS": ("https://women.volleybox.net/besiktas-t2041", "Beşiktaş"),
    "ARAS KARGO": ("https://women.volleybox.net/aras-kargo-spor-kulubu-t23393", "Aras Kargo Spor Kulübü"),
    "ZEREN SPOR": ("https://women.volleybox.net/zeren-spor-kulubu-t20927", "Zeren Spor Kulübü"),
    "GÖZTEPE YUPPO": ("https://women.volleybox.net/goztepe-sk-t2789", "Göztepe Yuppo"),
    "GOZTEPE YUPPO": ("https://women.volleybox.net/goztepe-sk-t2789", "Göztepe Yuppo"),
    "GÖZTEPE": ("https://women.volleybox.net/goztepe-sk-t2789", "Göztepe Yuppo"),
    "GOZTEPE": ("https://women.volleybox.net/goztepe-sk-t2789", "Göztepe Yuppo"),
    "İLBANK": ("https://women.volleybox.net/lbank-t2495", "İlbank"),
    "ILBANK": ("https://women.volleybox.net/lbank-t2495", "İlbank"),
    "MANİSA BÜYÜKŞEHİR BELEDİYE SPOR": ("https://women.volleybox.net/manisa-bbsk-t23887", "Manisa Büyükşehir Belediyespor Kulübü"),
    "MANISA BUYUKSEHIR BELEDIYE SPOR": ("https://women.volleybox.net/manisa-bbsk-t23887", "Manisa Büyükşehir Belediyespor Kulübü"),
    "MANİSA BŞ. BLD.": ("https://women.volleybox.net/manisa-bbsk-t23887", "Manisa Büyükşehir Belediyespor Kulübü"),
    "MANISA BS. BLD.": ("https://women.volleybox.net/manisa-bbsk-t23887", "Manisa Büyükşehir Belediyespor Kulübü"),
    "MANİSA BBSK": ("https://women.volleybox.net/manisa-bbsk-t23887", "Manisa Büyükşehir Belediyespor Kulübü"),
    "SİNNADA HOTELS AFYON BELEDİYE YÜNTAŞ": ("https://women.volleybox.net/afyon-belediye-yuntas-sk-t31955", "Sinnada Hotels Afyon Belediye Yüntaş Spor Kulübü"),
    "SINNADA HOTELS AFYON BELEDIYE YUNTAS": ("https://women.volleybox.net/afyon-belediye-yuntas-sk-t31955", "Sinnada Hotels Afyon Belediye Yüntaş Spor Kulübü"),
    "AFYON BELEDİYE YÜNTAŞ": ("https://women.volleybox.net/afyon-belediye-yuntas-sk-t31955", "Sinnada Hotels Afyon Belediye Yüntaş Spor Kulübü"),
    "AFYON BELEDIYE YUNTAS": ("https://women.volleybox.net/afyon-belediye-yuntas-sk-t31955", "Sinnada Hotels Afyon Belediye Yüntaş Spor Kulübü"),
    "AYDIN BÜYÜKŞEHİR BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    "AYDIN BUYUKSEHIR BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    "BAHÇELİEVLER BELEDİYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    "BAHCELIEVLER BELEDIYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    "MURATPAŞA BŞ. BLD. SİGORTA SHOP": ("https://women.volleybox.net/muratpasa-bld-sigorta-shop-t41167", "Muratpaşa Bld. Sigorta Shop"),
    "SARIYER BELEDİYESPOR": ("https://women.volleybox.net/saryer-belediyespor-t41171", "Sarıyer Belediyespor"),
    "ÇUKUROVA BELEDİYESPOR": ("https://women.volleybox.net/cukurova-belediyesi-adana-demirspor-t41170", "Çukurova Belediyespor"),
}

def clean_text(val):
    if not val:
        return ""
    if isinstance(val, str):
        return val.strip()
    return str(val).strip()

def get_volleybox_info(team_name: str):
    clean = clean_text(team_name)
    if not clean:
        return None
    info = KNOWN_SULTANLAR_VOLLEYBOX.get(clean.upper()) or KNOWN_SULTANLAR_VOLLEYBOX.get(clean)
    if info:
        return info
    # Try normalized keys
    norm = clean.upper().replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
    for k, v in KNOWN_SULTANLAR_VOLLEYBOX.items():
        k_norm = k.upper().replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
        if norm == k_norm:
            return v
    return None

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
                            vb_info = get_volleybox_info(t_name)
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
                                    vb_a = get_volleybox_info(t_a)
                                    vb_b = get_volleybox_info(t_b)
                                    
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
    
    matched_teams_count = sum(1 for t in teams if t.get("volleybox_url"))
    print(f"  🔗 Volleybox Eşleşen Takım: {matched_teams_count} / {len(teams)}")
    
    payload = {
        "metadata": {
            "lig_adi": "Vodafone Sultanlar Ligi",
            "sezon": "2026-2027",
            "kategori": "Sultanlar Ligi",
            "guncellenme_zamani": datetime.now().isoformat(),
            "toplam_grup_sayisi": 1,
            "toplam_takim_sayisi": len(teams),
            "toplam_mac_sayisi": len(matches),
            "volleybox_eslesme_sayisi": matched_teams_count,
            "resmi_kaynaklar": {
                "tvf_puan_durumu": "https://tvf.org.tr/lig/sultanlar-ligi?sekme=puan-durumu",
                "tvf_fikstur": "https://tvf.org.tr/lig/sultanlar-ligi?sekme=fikstur",
                "tvf_fsw_portal": "https://tvf.org.tr/lig/sultanlar-ligi",
                "volleybox_turnuva": "https://women.volleybox.net/tr/women-vodafone-sultanlar-ligi-2026-27-o45086",
                "volleybox_maclar": "https://women.volleybox.net/tr/women-vodafone-sultanlar-ligi-2026-27-o45086/matches",
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

def main():
    success = run_sultanlar_scraper()
    if success:
        try:
            from scripts.sync_volleybox_matches import sync_sultanlar_ligi_matches
            print("\n🏐 Volleybox Sultanlar Ligi maçları senkronize ediliyor...")
            sult_path = Path(OUTPUT_FILE)
            synced, total = sync_sultanlar_ligi_matches(sult_path)
            print(f"✅ Vodafone Sultanlar Ligi: {synced} / {total} maç Volleybox ile eşleşti ve doğrulandı!")
        except Exception as e:
            print(f"⚠️ Volleybox maç senkronizasyonu atlandı: {e}")
    return success

if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
