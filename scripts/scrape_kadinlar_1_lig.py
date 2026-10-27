"""
TVF KFC Kadınlar 1. Ligi Scraper & Volleybox Eşleştirici
---------------------------------------------------------
KFC Kadınlar 1. Ligi (Grup A & Grup B) resmi puan cetvelini ve fikstürünü TVF Livewire servisinden çeker,
data/kadinlar_1_lig.json dosyasını oluşturur ve Volleybox maçlarıyla senkronize eder.
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
OUTPUT_FILE = os.path.join(DATA_DIR, "kadinlar_1_lig.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "X-Livewire": "true",
}

KNOWN_KADINLAR_1_LIG_VOLLEYBOX = {
    # --- GRUP A ---
    "AYDIN BÜYÜKŞEHİR BELEDİYE SPOR": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    "AYDIN BUYUKSEHIR BELEDIYE SPOR": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    "AYDIN BŞ. BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    "AYDIN BS. BLD.": ("https://women.volleybox.net/aydn-buyuksehir-belediyespor-t6309", "Aydın Büyükşehir Belediyespor"),
    
    "KARŞIYAKA": ("https://women.volleybox.net/karsyaka-sk-t2101", "Endo Karşıyaka"),
    "KARSIYAKA": ("https://women.volleybox.net/karsyaka-sk-t2101", "Endo Karşıyaka"),
    "ENDO KARŞIYAKA": ("https://women.volleybox.net/karsyaka-sk-t2101", "Endo Karşıyaka"),
    "ENDO KARSIYAKA": ("https://women.volleybox.net/karsyaka-sk-t2101", "Endo Karşıyaka"),
    
    "BAHÇELİEVLER BELEDİYE SPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    "BAHCELIEVLER BELEDIYE SPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    "BAHÇELİEVLER BELEDİYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    "BAHCELIEVLER BELEDIYESPOR": ("https://women.volleybox.net/bahcelievler-belediyespor-t10062", "Bahçelievler Belediyespor"),
    
    "DENİZLİ BÜYÜKŞEHİR BELEDİYE SPOR": ("https://women.volleybox.net/denizli-buyuksehir-belediyespor-t17128", "Denizli Büyükşehir Belediyespor"),
    "DENIZLI BUYUKSEHIR BELEDIYE SPOR": ("https://women.volleybox.net/denizli-buyuksehir-belediyespor-t17128", "Denizli Büyükşehir Belediyespor"),
    "DENİZLİ BŞ. BLD.": ("https://women.volleybox.net/denizli-buyuksehir-belediyespor-t17128", "Denizli Büyükşehir Belediyespor"),
    
    "YEŞİLYURT": ("https://women.volleybox.net/yesilyurt-t2332", "Yeşilyurt Spor Kulübü"),
    "YESILYURT": ("https://women.volleybox.net/yesilyurt-t2332", "Yeşilyurt Spor Kulübü"),
    "YEŞİLYURT SPOR KULÜBÜ": ("https://women.volleybox.net/yesilyurt-t2332", "Yeşilyurt Spor Kulübü"),
    
    "İBB SPOR KULÜBÜ": ("https://women.volleybox.net/bb-spor-kulubu-t2999", "İBB Spor Kulübü"),
    "IBB SPOR KULUBU": ("https://women.volleybox.net/bb-spor-kulubu-t2999", "İBB Spor Kulübü"),
    "İSTANBUL BŞ. BLD.": ("https://women.volleybox.net/bb-spor-kulubu-t2999", "İBB Spor Kulübü"),
    "İBB": ("https://women.volleybox.net/bb-spor-kulubu-t2999", "İBB Spor Kulübü"),
    
    "AKHİSAR BELEDİYESPOR": ("https://women.volleybox.net/akhisar-belediyespor-kulubu-t16792", "Akhisar Belediyespor Kulübü"),
    "AKHISAR BELEDIYESPOR": ("https://women.volleybox.net/akhisar-belediyespor-kulubu-t16792", "Akhisar Belediyespor Kulübü"),
    "AKHİSAR BELEDİYESPOR KULÜBÜ": ("https://women.volleybox.net/akhisar-belediyespor-kulubu-t16792", "Akhisar Belediyespor Kulübü"),
    
    "ECZACIBAŞI": ("https://women.volleybox.net/eczacbas-ii-t13581", "Eczacıbaşı II"),
    "ECZACIBASI": ("https://women.volleybox.net/eczacbas-ii-t13581", "Eczacıbaşı II"),
    "ECZACIBAŞI II": ("https://women.volleybox.net/eczacbas-ii-t13581", "Eczacıbaşı II"),
    "ECZACIBASI II": ("https://women.volleybox.net/eczacbas-ii-t13581", "Eczacıbaşı II"),
    
    "BODRUM BELEDİYESİ BODRUMSPOR": ("https://women.volleybox.net/bodrum-belediyesi-bodrumspor-t19927", "Bodrum Belediyesi Bodrumspor"),
    "BODRUM BELEDIYESI BODRUMSPOR": ("https://women.volleybox.net/bodrum-belediyesi-bodrumspor-t19927", "Bodrum Belediyesi Bodrumspor"),
    "BODRUMSPOR": ("https://women.volleybox.net/bodrum-belediyesi-bodrumspor-t19927", "Bodrum Belediyesi Bodrumspor"),
    
    "ATEŞ WIND POWER BERGAMA BELEDİYESİ SPOR": ("https://women.volleybox.net/bergama-belediyesi-gsk-t7365", "Ateş Wind Power Bergama Belediyespor"),
    "ATES WIND POWER BERGAMA BELEDIYESI SPOR": ("https://women.volleybox.net/bergama-belediyesi-gsk-t7365", "Ateş Wind Power Bergama Belediyespor"),
    "BERGAMA BELEDİYESPOR": ("https://women.volleybox.net/bergama-belediyesi-gsk-t7365", "Ateş Wind Power Bergama Belediyespor"),
    "BERGAMA BELEDIYESPOR": ("https://women.volleybox.net/bergama-belediyesi-gsk-t7365", "Ateş Wind Power Bergama Belediyespor"),
    
    "VAKIFBANK": ("https://women.volleybox.net/vakfbank-ii-t7387", "Vakıfbank II"),
    "VAKIFBANK II": ("https://women.volleybox.net/vakfbank-ii-t7387", "Vakıfbank II"),
    
    "İZMİR DSİ": ("https://women.volleybox.net/zmir-ds-spor-t16172", "İzmir DSİ Spor"),
    "IZMIR DSI": ("https://women.volleybox.net/zmir-ds-spor-t16172", "İzmir DSİ Spor"),
    "İZMİR DSİ SPOR": ("https://women.volleybox.net/zmir-ds-spor-t16172", "İzmir DSİ Spor"),
    
    "FENERBAHÇE MEDICANA": ("https://women.volleybox.net/fenerbahce-ll-t10043", "Fenerbahçe Medicana II"),
    "FENERBAHCE MEDICANA": ("https://women.volleybox.net/fenerbahce-ll-t10043", "Fenerbahçe Medicana II"),
    "FENERBAHÇE II": ("https://women.volleybox.net/fenerbahce-ll-t10043", "Fenerbahçe Medicana II"),
    "FENERBAHCE II": ("https://women.volleybox.net/fenerbahce-ll-t10043", "Fenerbahçe Medicana II"),
    
    "ALTINORDU": ("https://women.volleybox.net/altnordu-voleybol-t11785", "Altınordu Voleybol"),
    "ALTINORDU VOLEYBOL": ("https://women.volleybox.net/altnordu-voleybol-t11785", "Altınordu Voleybol"),

    # --- GRUP B ---
    "MERİNOS VOLEYBOL": ("https://women.volleybox.net/merinos-sk-t7345", "Merinos SK"),
    "MERINOS VOLEYBOL": ("https://women.volleybox.net/merinos-sk-t7345", "Merinos SK"),
    "MERİNOS SK": ("https://women.volleybox.net/merinos-sk-t7345", "Merinos SK"),
    "MERİNOS": ("https://women.volleybox.net/merinos-sk-t7345", "Merinos SK"),
    
    "PTT": ("https://women.volleybox.net/ptt-spor-t6614", "PTT Spor"),
    "PTT SPOR": ("https://women.volleybox.net/ptt-spor-t6614", "PTT Spor"),
    
    "KUZEYBORU MAXİPİPE SPOR": ("https://women.volleybox.net/kuzeyboru-ll-t38907", "Kuzeyboru Maxipipe Spor Kulübü"),
    "KUZEYBORU MAXIPIPE SPOR": ("https://women.volleybox.net/kuzeyboru-ll-t38907", "Kuzeyboru Maxipipe Spor Kulübü"),
    "KUZEYBORU II": ("https://women.volleybox.net/kuzeyboru-ll-t38907", "Kuzeyboru Maxipipe Spor Kulübü"),
    
    "MURATPAŞA BLD. AÇI KOLEJİ": ("https://women.volleybox.net/muratpasa-bld-ac-koleji-t15600", "Muratpaşa Belediyespor Açı Koleji"),
    "MURATPASA BLD. ACI KOLEJI": ("https://women.volleybox.net/muratpasa-bld-ac-koleji-t15600", "Muratpaşa Belediyespor Açı Koleji"),
    "MURATPAŞA BELEDİYESPOR AÇI KOLEJİ": ("https://women.volleybox.net/muratpasa-bld-ac-koleji-t15600", "Muratpaşa Belediyespor Açı Koleji"),
    
    "KARAYOLLARI": ("https://women.volleybox.net/karayollar-spor-kulubu-t3000", "Karayolları Spor Kulübü"),
    "KARAYOLLARI SPOR KULÜBÜ": ("https://women.volleybox.net/karayollar-spor-kulubu-t3000", "Karayolları Spor Kulübü"),
    
    "07 MEGA SPOR": ("https://women.volleybox.net/07-mega-spor-kulubu-t16892", "07 Mega Spor Kulübü"),
    "07 MEGA SPOR KULÜBÜ": ("https://women.volleybox.net/07-mega-spor-kulubu-t16892", "07 Mega Spor Kulübü"),
    
    "İBA KİMYA TED ANKARA KOLEJLİLER": ("https://women.volleybox.net/ted-ankara-kolejliler-t2285", "İba Kimya TED Ankara Kolejliler"),
    "IBA KIMYA TED ANKARA KOLEJLILER": ("https://women.volleybox.net/ted-ankara-kolejliler-t2285", "İba Kimya TED Ankara Kolejliler"),
    "TED ANKARA KOLEJLİLER": ("https://women.volleybox.net/ted-ankara-kolejliler-t2285", "İba Kimya TED Ankara Kolejliler"),
    "TED KOLEJLİLER": ("https://women.volleybox.net/ted-ankara-kolejliler-t2285", "İba Kimya TED Ankara Kolejliler"),
    
    "TRENDY HOTELS MANAVGAT BELEDİYE SPOR": ("https://women.volleybox.net/trendy-hotels-manavgat-belediyespor-t22708", "Trendy Hotels Manavgat Belediyespor"),
    "TRENDY HOTELS MANAVGAT BELEDIYE SPOR": ("https://women.volleybox.net/trendy-hotels-manavgat-belediyespor-t22708", "Trendy Hotels Manavgat Belediyespor"),
    "MANAVGAT BELEDİYESPOR": ("https://women.volleybox.net/trendy-hotels-manavgat-belediyespor-t22708", "Trendy Hotels Manavgat Belediyespor"),
    "MANAVGAT BELEDIYESPOR": ("https://women.volleybox.net/trendy-hotels-manavgat-belediyespor-t22708", "Trendy Hotels Manavgat Belediyespor"),
    
    "SAKARYA VOLEYBOL": ("https://women.volleybox.net/sakarya-voleybol-t12299", "Sakarya Voleybol SK"),
    "SAKARYA VOLEYBOL SK": ("https://women.volleybox.net/sakarya-voleybol-t12299", "Sakarya Voleybol SK"),
    
    "NİLÜFER BELEDİYESPOR": ("https://women.volleybox.net/nilufer-belediyespor-ii-t13582", "Nilüfer Belediyespor II"),
    "NILUFER BELEDIYESPOR": ("https://women.volleybox.net/nilufer-belediyespor-ii-t13582", "Nilüfer Belediyespor II"),
    "NİLÜFER BELEDİYESPOR II": ("https://women.volleybox.net/nilufer-belediyespor-ii-t13582", "Nilüfer Belediyespor II"),
    
    "BÜYÜKŞEHİR BELEDİYESİ ANKARA SPOR": ("https://women.volleybox.net/buyuksehir-belediyesi-ankara-spor-t18653", "Ankara Büyükşehir Belediyesi Spor Kulübü"),
    "BUYUKSEHIR BELEDIYESI ANKARA SPOR": ("https://women.volleybox.net/buyuksehir-belediyesi-ankara-spor-t18653", "Ankara Büyükşehir Belediyesi Spor Kulübü"),
    "ANKARA BÜYÜKŞEHİR BLD.": ("https://women.volleybox.net/buyuksehir-belediyesi-ankara-spor-t18653", "Ankara Büyükşehir Belediyesi Spor Kulübü"),
    "ANKARA BŞ. BLD.": ("https://women.volleybox.net/buyuksehir-belediyesi-ankara-spor-t18653", "Ankara Büyükşehir Belediyesi Spor Kulübü"),
    
    "ALFEMO ZEREN SPOR": ("https://women.volleybox.net/zeren-spor-kulubu-ii-t29358", "Alfemo Zeren Spor"),
    "ZEREN SPOR II": ("https://women.volleybox.net/zeren-spor-kulubu-ii-t29358", "Alfemo Zeren Spor"),
    
    "İLBANK": ("https://women.volleybox.net/lbank-ll-t16681", "İlbank ll"),
    "ILBANK": ("https://women.volleybox.net/lbank-ll-t16681", "İlbank ll"),
    "İLBANK II": ("https://women.volleybox.net/lbank-ll-t16681", "İlbank ll"),
    
    "SİGORTA SHOP SPOR": ("https://women.volleybox.net/kecioren-belediyesi-sigortashop-spor-kulubu-t13477", "Sigorta Shop Spor Kulübü"),
    "SIGORTA SHOP SPOR": ("https://women.volleybox.net/kecioren-belediyesi-sigortashop-spor-kulubu-t13477", "Sigorta Shop Spor Kulübü"),
    "SİGORTA SHOP": ("https://women.volleybox.net/kecioren-belediyesi-sigortashop-spor-kulubu-t13477", "Sigorta Shop Spor Kulübü"),
    "SIGORTA SHOP": ("https://women.volleybox.net/kecioren-belediyesi-sigortashop-spor-kulubu-t13477", "Sigorta Shop Spor Kulübü"),
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
    info = KNOWN_KADINLAR_1_LIG_VOLLEYBOX.get(clean.upper()) or KNOWN_KADINLAR_1_LIG_VOLLEYBOX.get(clean)
    if info:
        return info
    # Try normalized keys
    norm = clean.upper().replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
    for k, v in KNOWN_KADINLAR_1_LIG_VOLLEYBOX.items():
        k_norm = k.upper().replace("İ", "I").replace("Ğ", "G").replace("Ü", "U").replace("Ş", "S").replace("Ö", "O").replace("Ç", "C")
        if norm == k_norm:
            return v
    return None

def extract_standings(snap_dict, group_no: int, group_name: str):
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
                                "grup_no": group_no,
                                "grup_adi": group_name,
                                "volleybox_url": vb_url,
                                "volleybox_name": vb_name,
                            })
    return teams

def extract_fixtures(snap_dict, group_no: int, group_name: str):
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
                                        "id": f"k1l_g{group_no}_m{m.get('MACNO', '')}_{m.get('ATAKIMIID', '')}_{m.get('BTAKIMIID', '')}",
                                        "mac_no": str(m.get("MACNO", "")),
                                        "grup_no": group_no,
                                        "grup_adi": group_name,
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

def run_kadinlar_1_lig_scraper():
    print("=" * 70)
    print("🏐 TVF KFC KADINLAR 1. LİGİ VERİ SENKRONİZASYONU")
    print("=" * 70)
    
    os.makedirs(DATA_DIR, exist_ok=True)
    client = httpx.Client(headers=HEADERS, timeout=30)
    
    # 1. Puan Durumu Çek (Grup A & Grup B)
    print("📊 Puan Durumu Çekiliyor...")
    r_standings = fetch_with_retry(
        "TVF K1L standings page",
        lambda: client.get("https://tvf.org.tr/lig/kadinlar-1-ligi?sekme=puan-durumu"),
        max_attempts=3,
        initial_delay=1.0,
    )
    soup_s = BeautifulSoup(r_standings.text, "html.parser")
    csrf_s = soup_s.find("meta", attrs={"name": "csrf-token"})["content"]
    client.headers["X-CSRF-TOKEN"] = csrf_s
    
    target_s = None
    for tag in soup_s.find_all(attrs={"wire:snapshot": True}):
        if "leaguePoints" in tag["wire:snapshot"]:
            target_s = tag
            break
            
    if not target_s:
        print("❌ TVF K1L Standings snapshot bulunamadı!")
        return False
        
    snap_sa_str = target_s["wire:snapshot"]
    teams_a = extract_standings(json.loads(snap_sa_str), 1, "A Grubu")
    print(f"  ✅ A Grubu: {len(teams_a)} takım puan durumu alındı.")
    
    # Grup B Puan Durumu
    payload_sb = {
        "_token": csrf_s,
        "components": [{
            "snapshot": snap_sa_str,
            "updates": {},
            "calls": [{"path": "", "method": "setFilter", "params": ["GR", "B"]}]
        }]
    }
    res_sb = fetch_with_retry(
        "TVF K1L standings group B",
        lambda: client.post("https://tvf.org.tr/livewire/update", json=payload_sb),
        max_attempts=3,
        initial_delay=1.0,
    )
    teams_b = []
    if res_sb.status_code == 200:
        snap_sb = json.loads(res_sb.json()["components"][0]["snapshot"])
        teams_b = extract_standings(snap_sb, 2, "B Grubu")
        print(f"  ✅ B Grubu: {len(teams_b)} takım puan durumu alındı.")
    else:
        print(f"  ⚠️ B Grubu puan durumu alınamadı ({res_sb.status_code})")
        
    # 2. Fikstür Çek (Grup A & Grup B)
    print("📅 Fikstür Çekiliyor...")
    r_fix = fetch_with_retry(
        "TVF K1L fixtures page",
        lambda: client.get("https://tvf.org.tr/lig/kadinlar-1-ligi?sekme=fikstur"),
        max_attempts=3,
        initial_delay=1.0,
    )
    soup_f = BeautifulSoup(r_fix.text, "html.parser")
    csrf_f = soup_f.find("meta", attrs={"name": "csrf-token"})["content"]
    client.headers["X-CSRF-TOKEN"] = csrf_f
    
    target_f = None
    for tag in soup_f.find_all(attrs={"wire:snapshot": True}):
        if "leagueFixture" in tag["wire:snapshot"]:
            target_f = tag
            break
            
    if not target_f:
        print("❌ TVF K1L Fixtures snapshot bulunamadı!")
        return False
        
    snap_fa_str = target_f["wire:snapshot"]
    matches_a = extract_fixtures(json.loads(snap_fa_str), 1, "A Grubu")
    print(f"  ✅ A Grubu: {len(matches_a)} maç fikstürü alındı.")
    
    # Grup B Fikstürü
    payload_fb = {
        "_token": csrf_f,
        "components": [{
            "snapshot": snap_fa_str,
            "updates": {},
            "calls": [{"path": "", "method": "setFilter", "params": ["GR", "B"]}]
        }]
    }
    res_fb = fetch_with_retry(
        "TVF K1L fixtures group B",
        lambda: client.post("https://tvf.org.tr/livewire/update", json=payload_fb),
        max_attempts=3,
        initial_delay=1.0,
    )
    matches_b = []
    if res_fb.status_code == 200:
        snap_fb = json.loads(res_fb.json()["components"][0]["snapshot"])
        matches_b = extract_fixtures(snap_fb, 2, "B Grubu")
        print(f"  ✅ B Grubu: {len(matches_b)} maç fikstürü alındı.")
    else:
        print(f"  ⚠️ B Grubu fikstürü alınamadı ({res_fb.status_code})")
        
    all_teams = teams_a + teams_b
    all_matches = matches_a + matches_b
    finished_count = sum(1 for m in all_matches if m["durum"] == "BİTTİ")
    matched_teams_count = sum(1 for t in all_teams if t.get("volleybox_url"))
    
    print(f"  🏁 Toplam: {len(all_teams)} Takım ({matched_teams_count} Volleybox eşleşti), {len(all_matches)} Maç ({finished_count} Tamamlandı)")
    
    payload = {
        "metadata": {
            "lig_adi": "KFC Kadınlar 1. Ligi",
            "sezon": "2026-2027",
            "kategori": "Kadınlar 1. Ligi",
            "guncellenme_zamani": datetime.now().isoformat(),
            "toplam_grup_sayisi": 2,
            "toplam_takim_sayisi": len(all_teams),
            "toplam_mac_sayisi": len(all_matches),
            "volleybox_eslesme_sayisi": matched_teams_count,
            "resmi_kaynaklar": {
                "tvf_puan_durumu": "https://tvf.org.tr/lig/kadinlar-1-ligi?sekme=puan-durumu",
                "tvf_fikstur": "https://tvf.org.tr/lig/kadinlar-1-ligi?sekme=fikstur",
                "tvf_fsw_portal": "https://tvf.org.tr/lig/kadinlar-1-ligi",
                "volleybox_turnuva": "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-1-ligi-2026-27-o45210",
                "volleybox_maclar": "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-1-ligi-2026-27-o45210/matches",
            },
        },
        "gruplar": [
            {
                "grup_no": 1,
                "grup_adi": "A Grubu",
                "takim_sayisi": len(teams_a),
                "mac_sayisi": len(matches_a),
                "puan_durumu": teams_a,
                "fikstur": matches_a,
            },
            {
                "grup_no": 2,
                "grup_adi": "B Grubu",
                "takim_sayisi": len(teams_b),
                "mac_sayisi": len(matches_b),
                "puan_durumu": teams_b,
                "fikstur": matches_b,
            },
        ],
        "tum_maclar": all_matches,
        "tum_takimlar": all_teams,
    }
    
    atomic_write_json(OUTPUT_FILE, payload)
    print(f"\n🎉 Kadınlar 1. Ligi verisi kaydedildi -> {OUTPUT_FILE}")
    return True

def main():
    success = run_kadinlar_1_lig_scraper()
    if success:
        try:
            from scripts.sync_volleybox_matches import sync_kadinlar_1_lig_matches
            print("\n🏐 Volleybox Kadınlar 1. Ligi maçları senkronize ediliyor...")
            k1_path = Path(OUTPUT_FILE)
            synced, total = sync_kadinlar_1_lig_matches(k1_path)
            print(f"✅ KFC Kadınlar 1. Ligi: {synced} / {total} maç Volleybox ile eşleşti ve doğrulandı!")
        except Exception as e:
            print(f"⚠️ Volleybox maç senkronizasyonu atlandı: {e}")
    return success

if __name__ == "__main__":
    ok = main()
    sys.exit(0 if ok else 1)
