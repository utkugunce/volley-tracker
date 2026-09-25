# Antigravity & AI Agent Kuralları

## 🚨 KURAL: 81 İli Çekme & Senkronizasyon (Scrape 81 Provinces)

> **UYGULAMA PRENSİBİ:**
> Projede kod yazma, UI/tasarım geliştirme, hata düzeltme (bugfix), veri/script güncellemesi veya doğrudan veri çekme talebi içeren promptların sonunda **EN SON ADIM OLARAK 81 İLİN VERİSİ ÇEKİLMELİDİR**.

### ⛔ Tetiklenmeyecek (İstisna) Durumlar:
Aşağıdaki gibi basit ve salt konuşma/danışma odaklı promptlarda **SCRAPER ÇALIŞTIRILMAZ**:
- **Basit onay ve geri bildirimler:** "tamam", "teşekkürler", "anladım", "harika" vb.
- **Fikir alışverişi ve danışma soruları:** "şu nasıl?", "bunu sence nasıl yapmalıyız?", "fikrin ne?" vb.
- **Açıklama ve bilgi talepleri:** "bu fonksiyon ne yapıyor?", "bu dosya nerede?" gibi projede kod/veri değişikliği yapılmayan salt sorular.
- **Kural ve konfigürasyon istişareleri.**

### ✅ Tetiklenecek Durumlar:
- Kod veya stil (TSX, CSS, Python vb.) üzerinde değişiklik/ekleme yapıldığında.
- Yeni bir özellik veya sayfa/bileşen geliştirildiğinde.
- Hata düzeltme veya refactoring yapıldığında.
- Kullanıcı doğrudan "verileri çek", "senkronize et", "81 ili güncelle" gibi bir talepte bulunduğunda.

### ❓ Tereddüt & Belirsizlik Durumu:
- Bir promptun veri çekmeyi gerektirip gerektirmediği konusunda herhangi bir şüphe veya belirsizlik yaşanırsa varsayımda bulunulmamalı, **doğrudan kullanıcıya sorulmalıdır** (*"81 il verilerini de güncelleyeyim mi?"*).

### Çalıştırılacak Komut:
```powershell
.venv\Scripts\python.exe scripts/scrape_all_provinces.py
```

### Detaylar:
- Bu komut 81 ilin TVF bültenlerini eşzamanlı (multi-threaded) olarak tarar.
- `data/cities/*.json`, `data/cities.json` ve `data/fixtures.json` dosyalarını günceller.
- Ardından Volleybox eşleşmelerini (`scripts/sync_volleybox_matches.py`) senkronize eder.
- Script tamamlandıktan sonra özet kullanıcıya bildirilir.
