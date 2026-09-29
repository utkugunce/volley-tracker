# Revizyon Planı

Bu plan, mevcut veri çekme ve eşleştirme sistemi için güvenilirlik, doğrulama ve sürdürülebilirlik hedeflerine odaklanır.

1. Veri doğrulama katmanı ekle
2. Retry ve fallback mekanizması kur
3. Scraper akışını modüler hale getir
4. HTML değişikliğine karşı esnek parser oluştur
5. Smoke testleri ekle
6. Otomatik güncelleme ve manuel güncelleme akışını ayrıştır
7. Loglama ve operasyon görünürlüğünü artır
8. Normalization layer ekle
9. Kaynak adreslerini config ile yönet
10. Uygulama tarafında veri tüketimini doğrula

## Uygulama notları

- `scripts/data_quality.py` doğrulama ve retry mantığını barındırır.
- `scripts/validate_data_files.py` veri dosyalarını hızlı şekilde kontrol eder.
- `src/utils/dataQuality.ts` benzer kontrol mantığını frontend smoke testleri için sunar.
- Scraper çıktıları yazılmadan önce/sonra doğrulama çalıştırılır.

## Hedef

Sistem, tek bir kaynak hatası nedeniyle tüm veri akışını çökertmeden, üretim ortamında daha güvenli ve öngörülebilir şekilde çalışmalıdır.
