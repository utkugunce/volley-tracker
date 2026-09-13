"""
scripts/parsers/ankara.py
TVF (Türkiye Voleybol Federasyonu) Ankara Yerel Ligleri Bülten Ayrıştırıcı Modülü
Özellikle Genç ve Yıldız (Kız / Erkek) İl Şampiyonası maçlarına odaklanır.
"""

import os
import re
import json
import logging
from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
logger = logging.getLogger("AnkaraParser")

VALID_CATEGORIES = {
    "GENÇ KIZ": ("Genç", "Kız"),
    "GENC KIZ": ("Genç", "Kız"),
    "GENÇ ERKEK": ("Genç", "Erkek"),
    "GENC ERKEK": ("Genç", "Erkek"),
    "YILDIZ KIZ": ("Yıldız", "Kız"),
    "YILDIZ ERKEK": ("Yıldız", "Erkek"),
}

DEFAULT_HALLS = [
    "Beştepe Voleybol Salonu",
    "Başkent Voleybol Salonu (A Salonu)",
    "Başkent Voleybol Salonu (B Salonu)",
    "Selim Sırrı Tarcan Voleybol Salonu",
    "Gazi Üniversitesi Spor Salonu",
    "ODTÜ Spor Salonu",
    "TED Ankara Koleji Spor Salonu",
]

def clean_text(text: str) -> str:
    """Metin içindeki gereksiz boşlukları ve karakterleri temizler."""
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def normalize_category(raw_cat: str):
    """Kategori metnini normalize eder (örn: 'GENÇ KIZLAR A GRUBU' -> 'Genç Kız', 'Genç', 'Kız', 'A Grubu')"""
    upper_cat = raw_cat.upper()
    age_group = "Genç"
    gender = "Kız"
    group = "Grup Belirtilmedi"

    if "YILDIZ" in upper_cat:
        age_group = "Yıldız"
    elif "GENÇ" in upper_cat or "GENC" in upper_cat:
        age_group = "Genç"

    if "ERKEK" in upper_cat:
        gender = "Erkek"
    elif "KIZ" in upper_cat:
        gender = "Kız"

    group_match = re.search(r"([A-Z0-9])\s*GRUB[Uİ]?", upper_cat)
    if group_match:
        group = f"{group_match.group(1)} Grubu"
    elif "FİNAL" in upper_cat or "FINAL" in upper_cat:
        group = "Final Etabı"
    elif "KLASMAN" in upper_cat:
        group = "Klasman Etabı"

    category_label = f"{age_group} {gender}"
    return category_label, age_group, gender, group

def parse_text_bulletin(content: str) -> List[Dict[str, Any]]:
    """
    TVF Ankara metin / duyuru bültenini satır satır analiz ederek maç listesine dönüştürür.
    Formatlar genellikle:
    TARİH | SAAT | SALON | KATEGORİ | MAÇ NO | EV SAHİBİ - DEPLASMAN | SKOR
    """
    matches = []
    lines = content.splitlines()
    
    current_date = None
    current_hall = None
    current_category = None
    
    date_regex = re.compile(r"(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})")
    time_regex = re.compile(r"(\d{1,2}[:.]\d{2})")
    
    for idx, raw_line in enumerate(lines):
        line = clean_text(raw_line)
        if not line or len(line) < 5:
            continue
        
        # Başlık / Tarih satırı tespiti
        date_match = date_regex.search(line)
        if date_match and ("PAZAR" in line.upper() or "CUMARTESİ" in line.upper() or "CUMA" in line.upper() or len(line) < 35):
            d, m, y = date_match.groups()
            if len(y) == 2:
                y = f"20{y}"
            current_date = f"{y}-{int(m):02d}-{int(d):02d}"
            continue

        # Salon satırı tespiti
        for hall in DEFAULT_HALLS:
            if hall.upper() in line.upper():
                current_hall = hall
                break
        
        # Kategori satırı tespiti
        for cat_key in VALID_CATEGORIES:
            if cat_key in line.upper():
                current_category = line
                break

        # Maç satırı tespiti (İki takım arasında ' - ' veya ' VS ' veya tab)
        if (" - " in line or " – " in line or " / " in line) and any(kw in (current_category or line).upper() for kw in ["GENÇ", "GENC", "YILDIZ"]):
            time_match = time_regex.search(line)
            match_time = time_match.group(1).replace(".", ":") if time_match else "13:00"
            
            # Takımları ayır
            splitter = " - " if " - " in line else (" – " if " – " in line else " / ")
            parts = line.split(splitter)
            if len(parts) >= 2:
                left_part = parts[0]
                right_part = parts[1]
                
                left_cleaned = re.sub(r"^\d+[\s.:-]*", "", left_part)
                left_cleaned = re.sub(r"\d{1,2}[:.]\d{2}", "", left_cleaned).strip()
                
                right_cleaned = right_part.split()[0:4]
                right_cleaned = " ".join(right_cleaned).strip()
                
                cat_label, age_grp, gndr, grp = normalize_category(current_category or line)
                
                match_id = f"ank-{current_date or 'date'}-{len(matches)+1:03d}"
                matches.append({
                    "id": match_id,
                    "date": current_date or datetime.now().strftime("%Y-%m-%d"),
                    "time": match_time,
                    "hall": current_hall or "Beştepe Voleybol Salonu",
                    "category": cat_label,
                    "age_group": age_grp,
                    "gender": gndr,
                    "group": grp,
                    "match_no": str(100 + len(matches) + 1),
                    "home_team": left_cleaned or "Ev Sahibi",
                    "away_team": right_cleaned or "Deplasman",
                    "score": None,
                    "status": "upcoming"
                })

    return matches

def parse_pdf_file(pdf_path: str) -> List[Dict[str, Any]]:
    """PDF bültenini ayrıştırır (pypdf veya pdfplumber kuruluysa kullanır)."""
    text_content = ""
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text_content += (page.extract_text() or "") + "\n"
    except ImportError:
        try:
            import pypdf
            reader = pypdf.PdfReader(pdf_path)
            for page in reader.pages:
                text_content += (page.extract_text() or "") + "\n"
        except ImportError:
            logger.warning("PDF okuyucu kütüphane (pdfplumber veya pypdf) bulunamadı.")
            return []
            
    return parse_text_bulletin(text_content)

def generate_sample_ankara_fixtures() -> List[Dict[str, Any]]:
    """
    Bülten bulunamadığında veya yerel geliştirme/görselleştirme için
    resmi TVF Ankara Genç ve Yıldız şampiyonaları yapısında gerçekçi maç listesi üretir.
    """
    halls = [
        "Beştepe Voleybol Salonu",
        "Başkent Voleybol Salonu (A Salonu)",
        "Başkent Voleybol Salonu (B Salonu)",
        "Selim Sırrı Tarcan Spor Salonu",
    ]

    base_date = date.today()

    sample_matchups = [
        # (Kategori, Yaş, Cinsiyet, Grup, Ev, Dep, Gün Farkı, Saat, Salon, Skor, Durum)
        ("Genç Kız", "Genç", "Kız", "A Grubu", "İlbank Spor Kulübü", "TED Ankara Kolejliler", -2, "14:00", halls[0], "3 - 1", "finished"),
        ("Genç Kız", "Genç", "Kız", "A Grubu", "VakıfBank Ankara Akademi", "Karayolları Spor Kulübü", -2, "16:00", halls[0], "3 - 2", "finished"),
        ("Genç Erkek", "Genç", "Erkek", "A Grubu", "Ziraat Bankkart", "Halkbank", -1, "13:00", halls[1], "3 - 0", "finished"),
        ("Genç Erkek", "Genç", "Erkek", "B Grubu", "TVF Spor Lisesi", "Anadolu Voleybol", -1, "15:30", halls[1], "2 - 3", "finished"),
        
        # Bugün
        ("Genç Kız", "Genç", "Kız", "B Grubu", "Halkbank Spor Kulübü", "TVF Spor Lisesi", 0, "13:00", halls[0], None, "upcoming"),
        ("Yıldız Kız", "Yıldız", "Kız", "A Grubu", "İlbank SK", "VakıfBank Ankara", 0, "15:00", halls[0], None, "upcoming"),
        ("Yıldız Erkek", "Yıldız", "Erkek", "A Grubu", "Ziraat Bankkart", "Başkent Atılım", 0, "17:30", halls[2], None, "upcoming"),
        
        # Önümüzdeki günler / Hafta Sonu
        ("Genç Kız", "Genç", "Kız", "A Grubu", "ODTÜ Spor Kulübü", "Gazi Üniversitesi SK", 1, "11:30", halls[3], None, "upcoming"),
        ("Yıldız Kız", "Yıldız", "Kız", "B Grubu", "Eczacıbaşı Ankara Gelişim", "Batıkent Voleybol", 1, "13:30", halls[3], None, "upcoming"),
        ("Genç Erkek", "Genç", "Erkek", "A Grubu", "TED Ankara Kolejliler", "Maliye İhtisas", 1, "16:00", halls[1], None, "upcoming"),
        ("Yıldız Erkek", "Yıldız", "Erkek", "A Grubu", "Halkbank", "TVF Spor Lisesi Gelişim", 2, "12:00", halls[2], None, "upcoming"),
        ("Yıldız Kız", "Yıldız", "Kız", "A Grubu", "Karayolları", "Gordion Spor Kulübü", 2, "14:00", halls[0], None, "upcoming"),
        ("Genç Kız", "Genç", "Kız", "Final Etabı", "İlbank Spor Kulübü", "VakıfBank Ankara Akademi", 4, "15:00", halls[1], None, "upcoming"),
        ("Genç Erkek", "Genç", "Erkek", "Final Etabı", "Ziraat Bankkart", "TVF Spor Lisesi", 5, "16:30", halls[1], None, "upcoming"),
    ]

    fixtures = []
    match_counter = 1
    for item in sample_matchups:
        cat_label, age_grp, gndr, grp, home, away, day_offset, match_time, hall, score, status = item
        m_date = base_date + timedelta(days=day_offset)
        
        fixtures.append({
            "id": f"ank-{m_date.strftime('%Y%m%d')}-{match_counter:03d}",
            "date": m_date.strftime("%Y-%m-%d"),
            "time": match_time,
            "hall": hall,
            "category": cat_label,
            "age_group": age_grp,
            "gender": gndr,
            "group": grp,
            "match_no": f"{2000 + match_counter}",
            "home_team": home,
            "away_team": away,
            "score": score,
            "status": status
        })
        match_counter += 1

    return fixtures

def save_fixtures_to_json(fixtures: List[Dict[str, Any]], target_path: str):
    """Normalize edilmiş maç listesini fixtures.json dosyasına atomik olarak kaydeder."""
    os.makedirs(os.path.dirname(os.path.abspath(target_path)), exist_ok=True)
    
    sorted_fixtures = sorted(fixtures, key=lambda x: (x.get("date", ""), x.get("time", "")))
    
    payload = {
        "updated_at": datetime.now().isoformat(),
        "total_matches": len(sorted_fixtures),
        "source": "TVF Ankara Voleybol İl Temsilciliği Bülteni",
        "filters": {
            "categories": ["Tümü", "Genç Kız", "Genç Erkek", "Yıldız Kız", "Yıldız Erkek"],
            "age_groups": ["Tümü", "Genç", "Yıldız"],
            "genders": ["Tümü", "Kız", "Erkek"],
            "halls": sorted(list({f["hall"] for f in sorted_fixtures if f.get("hall")}))
        },
        "matches": sorted_fixtures
    }
    
    tmp_path = f"{target_path}.tmp"
    with open(tmp_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    os.replace(tmp_path, target_path)
    logger.info(f"Kaydedildi: {target_path} (Toplam {len(sorted_fixtures)} maç)")
