# Kod Tabanı Denetimi: Sessiz Fallback ve Sabit Değer (Hardcoded Placeholder) Raporu

**Tarih:** 15 Eylül 2026  
**Kapsam:** `src/` dizini genelinde tüm TypeScript ve React bileşenleri  
**Amaç:** Canlı veya dinamik veriyi temsil eden alanlarda, veri eksik/sıfır olduğunda kullanıcıya gerçekmiş gibi sunulan sahte/sabit sayısal fallback'lerin tespit edilmesi ve temizlenmesi.

---

## 1. Tespit Edilen ve Düzeltilen Hatalar

| Dosya | Eski Kod | Yeni Kod | Düzeltme Gerekçesi |
| :--- | :--- | :--- | :--- |
| `src/components/TodayMatchesView.tsx` (L.92) | `activeCities: activeCities \|\| 4` | `activeCities: activeCities` | Aktif fikstüre sahip il sayısı 0 olduğunda sahte `4` sayısı gösteriliyordu. Gerçek veri 0 ise doğrudan 0 gösterilecek şekilde düzeltildi. |
| `src/components/TodayMatchesView.tsx` (L.223-241) | `const defaultList = [{ slug: "istanbul", count: 24 }, { slug: "izmir", count: 44 }, { slug: "yalova", count: 20 }, { slug: "nigde", count: 4 }]` | `citiesList` üzerinden dinamik liste türetimi (`citiesList.filter(c => c.matches_count > 0)`) | `citiesList` henüz yüklenmediğinde veya boşken kullanıcıya hardcoded 24, 44, 20, 4 maç sayıları gösteriliyordu. Artık `citiesList` yüklenene kadar skeleton yükleme durumu, yüklendikten sonra ise gerçek maç sayıları gösteriliyor. |
| `src/components/CitySelector.tsx` (L.35-41) | `cities.find(...) \|\| { name: "İstanbul", matches_count: 24, ... }` | `cities.find(...) \|\| { name: currentCitySlug, matches_count: 0, ... }` | Seçilen il listede henüz bulunamadığında veya yüklenirken arayüzde sahte İstanbul ve 24 maç sayısı gösteriliyordu. Gerçek durumu yansıtacak şekilde 0 ve dinamik ad atandı. |
| `src/components/CitySelector.tsx` (L.121) | `Tüm İller ({cities.length \|\| 81})` | `Tüm İller ({cities.length})` | İller listesi boş veya yükleniyor iken arayüzde parantez içinde yanıltıcı `81` yazıyordu. Gerçek liste uzunluğu (`cities.length`) ile değiştirildi. |

---

## 2. İncelenen ve Meşru Kabul Edilen Desenler

Aşağıdaki kullanımlar matematiksel sayaçlar, null/undefined kontrolleri veya sayfalama/varsayılan değerler olduğu için muhafaza edildi:
- `c.matches_count || 0`: Toplama fonksiyonlarında (`reduce`) `undefined` sayıları güvenli `0`'a çeviren matematiksel koruma.
- `counts[m.date] = (counts[m.date] || 0) + 1`: Sözlük tabanlı sayaç akümülatörü.
- `(m.home_score ?? 0) > (m.away_score ?? 0)`: Skoru girilmemiş maçlarda sayısal karşılaştırmanın `null/undefined` nedeniyle çökmesini engelleyen güvenli kontrol.
- `volleyboxStats.discrepancy ?? 0`: Fark metriğinde `null/undefined` güvenliği.

---

## 3. Mimari Kural ve Önleme

- **Kural:** Gerçek/canlı veriyi temsil eden hiçbir state veya prop, 0'dan büyük sabit bir sayısal fallback'e (`|| 4`, `|| 24` vb.) bağlanamaz.
- **Boş Durum Prensibi:** Veri henüz gelmediyse veya boşsa, arayüz açıkça skeleton (iskelet) ya da "Veri bulunmuyor / 0" göstermelidir. Asla sessizce varsayım yapılmamalıdır.
