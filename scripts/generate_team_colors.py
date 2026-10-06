#!/usr/bin/env python3
"""
Takım logolarını (public/logos/*.png) tarayarak her kulübün gerçek ve tutarlı
renk paletini çıkaran ve src/data/team-colors.json dosyasına derleyen script.

Çıkarılan alanlar:
- primary: Baskın logo rengi (hex)
- secondary: İkincil marka rengi (hex)
- border: Rozet halkasında kullanılacak canlı/belirgin renk (hex)
- borderClass: Tailwind kenarlık sınıfı karşılığı
- bg: Rozet içi zemin rengi (text-ink ile yüksek kontrastlı koyu yüzey)
"""

import os
import sys
import re
import glob
import json
import colorsys
from collections import defaultdict
from PIL import Image

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS_DIR = os.path.join(BASE_DIR, "public", "logos")
MAPPINGS_FILE = os.path.join(BASE_DIR, "data", "volleybox-mappings.json")
K2_FILE = os.path.join(BASE_DIR, "data", "kadinlar_2_lig.json")
OUTPUT_FILE = os.path.join(BASE_DIR, "src", "data", "team-colors.json")

def tr_lower(text: str) -> str:
    if not text:
        return ""
    return text.replace("İ", "i").replace("I", "ı").lower().strip()

def slugify(text: str) -> str:
    t = tr_lower(text)
    t = (t.replace("ç", "c")
          .replace("ğ", "g")
          .replace("ı", "i")
          .replace("ö", "o")
          .replace("ş", "s")
          .replace("ü", "u"))
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t

def clean_team_name(name: str) -> str:
    safe = tr_lower(name)
    cleaned = re.sub(
        r"\b(spor kulübü|spor kulubu|gençlik ve spor|genclik ve spor|voleybol|sk|gsk|belediyesi|belediye|bld|koleji|akademi|ortaokulu)\b",
        "",
        safe,
        flags=re.IGNORECASE
    ).strip()
    return re.sub(r"\s+", " ", cleaned)

def pick_tailwind_border_class(h: float, s: float, v: float) -> str:
    if s < 0.18:
        if v > 0.70:
            return "border-slate-200"
        return "border-slate-400"
    
    # Hue: 0.0 - 1.0
    deg = h * 360.0
    if deg < 15 or deg >= 345:
        return "border-red-400"
    elif 15 <= deg < 45:
        return "border-orange-400"
    elif 45 <= deg < 68:
        return "border-yellow-400"
    elif 68 <= deg < 150:
        return "border-emerald-400"
    elif 150 <= deg < 195:
        return "border-teal-400"
    elif 195 <= deg < 250:
        return "border-blue-400"
    elif 250 <= deg < 290:
        return "border-purple-400"
    elif 290 <= deg < 345:
        return "border-pink-400"
    return "border-blue-400"

def analyze_logo(path: str) -> dict:
    try:
        im = Image.open(path).convert("RGBA")
        im.thumbnail((120, 120))
        
        # Şeffaf boşlukları kırp
        alpha = im.split()[-1]
        bbox = alpha.point(lambda p: 255 if p > 30 else 0).getbbox()
        if bbox:
            im = im.crop(bbox)
            
        pixels = [p for p in im.getdata() if p[3] > 40]
        if not pixels:
            return None
            
        color_bins = defaultdict(list)
        monochrome = []
        
        for r, g, b, a in pixels:
            h, s, v = colorsys.rgb_to_hsv(r / 255.0, g / 255.0, b / 255.0)
            if s < 0.18 or v < 0.12 or (v > 0.90 and s < 0.22):
                monochrome.append((r, g, b, v))
            else:
                bin_idx = int(h * 24) % 24
                color_bins[bin_idx].append((r, g, b, h, s, v))
                
        sorted_bins = sorted(color_bins.items(), key=lambda kv: len(kv[1]), reverse=True)
        
        # Tamamen monokrom (siyah/beyaz) logo (ör. Beşiktaş, Siyah Kuğular)
        if not sorted_bins:
            avg_v = sum(p[3] for p in monochrome) / max(1, len(monochrome))
            is_light = avg_v > 0.5
            return {
                "primary": "#e2e8f0" if is_light else "#0f172a",
                "secondary": "#0f172a" if is_light else "#e2e8f0",
                "border": "#e2e8f0",
                "borderClass": "border-slate-200",
                "bg": "bg-surface-raised",
                "text": "text-ink"
            }
            
        colors = []
        for b_idx, px_list in sorted_bins[:2]:
            best = sorted(px_list, key=lambda p: p[4] * p[5], reverse=True)[len(px_list) // 2]
            r, g, b, h, s, v = best
            hex_code = f"#{r:02x}{g:02x}{b:02x}"
            colors.append((hex_code, h, s, v, len(px_list)))
            
        primary = colors[0]
        secondary = colors[1] if len(colors) > 1 else primary
        
        # Rozet halkasında parlayacak renk
        if primary[3] < 0.35 and secondary[3] > 0.45:
            border_hex = secondary[0]
            border_h, border_s, border_v = secondary[1], secondary[2], secondary[3]
        else:
            border_hex = primary[0]
            border_h, border_s, border_v = primary[1], primary[2], primary[3]
            
        border_class = pick_tailwind_border_class(border_h, border_s, border_v)
        
        # Rozet içi zemin rengi (text-ink açık metniyle ≥10:1 kontrast oranı)
        h = primary[1]
        if 0.40 <= h <= 0.55:
            bg = "bg-teal-950"
        elif 0.70 <= h <= 0.85:
            bg = "bg-purple-950"
        elif 0.55 < h < 0.70:
            bg = "bg-blue-950"
        else:
            bg = "bg-surface-raised"
            
        return {
            "primary": primary[0],
            "secondary": secondary[0],
            "border": border_hex,
            "borderClass": border_class,
            "bg": bg,
            "text": "text-ink"
        }
    except Exception as e:
        return None

def main():
    print("🎨 Takım logolarından renk paletleri çıkarılıyor...")
    
    if not os.path.exists(LOGOS_DIR):
        print(f"❌ Logolar dizini bulunamadı: {LOGOS_DIR}")
        return
        
    logo_files = glob.glob(os.path.join(LOGOS_DIR, "*.png"))
    print(f"📁 Taranacak logo sayısı: {len(logo_files)}")
    
    # 1. Her logonun renk analizini yap ve önbelleğe al
    logo_cache = {}
    for path in logo_files:
        filename = os.path.basename(path)
        palette = analyze_logo(path)
        if palette:
            logo_cache[filename] = palette
            
    print(f"✅ Analiz edilen logo sayısı: {len(logo_cache)}")
    
    # 2. Volleybox eşlemelerinden kulüp adlarını bağla
    team_palette_map = {}
    
    # İkonik takımlar için kurumsal kimlik öncelikleri
    HERITAGE_TEAMS = {
        "fenerbahce": {
            "primary": "#002d72", "secondary": "#fbee00", "border": "#fbee00",
            "borderClass": "border-yellow-400", "bg": "bg-blue-950", "text": "text-ink"
        },
        "vakifbank": {
            "primary": "#f9b800", "secondary": "#000000", "border": "#f9b800",
            "borderClass": "border-yellow-400", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "eczacibasi": {
            "primary": "#ec8c04", "secondary": "#00205b", "border": "#ec8c04",
            "borderClass": "border-orange-400", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "galatasaray": {
            "primary": "#a90432", "secondary": "#fdb913", "border": "#a90432",
            "borderClass": "border-red-400", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "besiktas": {
            "primary": "#000000", "secondary": "#ffffff", "border": "#e2e8f0",
            "borderClass": "border-slate-200", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "turk hava yollari": {
            "primary": "#c61132", "secondary": "#231f20", "border": "#c61132",
            "borderClass": "border-red-400", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "thy": {
            "primary": "#c61132", "secondary": "#231f20", "border": "#c61132",
            "borderClass": "border-red-400", "bg": "bg-surface-raised", "text": "text-ink"
        },
        "zeren spor": {
            "primary": "#3b1152", "secondary": "#8025b2", "border": "#a855f7",
            "borderClass": "border-purple-400", "bg": "bg-purple-950", "text": "text-ink"
        },
    }
    
    # 3. data/volleybox-mappings.json eşlemelerini oku
    if os.path.exists(MAPPINGS_FILE):
        with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
            mappings_data = json.load(f).get("mappings", [])
            for m in mappings_data:
                local_logo = m.get("local_logo")
                if not local_logo:
                    continue
                filename = os.path.basename(local_logo)
                palette = logo_cache.get(filename)
                if not palette:
                    continue
                    
                names_to_register = []
                internal = m.get("internal_name")
                if internal:
                    names_to_register.append(internal)
                matched = m.get("matched_as")
                if matched:
                    names_to_register.append(matched)
                for a in m.get("aliases", []):
                    names_to_register.append(a)
                    
                for name in names_to_register:
                    k1 = tr_lower(name)
                    k2 = slugify(name)
                    k3 = clean_team_name(name)
                    k4 = slugify(k3)
                    
                    for k in (k1, k2, k3, k4):
                        if k and k not in team_palette_map:
                            team_palette_map[k] = palette
                            
    # 4. Kadınlar 2. Ligi takımlarını da ekle
    if os.path.exists(K2_FILE):
        with open(K2_FILE, "r", encoding="utf-8") as f:
            k2_data = json.load(f).get("tum_takimlar", [])
            for t in k2_data:
                t_logo = t.get("logo")
                t_name = t.get("takim_adi")
                vb_name = t.get("volleybox_name")
                
                palette = None
                if t_logo:
                    filename = os.path.basename(t_logo)
                    palette = logo_cache.get(filename)
                    
                if not palette and vb_name:
                    palette = team_palette_map.get(slugify(vb_name))
                    
                if palette:
                    for name in (t_name, vb_name):
                        if not name:
                            continue
                        k1 = tr_lower(name)
                        k2 = slugify(name)
                        k3 = clean_team_name(name)
                        k4 = slugify(k3)
                        for k in (k1, k2, k3, k4):
                            if k and k not in team_palette_map:
                                team_palette_map[k] = palette

    # 5. Logo dosya slug'larını doğrudan kaydet (ör. "zeren-spor-kulubu-u18-t41279")
    for filename, palette in logo_cache.items():
        base_slug = os.path.splitext(filename)[0]
        team_palette_map[base_slug] = palette
        # Yaş kategorisini çıkararak kulüp ana slug'ını da ekle
        clean_slug = re.sub(r"-u\d+.*$", "", base_slug)
        if clean_slug and clean_slug not in team_palette_map:
            team_palette_map[clean_slug] = palette

    # 6. Kurumsal miras takımları en üst öncelikle ez
    for key, pal in HERITAGE_TEAMS.items():
        for k in (key, slugify(key), tr_lower(key)):
            team_palette_map[k] = pal

    # 7. Paletleri tekilleştir ve kompakt şema oluştur
    # p: [ [border_hex, border_class, bg_class], ... ]
    # t: { "slug": palette_idx }
    palettes = []
    palette_idx_map = {}
    teams_index = {}

    for team_key, pal in team_palette_map.items():
        pal_tuple = (pal["border"], pal["borderClass"], pal["bg"])
        if pal_tuple not in palette_idx_map:
            palette_idx_map[pal_tuple] = len(palettes)
            palettes.append([pal["border"], pal["borderClass"], pal["bg"]])
        teams_index[team_key] = palette_idx_map[pal_tuple]

    compact_data = {
        "p": palettes,
        "t": teams_index
    }

    # 8. Çıktı dosyasını kompakt olarak yaz
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(compact_data, f, separators=(",", ":"), ensure_ascii=False)
        
    file_size_kb = os.path.getsize(OUTPUT_FILE) / 1024
    print(f"🎉 Başarıyla {len(teams_index)} takım/anahtar, {len(palettes)} benzersiz palet üretildi!")
    print(f"📦 Kompakt dosya boyutu: {file_size_kb:.1f} KB")
    print(f"📄 Kaydedildi: {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
