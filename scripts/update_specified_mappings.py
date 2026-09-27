import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MAPPINGS_FILE = BASE_DIR / "data" / "volleybox-mappings.json"

with open(MAPPINGS_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

mappings = data.get("mappings", [])

# Remove any erroneous mapping of t48846 with "(B)" in internal_name
cleaned_mappings = []
for m in mappings:
    url = m.get("volleybox_url") or ""
    name = m.get("internal_name") or ""
    if "t48846" in url and "(B)" in name:
        print(f"Removing erroneous B-team mapping pointing to t48846: {name}")
        continue
    # Fix t44826: It is Çanakkalespor U16, NOT Çanakkale Belediyespor
    if "t44826" in url:
        m["internal_name"] = "Çanakkalespor"
        m["matched_as"] = "Çanakkalespor U16"
        m["aliases"] = ["Çanakkalespor", "Çanakkalespor U16"]
        print("Fixed t44826 to Çanakkalespor (removed Çanakkale Belediyespor)")
    cleaned_mappings.append(m)

mappings = cleaned_mappings

updates = {
    # 1. Biga Ada Spor Kulübü
    "t44823": {
        "aliases_to_add": ["Biga Ada Spor Kulübü", "Biga Ada Spor", "Biga Ada Spor U16", "Biga Adaspor"],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 2. Barbaros Spor Kulübü
    "t44830": {
        "aliases_to_add": ["Barbaros Spor Kulübü", "Barbaros Spor", "Barbarosspor", "Çanakkale Barbarosspor", "Çanakkale Barbarosspor U16"],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 3. Çanakkale Belediyespor U16 ("aslında b takımı")
    "t54646": {
        "aliases_to_add": [
            "Çanakkale Belediyespor U16",
            "Çanakkale Belediyespor - B",
            "Çanakkale Belediyespor - B U16",
            "Çanakkale Belediyespor (B)",
            "Çanakkale Belediyespor B",
            "Çanakkale Belediye Spor Kulübü (B)"
        ],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
        "note": "aslında b takımı",
    },
    # 4. Biga Gelişim Spor Kulübü
    "t44828": {
        "aliases_to_add": ["Biga Gelişim Spor Kulübü", "Biga Gelişim Spor", "Biga Gelişim", "Biga Gelişim Voleybol Kulübü", "Biga Gelişim Voleybol Kulübü U16"],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 5. Biga Çiçeklidede Spor Kulübü
    "t44825": {
        "aliases_to_add": ["Biga Çiçeklidede Spor Kulübü", "Biga Çiçeklidede Spor", "Biga Çiçeklidede", "Biga Çiçeklidedespor", "Biga Çiçeklidedespor U16", "Çiçeklidede"],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 6. Eskişehir Beyhan Rıfat Çıkılıoğlu A.L. Spor Kulübü
    "t43244": {
        "internal_name": "Eskişehir Beyhan Rıfat Çıkılıoğlu A.L. Spor Kulübü",
        "aliases_to_add": [
            "Eskişehir Beyhan Rıfat Çıkılıoğlu A.L. Spor Kulübü",
            "Beyhan Rıfat Çıkılıoğlu A.L. Spor Kulübü",
            "Beyhan Rıfat Çıkılıoğlu A.L.",
            "Beyhan Rıfat Çıkılıoğlu",
            "Beyhan Rıfat Çıkılıoğlu Anadolu Lisesi Spor Kulübü U16",
            "Beyhan Rıfat Çıkılıoğlu Anadolu Lisesi Spor Kulübü",
            "Anadolu Kolej Spor Kulübü U16"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 7. Eskişehir Ata Spor Kulübü (B)
    "t54515": {
        "aliases_to_add": [
            "Eskişehir Ata Spor Kulübü (B)",
            "Eskişehir Ata Spor Kulübü B",
            "Eskişehir Ata Spor (B)",
            "Eskişehir Ata Spor B",
            "Eskişehir Ata Spor Kulübü - B",
            "Eskişehir Ata Spor Kulübü - B U16",
            "Ata Spor Kulübü (B)"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 8. Eskişehir Türktelekom Spor Kulübü (A)
    "t43239": {
        "aliases_to_add": [
            "Eskişehir Türktelekom Spor Kulübü (A)",
            "Eskişehir Türk Telekom Spor Kulübü (A)",
            "Eskişehir Türktelekom (A)",
            "Eskişehir Türk Telekom A",
            "Eskişehir Türktelekom Spor Kulübü",
            "Eskişehir Türk Telekom Spor Kulübü",
            "Eskişehir Türk Telekom Spor Kulübü U16",
            "Türk Telekom (A)"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 9. Esnova Spor Kulübü (A)
    "t54516": {
        "aliases_to_add": [
            "Esnova Spor Kulübü (A)",
            "Esnova Spor Kulübü A",
            "Esnova (A)",
            "Esnova A",
            "Esnova Spor Kulübü",
            "Esnova Spor Kulübü U16"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 10. Eskişehir Ata Spor Kulübü (A)
    "t54514": {
        "aliases_to_add": [
            "Eskişehir Ata Spor Kulübü (A)",
            "Eskişehir Ata Spor Kulübü A",
            "Eskişehir Ata Spor (A)",
            "Eskişehir Ata Spor A",
            "Eskişehir Ata Spor Kulübü",
            "Eskişehir Ata Spor Kulübü U16",
            "Ata Spor Kulübü (A)"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 11. Eskişehir Türktelekom Spor Kulübü (B)
    "t54517": {
        "aliases_to_add": [
            "Eskişehir Türktelekom Spor Kulübü (B)",
            "Eskişehir Türk Telekom Spor Kulübü (B)",
            "Eskişehir Türktelekom (B)",
            "Eskişehir Türk Telekom B",
            "Eskişehir Türktelekom Spor Kulübü B",
            "Eskişehir Türk Telekom Spor Kulübü - B",
            "Eskişehir Türk Telekom Spor Kulübü - B U16",
            "Türk Telekom (B)"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 12. Meryem Boz Spor Kulübü (A)
    "t43242": {
        "aliases_to_add": [
            "Meryem Boz Spor Kulübü (A)",
            "Meryem Boz Spor Kulübü A",
            "Meryem Boz (A)",
            "Meryem Boz A",
            "Meryem Boz Spor Kulübü U16",
            "Meryem Boz Spor Kulübü"
        ],
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
    # 13. Çanakkale Belediye Spor Kulübü(A)
    "t48846": {
        "aliases_to_add": [
            "Çanakkale Belediye Spor Kulübü(A)",
            "Çanakkale Belediye Spor Kulübü (A)",
            "Çanakkale Belediyespor (A)",
            "Çanakkale Belediyespor A",
            "Çanakkale Belediyespor",
            "Çanakkale Belediye Spor Kulübü"
        ],
        "city": "Çanakkale",
        "city_slug": "canakkale",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "age_category": "U16",
    },
}

updated_keys = set()
for m in mappings:
    url = m.get("volleybox_url") or ""
    for target_key, patch in updates.items():
        if target_key in url:
            updated_keys.add(target_key)
            if "internal_name" in patch:
                m["internal_name"] = patch["internal_name"]
            if "city" in patch:
                m["city"] = patch["city"]
            if "city_slug" in patch:
                m["city_slug"] = patch["city_slug"]
            if "internal_category" in patch:
                m["internal_category"] = patch["internal_category"]
            if "age_category" in patch:
                m["age_category"] = patch["age_category"]
            if "note" in patch:
                m["note"] = patch["note"]
            m["confidence"] = "verified"

            existing_aliases = m.get("aliases") or []
            for a in patch.get("aliases_to_add", []):
                if a not in existing_aliases:
                    existing_aliases.append(a)
            m["aliases"] = existing_aliases
            print(f"Updated {target_key}: {m.get('internal_name')} ({len(existing_aliases)} aliases)")

print(f"\nTotal target keys updated: {len(updated_keys)} / {len(updates)}")
assert len(updated_keys) == len(updates), f"Missing keys: {set(updates.keys()) - updated_keys}"

data["mappings"] = mappings
with open(MAPPINGS_FILE, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Saved data/volleybox-mappings.json successfully!")
