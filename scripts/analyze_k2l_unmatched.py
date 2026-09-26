import json
from collections import Counter

with open("data/kadinlar_2_lig.json", encoding="utf-8") as f:
    d = json.load(f)

all_matches = d.get("tum_maclar", [])
total = len(all_matches)

# "volleybox" key'i incele
sample = all_matches[0]
print("Bir maç örneği (volleybox alanı):")
print(json.dumps({k: v for k, v in sample.items() if "volley" in k.lower() or k in ["takim_a", "takim_b", "tarih", "skor", "durum"]}, ensure_ascii=False, indent=2))

# Eşleşme durumu: "volleybox" alanına bak
matched = [m for m in all_matches if m.get("volleybox") and m["volleybox"].get("match_id")]
unmatched = [m for m in all_matches if not (m.get("volleybox") and m["volleybox"].get("match_id"))]

print(f"\nToplam: {total} | Eşleşen: {len(matched)} | Eşleşmeyen: {len(unmatched)}")

# Eşleşmeyenlerin tarihe göre dağılımı
date_dist = Counter(m.get("tarih","?")[:7] for m in unmatched)
print("\nEşleşmeyen maçlar - ay dağılımı:")
for ym, cnt in sorted(date_dist.items()):
    print(f"  {ym}: {cnt} maç")

# Eşleşmeyenlerin durum dağılımı
durum_dist = Counter(m.get("durum","?") for m in unmatched)
print("\nEşleşmeyen maçlar - durum dağılımı:")
for durum, cnt in durum_dist.most_common():
    print(f"  {durum}: {cnt}")

# Takım adı eşleşmesi sorunu mu?
print("\nİlk 10 eşleşmeyen maç (takım adlarıyla):")
for m in unmatched[:10]:
    vb = m.get("volleybox", {})
    print(f"  {m.get('tarih','')} | {m.get('takim_a','')} vs {m.get('takim_b','')} | durum={m.get('durum','')} | vb_found={vb.get('found')}")
