import json
from pathlib import Path

mappings_file = Path("data/volleybox-mappings.json")
with open(mappings_file, "r", encoding="utf-8") as f:
    data = json.load(f)

mappings = data.get("mappings", [])
leagues = data.get("leagues", [])

# New league to add
new_league = {
    "internal_name": "Genç Kızlar 1. Ligi",
    "city": "Aydın",
    "city_slug": "aydin",
    "matched_as": "Aydın Süper Ligi U18 2026/27",
    "volleybox_url": "https://women.volleybox.net/women-aydn-ligi-u18-2026-27-o50895",
    "age_category": "U18",
    "confidence": "verified",
    "season": "2026/27",
    "verified_at": "2026-09-17"
}

if not any(l.get("volleybox_url") == new_league["volleybox_url"] for l in leagues):
    leagues.append(new_league)
    data["leagues"] = leagues

new_mappings = [
    # --- ANTALYA ---
    {
        "internal_name": "Alanya Belediye S.K.",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Antalya",
        "city_slug": "antalya",
        "matched_as": "Alanya Belediyespor U16",
        "volleybox_url": "https://women.volleybox.net/alanya-belediyespor-u16-t54216",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Alanya Belediye", "Alanya Belediyespor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Manavgat Belediye S.K.",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Antalya",
        "city_slug": "antalya",
        "matched_as": "Manavgat Belediyespor U16",
        "volleybox_url": "https://women.volleybox.net/manavgat-belediyespor-u16-t41872",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Manavgat Belediye", "Manavgat Belediyespor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Net Voleybol Akademi S.K.",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Antalya",
        "city_slug": "antalya",
        "matched_as": "Net Voleybol Akademi Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/net-voleybol-akademi-spor-kulubu-u16-t54218",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Net Voleybol Akademi", "Net Voleybol"],
        "verified_at": "2026-09-17"
    },

    # --- AYDIN ---
    {
        "internal_name": "Aydın Bbsk",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "Aydın",
        "city_slug": "aydin",
        "matched_as": "Aydın Büyükşehir Belediyespor U18",
        "volleybox_url": "https://women.volleybox.net/aydn-buyuksehir-belediyespor-u18-t21589",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Aydın BBSK", "Aydın BŞB", "Aydın Büyükşehir Belediyespor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Aydın Gençlik Ve Spor İl Müdürlüğü Spor Kulübü",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "Aydın",
        "city_slug": "aydin",
        "matched_as": "Aydın Gençlik Ve Spor İl Müdürlüğü Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/aydn-genclik-ve-spor-l-mudurlugu-spor-kulubu-u18-t42281",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Aydın Gençlik Hizmetleri", "Aydın Gençlik Spor", "Aydın Gençlik Ve Spor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Dsi Spor",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "Aydın",
        "city_slug": "aydin",
        "matched_as": "Aydın DSİ Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/aydn-ds-spor-kulubu-u18-t54207",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Aydın DSİ", "DSİ Spor", "Aydın Dsi Spor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Efeler Altın Smaç Spor Kulübü",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "Aydın",
        "city_slug": "aydin",
        "matched_as": "Efeler Altın Smaç Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/efeler-altn-smac-spor-kulubu-u18-t42283",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Efeler Altın Smaç", "Altın Smaç"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Söke Voleybol Spor Kulübü",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "Aydın",
        "city_slug": "aydin",
        "matched_as": "Söke Voleybol Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/soke-voleybol-spor-kulubu-u18-t42287",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Söke Voleybol", "Söke Belediye Saldos Voleybol"],
        "verified_at": "2026-09-17"
    },

    # --- ESKİŞEHİR ---
    {
        "internal_name": "Anadolu Kolej Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Anadolu Kolej Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/anadolu-kolej-spor-kulubu-u18-t41892",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Anadolu Kolej", "Anadolu Koleji"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Anadolu Üniversitesi Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Anadolu Üniversitesi GSK U18",
        "volleybox_url": "https://women.volleybox.net/anadolu-universitesi-genclik-ve-spor-kulubu-u18-t43546",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Anadolu Üniversitesi", "Anadolu Üniv"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "D.S.İ. Bentspor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir DSİ Bentspor U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-ds-bentspor-u18-t41574",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["DSİ Bentspor", "D.S.İ. Bentspor", "Eskişehir DSİ Bentspor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Es Güneş Spor Kulübü",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Es Güneş Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/es-gunes-spor-kulubu-u16-t44591",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Es Güneş", "Es Güneş SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Es Voleybol Akademi Spor Kulübü (A)",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Es Voleybol Akademi Spor Kulübü - A U18",
        "volleybox_url": "https://women.volleybox.net/es-voleybol-akademi-spor-kulubu-a-u18-t41887",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Es Voleybol Akademi A", "Es Voleybol Akademi (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Es Voleybol Akademi Spor Kulübü (B)",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Es Voleybol Akademi Spor Kulübü - B U18",
        "volleybox_url": "https://women.volleybox.net/es-voleybol-akademi-spor-kulubu-b-u18-t41888",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Es Voleybol Akademi B", "Es Voleybol Akademi (B)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Ata Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Ata Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-ata-spor-kulubu-u18-t54512",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Eskişehir Ata SK", "Ata Spor Kulübü", "Eskişehir Ata"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Ata Spor Kulübü (A)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Ata Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-ata-spor-kulubu-u16-t54514",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Ata SK A", "Eskişehir Ata A", "Eskişehir Ata Spor Kulübü A"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Ata Spor Kulübü (B)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Ata Spor Kulübü - B U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-ata-spor-kulubu-u16-t54515",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Ata SK B", "Eskişehir Ata B", "Eskişehir Ata Spor Kulübü B"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Peyman Spor Kulübü",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Peyman SK U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-peyman-sk-u16-t43245",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Peyman", "Peyman SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Peyman Spor Kulübü A.Ş.",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Peyman SK U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-peyman-sk-u18-t41889",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Eskişehir Peyman A.Ş.", "Eskişehir Peyman Spor Kulübü", "Peyman SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Türktelekom Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Türk Telekom Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-turk-telekom-spor-kulubu-u18-t41893",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Eskişehir Türk Telekom", "Eskişehir Türktelekom"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Türktelekom Spor Kulübü (A)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Türk Telekom Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-turk-telekom-spor-kulubu-u16-t43239",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Türk Telekom A", "Eskişehir Türktelekom A", "Eskişehir Türk Telekom (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Türktelekom Spor Kulübü (B)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Türk Telekom Spor Kulübü - B U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-turk-telekom-spor-kulubu-u16-t54517",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Türk Telekom B", "Eskişehir Türktelekom B", "Eskişehir Türk Telekom (B)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Voleybol Spor Kulübü",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Voleybol Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/eskisehir-voleybol-spor-kulubu-u16-t43246",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Eskişehir Voleybol"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Yıldız Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Yıldız Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-yldz-spor-kulubu-u18-t54513",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Eskişehir Yıldız"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Eskişehir Çağdaş Kolejliler Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Eskişehir Çağdaş Kolejliler Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/eskisehir-cagdas-kolejliler-spor-kulubu-u18-t41891",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Eskişehir Çağdaş Kolejliler", "Çağdaş Kolejliler"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Esnova Spor Kulübü (A)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Esnova Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/esnova-spor-kulubu-u16-t54516",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Esnova Spor Kulübü A", "Esnova A", "Esnova (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Esnova Spor Kulübü (B)",
        "internal_category": "Yıldız Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Esnova Spor Kulübü - B U16",
        "volleybox_url": "https://women.volleybox.net/esnova-spor-kulubu-u16-t54518",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Esnova Spor Kulübü B", "Esnova B", "Esnova (B)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Meryem Boz Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Meryem Boz Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/meryem-boz-spor-kulubu-t23628",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Meryem Boz SK", "Meryem Boz Akademi"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Şehir Koleji Eğitim Kültür Ve Spor Kulübü",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Eskişehir",
        "city_slug": "eskisehir",
        "matched_as": "Şehir Koleji Eğitim Kültür SK U18",
        "volleybox_url": "https://women.volleybox.net/sehir-koleji-egitim-kultur-sk-t41296",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Şehir Koleji", "Şehir Koleji SK"],
        "verified_at": "2026-09-17"
    },

    # --- İSTANBUL 1. LİG ---
    {
        "internal_name": "Atakent Elit",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Atakent Elit Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/atakent-elit-spor-kulubu-u18-t41201",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Atakent Elit SK", "Atakent Elit Spor Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Avcılar Demirordu",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Avcılar Demirorduspor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/avclar-demirorduspor-kulubu-u18-t54176",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Avcılar Demirordu SK", "Avcılar Demirorduspor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Avrupa Voleybol Gelişim A",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Avrupa Voleybol Gelişim Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/avrupa-voleybol-gelisim-spor-kulubu-u18-t41202",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Avrupa Voleybol Gelişim", "Avrupa Voleybol Gelişim (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Avrupa Voleybol Gelişim B",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Avrupa Voleybol Gelişim Spor Kulübü - B U18",
        "volleybox_url": "https://women.volleybox.net/avrupa-voleybol-gelisim-spor-kulubu-u18-t54175",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Avrupa Voleybol Gelişim (B)", "Avrupa Voleybol Gelişim B SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Bahçelievler Voleybol",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Bahçelievler Voleybol Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/bahcelievler-voleybol-kulubu-u18-t41208",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Bahçelievler Voleybol SK", "Bahçelievler Voleybol Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Bahçeşehir Avrupa Gelişim",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Bahçeşehir Avrupa Gelişim Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/bahcesehir-avrupa-gelisim-spor-kulubu-u18-t54180",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Bahçeşehir Avrupa Gelişim SK", "Bahçeşehir Avrupa"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Başakşehir Voleybol",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Başakşehir Voleybol Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/basaksehir-voleybol-kulubu-u18-t41209",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Başakşehir Voleybol SK", "Başakşehir Voleybol Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Ernilvolley",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Ernilvolley Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/ernilvolley-spor-kulubu-u18-t54182",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Ernil Volley", "Ernilvolley SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Kovan",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Kovan Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/kovan-spor-kulubu-u18-t41219",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Kovan SK", "Kovan Spor", "Kovan Spor Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Küçükçekmece Voleybol A",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Küçükçekmece Voleybol Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/kucukcekmece-voleybol-kulubu-u18-t41212",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Küçükçekmece Voleybol", "Küçükçekmece Voleybol (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Küçükçekmece Voleybol B",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Küçükçekmece Voleybol Kulübü - B U18",
        "volleybox_url": "https://women.volleybox.net/kucukcekmece-voleybol-kulubu-u18-t54177",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Küçükçekmece Voleybol (B)", "Küçükçekmece Voleybol B SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Real Elite",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Real Elite Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/real-elite-spor-kulubu-u18-t54183",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Real Elite SK", "Real Elite Spor"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Set Voleybol A",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "SET Voleybol Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/set-voleybol-kulubu-a-u18-t41210",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Set Voleybol", "SET Voleybol", "Set Voleybol (A)"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Set Voleybol B",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "SET Voleybol Kulübü - B U18",
        "volleybox_url": "https://women.volleybox.net/set-voleybol-kulubu-b-u18-t41211",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Set Voleybol (B)", "SET Voleybol B"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Sultangazi Olimpik",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Sultangazi Olimpik Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/sultangazi-olimpik-spor-kulubu-u18-t54178",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Sultangazi Olimpik SK", "Sultangazi Olimpik Spor Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Ulus Spor Akademi",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Ulus Spor Akademisi U18",
        "volleybox_url": "https://women.volleybox.net/ulus-spor-akademisi-u18-t41229",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Ulus Spor Akademisi", "Ulus Akademi"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "Yıldızlar Arena",
        "internal_category": "Genç Kızlar 1. Ligi",
        "city": "İstanbul",
        "city_slug": "istanbul",
        "matched_as": "Yıldızlar Arena Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/yldzlar-arena-spor-kulubu-u18-t54181",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Yıldızlar Arena SK", "Yıldızlar Arena Spor"],
        "verified_at": "2026-09-17"
    },

    # --- MERSİN ---
    {
        "internal_name": "ALSANCAK SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Alsancak Spor Kulübü U16",
        "volleybox_url": "https://women.volleybox.net/alsancak-spor-kulubu-u16-t43795",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Alsancak SK", "Alsancak Spor Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "MERSİN İHTİSAS SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Mersin İhtisas Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/mersin-htisas-spor-kulubu-u18-t41944",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Mersin İhtisas", "Mersin İhtisas SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "MEV TOROS SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "MEV Toros Spor Kulübü",
        "volleybox_url": "https://women.volleybox.net/mev-toros-spor-kulubu-t40225",
        "age_category": "Senior",
        "confidence": "verified",
        "aliases": ["MEV Toros", "MEV Toros SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "MEZİTLİ BELEDİYE SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Mezitli Belediyesi GSK U16",
        "volleybox_url": "https://women.volleybox.net/mezitli-belediyesi-genclik-ve-spor-kulubu-u16-t43857",
        "age_category": "U16",
        "confidence": "verified",
        "aliases": ["Mezitli Belediye", "Mezitli Belediye SK", "Mezitli Belediyesi Gençlik ve Spor Kulübü"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "TAC SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Tarsus Amerikan Koleji U18",
        "volleybox_url": "https://women.volleybox.net/tarsus-amerikan-koleji-u18-t41947",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["TAC", "TAC SK", "Tarsus Amerikan Koleji"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "TARSUS GELECEK SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Tarsus Gelecek / Tarsus Belediyespor",
        "volleybox_url": "https://women.volleybox.net/tarsus-belediyespor-t8694",
        "age_category": "Senior",
        "confidence": "verified",
        "aliases": ["Tarsus Gelecek", "Tarsus Gelecek SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "TOROSLAR BELEDİYE SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Toroslar Belediye Spor Kulübü",
        "volleybox_url": "https://women.volleybox.net/toroslar-belediye-spor-kulubu-t40633",
        "age_category": "Senior",
        "confidence": "verified",
        "aliases": ["Toroslar Belediye", "Toroslar Belediye SK"],
        "verified_at": "2026-09-17"
    },
    {
        "internal_name": "YENİŞEHİR GENÇLERBİRLİĞİ SK",
        "internal_category": "Genç Kızlar Süper Lig",
        "city": "Mersin",
        "city_slug": "mersin",
        "matched_as": "Yenişehir Gençlerbirliği Spor Kulübü U18",
        "volleybox_url": "https://women.volleybox.net/yenisehir-genclerbirligi-spor-kulubu-u18-t41949",
        "age_category": "U18",
        "confidence": "verified",
        "aliases": ["Yenişehir Gençlerbirliği", "Yenişehir Gençlerbirliği SK"],
        "verified_at": "2026-09-17"
    }
]

existing_keys = set()
for m in mappings:
    n = (m.get("internal_name") or "").strip().lower()
    c = (m.get("city_slug") or m.get("city") or "").strip().lower()
    cat = (m.get("internal_category") or "").strip().lower()
    existing_keys.add((n, c, cat))
    existing_keys.add((n, c))

added_count = 0
for nm in new_mappings:
    n = nm["internal_name"].strip().lower()
    c = nm["city_slug"].strip().lower()
    cat = nm["internal_category"].strip().lower()
    if (n, c, cat) not in existing_keys and (n, c) not in existing_keys:
        mappings.append(nm)
        existing_keys.add((n, c, cat))
        existing_keys.add((n, c))
        added_count += 1

data["mappings"] = mappings
with open(mappings_file, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Added {added_count} new team mappings!")
