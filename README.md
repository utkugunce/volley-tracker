# 🏐 Altyapı Voleybol - TVF Voleybol Takip Platformu

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
  - **Otomatik Zamanlanmış Görev (Cron):** GitHub Actions (`.github/workflows/scrape-sync.yml`) üzerinden saatte bir (`7 * * * *`) TVF 81 il temsilciliği taranarak bültenler otomatik güncellenir; yalnızca veri içeriği gerçekten değiştiyse depoya commit edilir.
  - **Arayüzden Senkronizasyon Durumu:** Web arayüzündeki yenileme butonuna basıldığında sunucu önbelleğindeki en son veriler anında çekilir, son güncelleme zamanı ve senkronizasyon durumu (başarı / önbellek / uyarı) görsel bildirim olarak gösterilir.
  - **Yerel Geliştirme (Local Python):** Yerel ortamda çalışırken `GET /api/fixtures?refresh=1` doğrudan yerel Python tarayıcısını tetikleyebilir. Vercel sunucusuz (serverless) ortamında ise güvenli ve yüksek hızlı CDN/build önbelleği kullanılır.
  - Operasyonel veri kontrolü için `GET /api/health` endpoint'i son veri zamanını, şehir dosyası sayısını, maç toplamını ve GitHub Actions, Blob ve push bildirim yapılandırma durumunu döndürür.
  - Supabase geçişi için `supabase/migrations/001_backend_schema.sql` şeması hazırdır. `SUPABASE_SERVICE_ROLE_KEY` yalnızca sunucu ortamında tutulmalı; değişkenler yokken uygulama JSON fallback'iyle çalışmaya devam eder.
  - Migration uygulandıktan sonra mevcut JSON verisini aktarmak için `npm run supabase:import` komutu kullanılabilir.
  - GitHub Actions otomatik Supabase aktarımı için repository secrets olarak `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` tanımlanmalıdır. Service role anahtarı yalnızca Actions secret ve sunucu ortamında tutulur.
  - Supabase Auth rol temeli için `supabase/migrations/002_auth_roles.sql` uygulanmalıdır. Kullanıcı rolleri `admin`, `editor` ve `viewer` olabilir; JWT doğrulaması `GET /api/auth/me` endpoint'i üzerinden yapılır.

---

## 🚀 Hızlı Başlangıç

### 1. Gereksinimler
- Node.js 22+ ve npm (CI'da Node 22 kullanılır)
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
# Sadece İstanbul ve Ankara:
python scripts/run_scraper.py

# 81 İl Verisini Eşzamanlı Çekme (Tüm Türkiye):
python scripts/scrape_all_provinces.py
```

> [!NOTE]
> **Geliştirme ve veri güncelleme ayrı işlemlerdir.** Kod kontrolleri canlı kaynaklara yazmadan çalışır. 81 il taraması saatlik workflow veya açık veri güncelleme talebiyle yapılır; iki tarama arasında minimum 60 dakika vardır. `--force` yalnızca açık kullanıcı talebiyle kullanılabilir.

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

## 🔐 Ortam Değişkenleri (Environment Variables)

Projede yönetim ve bülten yükleme güvenliği için ortam değişkenleri kullanılır:

| Değişken | Açıklama | Zorunlu mu? |
|---|---|---|
| `ADMIN_TOKEN` | `/api/fixtures/upload` ve `/api/admin/override` endpoint'lerini yetkilendirmek için kullanılan gizli anahtar. Tanımlanmadığında endpoint güvenlik amacıyla 503 Service Unavailable döner. | Evet (Admin özellikleri için) |
| `CRON_SECRET` | `/api/notifications/dispatch` endpoint'ini yalnızca zamanlanmış görevlerin çağırabilmesi için kullanılan gizli anahtar. Tanımlandığında dispatch isteği `Authorization: Bearer <CRON_SECRET>` ile yapılmalıdır. | Evet (Otomatik bildirimler için) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'si. | Supabase kullanımı için Evet |
| `SUPABASE_SERVICE_ROLE_KEY` | Sunucu tarafı Supabase anahtarı; tarayıcıya gönderilmemelidir. | Supabase kullanımı için Evet |
| `BLOB_READ_WRITE_TOKEN` | Vercel sunucusuz (serverless) salt-okunur dosya sistemi ortamında manuel admin skor düzeltmelerini (`manual-overrides.json`) kalıcı olarak saklamak için Vercel Blob token'ı. Yerel ortamda tanımlanmadığında `data/manual-overrides.json` dosyasına fallback yapılır. | Vercel ortamında Evet |

> [!IMPORTANT]
> `ADMIN_TOKEN` için asla tahmin edilebilir veya varsayılan değerler kullanmayın. Güçlü ve rastgele bir token üretmek için şu komutlardan birini çalıştırabilirsiniz:
> ```bash
> # Node.js ile:
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
>
> # veya Python ile:
> python -c "import secrets; print(secrets.token_hex(32))"
>
> # veya Linux/macOS OpenSSL ile:
> openssl rand -hex 32
> ```
> Değeri yerel geliştirmede `.env.local` dosyasına, bulut ortamında ise Vercel Dashboard (`Settings > Environment Variables`) üzerinden ekleyin.

---

## 📄 Lisans
MIT


## Geliştirme ve veri sözleşmesi

- Uygulama ve import betiği `NEXT_PUBLIC_SUPABASE_URL` okur. GitHub Actions secret adı `SUPABASE_URL` olarak kalır; workflow bunu `NEXT_PUBLIC_SUPABASE_URL` değişkenine bağlar. Tarayıcı oturumu ayrıca `NEXT_PUBLIC_SUPABASE_ANON_KEY`, sunucu ise `SUPABASE_SERVICE_ROLE_KEY` ister.
- SSR ve `/api/fixtures` aynı `loadFixtures` yükleyicisini kullanır: Supabase → yerelde bilinen skorların korunması → manuel düzeltmeler. Uzak okuma başarısızsa yerel JSON kullanılır. Her yanıt kendi `data_source` bilgisini taşır.
- `/api/health` yerel snapshot kapsamını ve 24 saatlik güncelliğini denetler; Supabase veya scraper erişiminin canlı testi değildir.
- `updated_at` kaynak snapshot zamanıdır. `last_attempt_at`, `last_success_at` ve `content_changed_at` ayrı tutulur. Başarısız tarama eski verinin tarihini yenilemez.
- Kod değişiklikleri özellik dalı ve PR ile incelenir. `main` için gerekli CI kontrolleri ve dal koruması GitHub yönetici ayarlarında etkinleştirilmelidir; depodaki dosyalar bunu tek başına etkinleştirmez.

### Test komutları

```bash
npm ci
python -m pip install -r scripts/requirements.txt pytest==9.0.2
npm run typecheck
npm run lint
npm test
python -m pytest tests -q
python scripts/generate_city_slugs.py --check
python scripts/validate_data_files.py
npm run build
# Ayrı terminalde npm start çalışırken:
python -m playwright install chromium
python -m pytest tests/e2e/visual_smoke.py -q
```

E2E testleri yalnızca yerel uygulamayı okur; scraping veya veri yazımı yapmaz. Sistem Chromium'u için `CHROMIUM_PATH=/usr/bin/chromium` kullanılabilir. Sabit şehir test verileri `tests/fixtures/cities/` altında tutulur; saatlik `data/` güncellemeleri birim testlerini değiştirmez. Güncel veri kontrolleri ayrı CI adımlarıdır.


### Eski şehir verilerini yerel yenileme

```bash
python scripts/scrape_all_provinces.py --local-only --stale-only --workers 4
```

Bu komut yalnızca 24 saatten eski mevcut şehir snapshot'larını seçer; diğer şehirleri korur, 60 dakika sınırını aşmaz ve Volleybox/Supabase entegrasyonlarını çalıştırmaz. Başarısız kaynak okumaları `Önbellek` durumuyla raporlanır; eski verinin tarihi başarı tarihi gibi yenilenmez. Zamanlanmış workflow da TVF toplamasını `--local-only` ile çalıştırır; Volleybox ve Supabase adımları workflow'da ayrı ve açıkça tanımlıdır.
