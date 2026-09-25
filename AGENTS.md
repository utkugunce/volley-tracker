# Antigravity & AI Agent Kuralları

## 🚨 KURAL: 81 İli Çekme & Senkronizasyon (Scrape 81 Provinces)

> **UYGULAMA PRENSİBİ:**
> Projede kod yazma, UI/tasarım geliştirme, hata düzeltme (bugfix), veri/script güncellemesi veya doğrudan veri çekme talebi içeren promptların sonunda **EN SON ADIM OLARAK 81 İLİN VERİSİ ÇEKİLMELİDİR**.

---

## ⏱️ 30 Dakika Minimum Bekleme Sınırı (Cooldown Kuralı)

> **ÖNEMLİ:** 81 ilin taranması işlemlerinde iki çekme arasında **minimum 30 dakika** süre bulunmalıdır.

### 🔒 Kuralın İşleyişi:
1. **Otomatik Tetiklemelerde:**
   - Kod, UI veya veri değişikliği sonrası otomatik çalıştırmalarda normal komut (`python scripts/scrape_all_provinces.py`) çalıştırılır.
   - Script içinde dahili 30 dakika kontrolü bulunur. Son taramadan bu yana 30 dakika dolmamışsa tarama yapılmaz; kalan bekleme süresi terminalde gösterilir ve işlem güvenle atlanır.
   - Agent, otomatik geliştirme adımlarında **kesinlikle `--force` parametresini KULLANMAZ**.
   - Tarama atlandığında kullanıcıya *"Son tarama X dakika önce yapıldığı için (30 dk bekleme kuralı gereğince) 81 il taraması atlandı."* şeklinde özet geçilir.

2. **İstisna (Kuralın Bozulabileceği Tek Durum):**
   - Bu kural **YALNIZCA KULLANICI AÇIKÇA MANUEL OLARAK İSTERSE** bozulabilir.
   - Örnek kullanıcı istekleri: *"30 dakikayı bekleme hemen çek"*, *"zorla güncelle"*, *"verileri yine de çek"*, *"force scrape"*, *"81 ili şimdi çek"*.
   - Yalnızca bu durumda `--force` parametresi kullanılır:
     ```powershell
     python scripts/scrape_all_provinces.py --force
     ```

---

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
- Kullanıcı doğrudan "verileri çek", "senkronize et", "81 ili güncelle" gibi bir talepte bulunduğunda (kullanıcı açıkça manuel talep ettiğinde `--force` parametresi kullanılabilir).

### ❓ Tereddüt & Belirsizlik Durumu:
- Bir promptun veri çekmeyi gerektirip gerektirmediği konusunda herhangi bir şüphe veya belirsizlik yaşanırsa varsayımda bulunulmamalı, **doğrudan kullanıcıya sorulmalıdır** (*"81 il verilerini de güncelleyeyim mi?"*).

---

### Çalıştırılacak Komutlar:

- **Standart / Otomatik Komut (30 dk kontrolü devrededir):**
```powershell
python scripts/scrape_all_provinces.py
```
*(veya sanal ortam için: `.venv\Scripts\python.exe scripts/scrape_all_provinces.py`)*

- **Manuel İstek Üzerine Zorlayarak Çalıştırma (30 dk kuralını atlar):**
```powershell
python scripts/scrape_all_provinces.py --force
```

### Detaylar:
- Bu komut 81 ilin TVF bültenlerini eşzamanlı (multi-threaded) olarak tarar.
- `data/cities/*.json`, `data/cities.json` ve `data/fixtures.json` dosyalarını günceller.
- Ardından Volleybox eşleşmelerini (`scripts/sync_volleybox_matches.py`) senkronize eder.
- Script tamamlandıktan sonra özet kullanıcıya bildirilir.
