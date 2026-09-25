import json
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
K2_FILE = os.path.join(DATA_DIR, "kadinlar_2_lig.json")
VBM_FILE = os.path.join(DATA_DIR, "volleybox-mappings.json")

def normalize_slug(text):
    if not text:
        return ""
    text = text.lower().strip()
    tr_map = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    text = text.translate(tr_map)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

KNOWN_2_LIG_ALIASES = {
    "TOYZZ SHOP DİNAMO SPOR": ["Dinamo Kartal Spor Kulübü", "Dinamo Spor Kulübü"],
    "ÇANAKKALE ONSEKİZ MART ÜNİVERSİTESİ": ["ÇOMÜ Spor Kulübü", "ÇOMÜ"],
    "ESKİŞEHİR ŞEHİR KOLEJİ EĞT. KÜLTÜR": ["Şehir Koleji Eğitim Kültür SK"],
    "BARTIN VOLLEY ACADEMY": ["Bartın Voleybol Kulübü"],
    "ADANA T.D.S.": ["Adana Tenis Dağ ve Su Sporları Kulübü", "ATDSK"],
    "ADANA SPORCU EĞİTİM SPOR": ["Adana Sporcu Eğitim Merkezi Spor Kulübü"],
    "AHTO": ["AHTO Spor Kulübü"],
    "TMS SPOR": ["TMS Voleybol Spor Kulübü"],
    "KVK SPOR": ["KVK Voleybol Kulübü"],
    "YALOVA ÇİFTLİKKÖY BLD. SPOR": ["Çiftlikköy Belediyespor"],
    "GALATASARAY": ["Galatasaray ll", "Galatasaray II"],
}

def merge_kadinlar_2_lig_mappings(silent: bool = False):
    if not os.path.exists(K2_FILE) or not os.path.exists(VBM_FILE):
        if not silent:
            print("Dosyalar bulunamadı.")
        return

    with open(K2_FILE, "r", encoding="utf-8") as f:
        k2 = json.load(f)

    with open(VBM_FILE, "r", encoding="utf-8") as f:
        vbm = json.load(f)

    mappings = vbm.get("mappings", [])
    leagues = vbm.get("leagues", [])

    # 1. Lig Eşleştirmesi Ekle
    league_url = "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047"
    if not any(l.get("volleybox_url") == league_url for l in leagues):
        leagues.append({
            "internal_name": "Kadınlar 2. Ligi",
            "city": "Türkiye",
            "city_slug": "turkiye",
            "matched_as": "Türkiye Kadınlar Voleybol 2. Ligi 2026/27",
            "volleybox_url": league_url,
            "age_category": "A Takım",
            "confidence": "verified",
            "season": "2026/27",
            "verified_at": "2026-09-25"
        })
        vbm["leagues"] = leagues
        if not silent:
            print("✅ Kadınlar 2. Ligi lig eşleştirmesi eklendi.")

    # 2. Şehir Tespiti (Maçlardan)
    team_cities = {}
    for m in k2.get("tum_maclar", []):
        city = m.get("sehir", "").strip().title()
        t_a = m.get("takim_a", "").strip()
        t_b = m.get("takim_b", "").strip()
        if t_a and t_a not in team_cities and city:
            team_cities[t_a] = city
        if t_b and t_b not in team_cities and city:
            team_cities[t_b] = city

    existing_keys = {
        (m.get("internal_name", "").lower(), m.get("internal_category", "").lower())
        for m in mappings
    }

    added_count = 0
    updated_count = 0

    for t in k2.get("tum_takimlar", []):
        name = t.get("takim_adi", "").strip()
        vb_url = t.get("volleybox_url")
        vb_name = t.get("volleybox_name")
        grup_no = t.get("grup_no")
        logo = t.get("logo")

        if not vb_url:
            continue

        city = team_cities.get(name, "Türkiye")
        city_slug = normalize_slug(city)

        aliases = []
        if "BLD." in name:
            aliases.append(name.replace("BLD.", "BELEDİYESİ").strip())
            aliases.append(name.replace("BLD.", "BELEDİYE").strip())
        if "SPOR" in name and "KULÜBÜ" not in name:
            aliases.append(name.replace("SPOR", "SPOR KULÜBÜ").strip())
        if vb_name and vb_name != name:
            aliases.append(vb_name)

        for kn, extra_al in KNOWN_2_LIG_ALIASES.items():
            if kn.lower() == name.lower():
                aliases.extend(extra_al)

        clean_logo = logo if logo and "takimlogoyok" not in logo else None

        pair = (name.lower(), "kadınlar 2. ligi".lower())
        if pair in existing_keys:
            # Var olan kaydı güncelle
            for m in mappings:
                if (m.get("internal_name", "").lower(), m.get("internal_category", "").lower()) == pair:
                    m["volleybox_url"] = vb_url
                    m["matched_as"] = vb_name or name
                    if clean_logo and not m.get("logo_url"):
                        m["logo_url"] = clean_logo
                    curr_aliases = set(m.get("aliases") or [])
                    curr_aliases.update(aliases)
                    m["aliases"] = list(curr_aliases)
                    updated_count += 1
                    break
        else:
            new_entry = {
                "internal_name": name,
                "internal_category": "Kadınlar 2. Ligi",
                "city": city,
                "city_slug": city_slug,
                "matched_as": vb_name or name,
                "volleybox_url": vb_url,
                "age_category": "A Takım",
                "confidence": "verified",
                "note": f"Grup {grup_no}",
                "verified_at": "2026-09-25",
                "aliases": list(set(aliases)),
                "logo_url": clean_logo
            }
            mappings.append(new_entry)
            existing_keys.add(pair)
            added_count += 1

    vbm["mappings"] = mappings
    with open(VBM_FILE, "w", encoding="utf-8") as f:
        json.dump(vbm, f, ensure_ascii=False, indent=2)

    if not silent:
        print(f"🎉 İşlem Tamamlandı: {added_count} yeni takım eklendi, {updated_count} takım güncellendi.")

def main():
    merge_kadinlar_2_lig_mappings(silent=False)

if __name__ == "__main__":
    main()

