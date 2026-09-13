"""
TVF Volley Tracker - Base Parser Module
Genç ve Yıldız Kadın/Kız Yerel Ligleri İçin Temel Ayrıştırıcı
"""

import os
import re
import zipfile
import urllib.request
import xml.etree.ElementTree as ET
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional

# Kadın / Kız lig kodları haritası
WOMEN_LEAGUE_MAP = {
    # Genç Kız
    "GKSL": {"category": "Genç", "gender": "Kız", "tier": "Süper Lig", "name": "Genç Kız Süper Lig"},
    "GK1L": {"category": "Genç", "gender": "Kız", "tier": "1. Lig", "name": "Genç Kız 1. Lig"},
    "GK2L": {"category": "Genç", "gender": "Kız", "tier": "2. Lig", "name": "Genç Kız 2. Lig"},
    # Yıldız Kız
    "YKSL": {"category": "Yıldız", "gender": "Kız", "tier": "Süper Lig", "name": "Yıldız Kız Süper Lig"},
    "YK1L": {"category": "Yıldız", "gender": "Kız", "tier": "1. Lig", "name": "Yıldız Kız 1. Lig"},
    "YK2L": {"category": "Yıldız", "gender": "Kız", "tier": "2. Lig", "name": "Yıldız Kız 2. Lig"},
    # Diğer alt yaş kadın kategorileri (isteğe bağlı genişleme için)
    "KKSL": {"category": "Küçük", "gender": "Kız", "tier": "Süper Lig", "name": "Küçük Kız Süper Lig"},
    "KK1L": {"category": "Küçük", "gender": "Kız", "tier": "1. Lig", "name": "Küçük Kız 1. Lig"},
    "MDKSL": {"category": "Midi", "gender": "Kız", "tier": "Süper Lig", "name": "Midi Kız Süper Lig"},
    "MDK1L": {"category": "Midi", "gender": "Kız", "tier": "1. Lig", "name": "Midi Kız 1. Lig"},
}

# Erkek lig kodları (elenmek üzere tanımlı)
MEN_LEAGUE_CODES = {
    "GESL", "GE1L", "GE2L", "YESL", "YE1L", "YE2L", "KESL", "KE1L", "MDESL", "MDE1L"
}

TURKISH_MONTHS = {
    "ocak": 1, "şubat": 2, "subat": 2, "mart": 3, "nisan": 4, "mayıs": 5, "mayis": 5,
    "haziran": 6, "temmuz": 7, "ağustos": 8, "agustos": 8, "eylül": 9, "eylul": 9,
    "ekim": 10, "kasım": 11, "kasim": 11, "aralık": 12, "aralik": 12
}


def normalize_time(val: Any) -> str:
    """
    Excel zaman değerini (float veya string) HH:MM formatına çevirir.
    Örnek: 0.75 -> '18:00', 0.8125 -> '19:30', '19.00' -> '19:00'
    """
    if val is None:
        return ""
    
    val_str = str(val).strip()
    if not val_str:
        return ""

    try:
        f = float(val_str.replace(",", "."))
        if 0 < f < 1:
            total_minutes = int(round(f * 24 * 60))
            hours = (total_minutes // 60) % 24
            minutes = total_minutes % 60
            return f"{hours:02d}:{minutes:02d}"
        elif 1 <= f < 24:
            # Örn 19.00 ya da 19.30
            hours = int(f)
            remainder = f - hours
            minutes = int(round(remainder * 100)) if remainder < 0.6 else int(round(remainder * 60))
            return f"{hours:02d}:{minutes:02d}"
    except (ValueError, TypeError):
        pass

    # Regex ile HH:MM veya HH.MM arama
    m = re.search(r'(\d{1,2})[:.](\d{2})', val_str)
    if m:
        h, mn = int(m.group(1)), int(m.group(2))
        return f"{h:02d}:{mn:02d}"

    return val_str


def parse_turkish_date(text: str) -> Optional[Dict[str, str]]:
    """
    '14 Eylül 2026 Pazartesi' gibi Türkçe tarih metinlerini çözümler.
    Dönüş: {'iso': '2026-09-14', 'day': 'Pazartesi', 'formatted': '14 Eylül 2026, Pazartesi'}
    """
    if not text:
        return None

    cleaned = text.strip()
    pattern = r'(\d{1,2})\s+([A-Za-zÇŞĞÜÖİçşğüöı]+)\s+(\d{4})(?:\s+([A-Za-zÇŞĞÜÖİçşğüöı]+))?'
    m = re.search(pattern, cleaned)
    if not m:
        return None

    day_num = int(m.group(1))
    month_name = m.group(2).lower()
    year_num = int(m.group(3))
    day_name = m.group(4) or ""

    month_num = TURKISH_MONTHS.get(month_name)
    if not month_num:
        return None

    iso_date = f"{year_num:04d}-{month_num:02d}-{day_num:02d}"
    formatted = f"{day_num} {m.group(2)} {year_num}"
    if day_name:
        formatted += f", {day_name}"

    return {
        "iso": iso_date,
        "day": day_name,
        "formatted": formatted,
        "year": year_num,
        "month": month_num,
        "day_num": day_num
    }


def read_xlsx_rows(file_path: str) -> List[Dict[str, str]]:
    """
    Standart kütüphane zipfile ve xml ile XLSX dosyasının ilk sayfasındaki
    tüm satırları sütun harfleriyle (A, B, C, ...) dict olarak döndürür.
    """
    with zipfile.ZipFile(file_path, 'r') as z:
        # Paylaşılan metinleri (sharedStrings.xml) oku
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            tree = ET.fromstring(z.read('xl/sharedStrings.xml'))
            ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
            for si in tree.findall(f'.//{ns}si'):
                text = "".join([t.text for t in si.findall(f'.//{ns}t') if t.text])
                shared_strings.append(text)

        # İlk sayfayı bul
        sheets = [n for n in z.namelist() if n.startswith('xl/worksheets/sheet')]
        if not sheets:
            return []
        
        sheet_tree = ET.fromstring(z.read(sheets[0]))
        ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'

        rows_data = []
        for row in sheet_tree.findall(f'.//{ns}row'):
            cell_dict = {}
            for c in row.findall(f'{ns}c'):
                ref = c.get('r', '')
                col_match = re.match(r'([A-Z]+)', ref)
                if not col_match:
                    continue
                col_letter = col_match.group(1)
                cell_type = c.get('t')
                v = c.find(f'{ns}v')
                val = v.text if v is not None else ""
                
                if cell_type == 's' and val.isdigit() and int(val) < len(shared_strings):
                    val = shared_strings[int(val)]
                cell_dict[col_letter] = val.strip() if isinstance(val, str) else str(val)

            if any(cell_dict.values()):
                rows_data.append(cell_dict)

        return rows_data


class BaseParser(ABC):
    """Tüm il temsilciliği ayrıştırıcıları için soyut taban sınıf."""

    def __init__(self, city_name: str, raw_dir: str):
        self.city_name = city_name
        self.raw_dir = raw_dir
        os.makedirs(self.raw_dir, exist_ok=True)

    @abstractmethod
    def fetch_and_parse(self, target_categories: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Bültenleri indirir ve hedef kategorilere göre normalize edilmiş maçları döndürür.
        target_categories: ['Genç', 'Yıldız'] gibi
        """
        pass
