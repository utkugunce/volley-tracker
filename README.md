# 🏐 TVFSCORE - TVF İstanbul Voleybol Takip Dashboard'u

Türkiye Voleybol Federasyonu (TVF) İstanbul yerel liglerindeki **Genç Kızlar Süper Lig** ve **Yıldız Kızlar Süper Lig** maçlarını ve resmi puan cetvellerini takip edebileceğiniz, doğrudan resmi web sitesinden veri çeken modern, hafif ve hızlı bir web uygulaması.

---

## ⚡ Özellikler

- **Resmi Canlı Veri Kaynakları:**
  - Fikstür: [istanbul.voleyboliltemsilciligi.com/Fiksturler](https://istanbul.voleyboliltemsilciligi.com/Fiksturler)
  - Puan Durumu: [istanbul.voleyboliltemsilciligi.com/PuanDurumu](https://istanbul.voleyboliltemsilciligi.com/PuanDurumu)
- **Fikstür Tablosu:**
  - Sütunlar: `Tarih - Saat - Yer - A Takımı - B Takımı - Skor - Set Skorları`
  - Sadece resmi tarihi ve saati duyurulmuş maçların gösterimi.
  - Voleybol 5-set dökümü (`25:10`, `25:14` vb.)
- **Resmi TVF Puan Durumu:**
  - Sıra (#), Takım, O (Oynanan), G (Galibiyet), M (Mağlubiyet), Setler (AS-VS), Set Oranı, Sayılar (AP-VP), Puan (P).
  - Flashscore form rozetleri (Yeşil G / Kırmızı M).
  - İlk 4 takım için Play-Off (Final Etabı) göstergesi.
- **Flashscore Deneyimi:**
  - Yatay kaydırılabilir gün şeridi (`11 Eyl`, `12 Eyl`, `14 Eyl`, `15 Eyl`, `16 Eyl`, `17 Eyl`, `TÜMÜ`).
  - Hızlı durum filtreleri: `[HEPSİ]` `[OYNANACAK]` `[BİTENLER]`.
  - Kulüp ve salon bazlı canlı arama.
  - Favori maç/kulüp takibi (⭐).
- **Veri Senkronizasyonu & Önbellek Mimarisi:**
  - **Otomatik Zamanlanmış Görev (Cron):** GitHub Actions (`.github/workflows/scrape-sync.yml`) üzerinden her saat başı (`0 * * * *`) TVF 81 il temsilciliği taranarak bültenler otomatik güncellenir ve depoya commit edilir.
  - **Arayüzden Senkronizasyon Durumu:** Web arayüzündeki yenileme butonuna basıldığında sunucu önbelleğindeki en son veriler anında çekilir, son güncelleme zamanı ve senkronizasyon durumu (başarı / önbellek / uyarı) görsel bildirim olarak gösterilir.
  - **Yerel Geliştirme (Local Python):** Yerel ortamda çalışırken `GET /api/fixtures?refresh=1` doğrudan yerel Python tarayıcısını tetikleyebilir. Vercel sunucusuz (serverless) ortamında ise güvenli ve yüksek hızlı CDN/build önbelleği kullanılır.

---

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js 18+ ve npm
- Python 3.10+ (`httpx` ve `beautifulsoup4`)

### 2. Bağımlılıkları Yükleme
```bash
# Node.js bağımlılıkları
npm install

# Python bağımlılıkları
pip install httpx beautifulsoup4
```

### 3. Fikstür ve Puan Durumunu Çekme (Python)
```bash
python scripts/run_scraper.py
```

### 4. Arayüzü Başlatma (Next.js)
```bash
npm run dev
```
Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresine giderek dashboard'u kullanabilirsiniz.

---

## 📁 Proje Mimarisi

```text
volley-tracker/
├── data/
│   ├── raw/                 # İndirilen ham HTML yanıtları
│   └── fixtures.json        # Canlı çekilmiş ve normalize edilmiş maç ve puan verisi
├── scripts/
│   ├── parsers/
│   │   ├── istanbul.py      # TVF İstanbul resmi ASP.NET AJAX scraper & parser
│   │   └── ankara.py        # TVF Ankara modülü
│   └── run_scraper.py       # Terminalden çalıştırılan ana scraper tetikleyici
└── src/
    ├── app/
    │   ├── api/fixtures/    # JSON fikstür ve puan durumunu sunan API rotası (?refresh=1 destekli)
    │   ├── globals.css      # Tailwind CSS ve özel stiller
    │   ├── layout.tsx       # Kök şablon
    │   └── page.tsx         # SSR ana sayfa
    ├── components/
    │   ├── Header.tsx       # 2 ana sekme (Fikstür / Puan Durumu), canlı yenileme ve favoriler
    │   ├── DateRibbon.tsx   # Flashscore yatay gün seçici
    │   ├── FilterBar.tsx    # Durum, lig, salon filtreleri ve canlı arama
    │   ├── FixtureTable.tsx # Tarih-Saat-Yer-A Takımı-B Takımı-Skor-Set Skorları tablosu
    │   └── StandingsTable.tsx # TVF resmi puan durumu ve form tablosu
    └── types/
        └── fixture.ts       # TypeScript veri modelleri
```

---

## 📄 Lisans
MIT
