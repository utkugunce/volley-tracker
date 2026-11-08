# 🏐 Altyapı Voleybol (volley-tracker) — Codex Sistem & Proje Rehberi

Bu belge, **Altyapı Voleybol** (`altyapivoleybol.com.tr`) projesinin mimarisini, veri boru hattını, iş kurallarını, UI/tema sistemini ve geliştirme protokollerini Codex veya benzeri AI kodlama ajanları için eksiksiz olarak tanımlar.

---

## 1. Projeye Genel Bakış ve Kapsam

- **Web Sitesi:** [altyapivoleybol.com.tr](https://altyapivoleybol.com.tr)
- **Depo (Repo):** `utkugunce/volley-tracker` (Branch: `main`)
- **Misyon:** Türkiye Voleybol Federasyonu (TVF) 81 il temsilciliğinin resmi kulüp altyapı liglerini (**Genç Kızlar, Yıldız Kızlar, Küçük Kızlar Süper Lig ve 1. Lig**) tek çatı altında toplayan; fikstür, canlı skor, resmi TVF puan durumu, Volleybox grup analizleri ve takım detaylarını sunan Flashscore/Sofascore benzeri modern web platformu.

### 🚫 Kesin Kapsam Dışı ve Filtrelenen Kategoriler
1. **Profesyonel Ligler:** Sultanlar Ligi, Kadınlar 1. Ligi, Efeler Ligi vb. profesyonel ligler bu repoda **yer almaz**. Bunlar bağımsız `pro-volley` projesine (`C:\projects\pro-volley`) taşınmıştır.
2. **Resmi Olmayan Turnuvalar:** Aşağıdaki turnuvalar hem scraper hem de frontend katmanlarında filtrelenir, sitede asla gösterilmez:
   - **Okul Sporları:** İsminde, liginde veya grubunda `"okul sporları"`, `"okul spor"`, `"okul"` geçen karşılaşmalar.
   - **Kamu Sporları:** İsminde `"kamu sporları"`, `"kamu spor"`, `"kamu"` geçen karşılaşmalar.
   - **Kurumlar Arası / Özel Turnuvalar:** `"kurumlar arası"`, `"kurum"`, `"şirket"`, `"veteran"`, `"cumhuriyet kupası"` gibi organizasyonlar.

---

## 2. Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji / Araç | Sürüm & Notlar |
|---|---|---|
| **Framework** | Next.js (App Router, Turbopack) | `^16.4.4` (React 19, Server & Client Components) |
| **Dil** | TypeScript (Strict) & Node.js | Node `22+` (CI ve Vitest için zorunlu) |
| **Stil & Tema** | Tailwind CSS 3.4 + Özel "Fileönü" Teması | Manrope, Space Grotesk, `font-scoreboard`, `tabular-nums` |
| **İkonlar & Animasyon** | `lucide-react`, `motion` | Modern SVG ikonlar ve hafif geçiş animasyonları |
| **Veritabanı & Backend** | Supabase (PostgreSQL + RLS + GoTrue Auth) | Çift modlu mimari: Supabase yokken yerel JSON fallback |
| **Scraper & Veri İşleme** | Python 3.10+ (`httpx`, `beautifulsoup4`) | 81 ili multi-threaded paralel tarama |
| **Test & Kalite** | Vitest 5, React Testing Library, ESLint 9 | Birim, entegrasyon ve snapshot testleri |
| **Edge & Proxy** | Next.js Edge Middleware (`src/proxy.ts`) | İl rota güvenliği (404), DoS/Bot kalkanı ve Rate Limiting |
| **PWA & Bildirimler** | Service Worker, Web Push (`web-push`) | `public/sw.js`, `manifest.json`, favori maç push bildirimleri |
| **Dağıtım** | Vercel (Production) + GitHub Actions CI/CD | Saatlik otomatik cron veri senkronizasyonu |

---

## 3. Mimari ve Veri Akışı

```text
[TVF 81 İl Web Siteleri]
       │
       ▼ (Python / httpx + BeautifulSoup)
scripts/scrape_all_provinces.py ──► scripts/sync_volleybox_matches.py
       │
       ├──► data/cities/*.json & data/fixtures.json (JSON Fallback)
       └──► Supabase DB (matches, standings, user_roles)
               │
               ▼
   Next.js API & Server Components
               │
               ├── Edge Middleware (src/proxy.ts - City Guard)
               └── DashboardClient & Views (Fikstür, Puan Durumu, Günün Maçları)
```

### Çift Modlu Veri Mimarisi (Dual-Mode Resilience)
- **Supabase Öncelikli:** `NEXT_PUBLIC_SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` tanımlıysa maçlar, puan durumları, kullanıcı rolleri Supabase üzerinden yönetilir.
- **JSON Fallback:** Supabase yapılandırılmamışsa veya erişilemezse uygulama kesintisiz olarak `data/cities/*.json` ve `data/fixtures.json` dosyaları üzerinden çalışmaya devam eder.

### Kısmi Başlangıç Yüklemesi (Home Performance Optimization)
- Ana sayfa (`/`), mobil performansı maksimize etmek için `getInitialHomeFixtures()` fonksiyonuyla açılır: yalnızca bugün/dün + son 16 biten + 16 yaklaşan maç ve grup liderleri SSR ile gönderilir.
- Kullanıcı diğer sekmelere geçtiğinde `ensureFullData()` tam veri setini `/api/fixtures?city=` üzerinden arka planda tamamlar.

---

## 4. Dizin Yapısı (Repository Directory Map)

```text
volley-tracker/
├── .github/workflows/          # CI/CD: build, test, lint, saatlik scraper cron
├── data/                       # Veri deposu
│   ├── cities/                 # 81 ilin ayrık JSON dosyaları (istanbul.json, ankara.json...)
│   ├── cities.json             # Aktif taranan iller listesi ve metaveriler
│   ├── fixtures.json           # Konsolide maç ve puan tablosu verisi
│   ├── team-rosters.json       # Takım kadro bilgileri
│   └── volleybox-mappings.json # TVF takım - Volleybox ID eşleme sözlüğü
├── scripts/                    # Python ve Node.js otomasyon betikleri
│   ├── parsers/                # İl bazlı özel parser modülleri (istanbul.py, ankara.py...)
│   ├── scrape_all_provinces.py # 81 ili eşzamanlı çeken ana scraper (1 saat cooldown kontrollü)
│   ├── sync_volleybox_matches.py # Volleybox maç sonuçları ve puan senkronizasyonu
│   ├── generate_city_slugs.py  # src/utils/citySlugs.ts dosyasını derleyen betik
│   ├── validate_data_files.py  # JSON veri kalitesi ve bütünlük doğrulayıcı
│   └── import_json_to_supabase.mjs # JSON verisini Supabase tablolarına aktarma betiği
├── src/
│   ├── app/                    # Next.js App Router sayfaları
│   │   ├── page.tsx            # Ana Sayfa Dashboard (Home)
│   │   ├── [city]/             # Şehir bazlı dinamik rota
│   │   ├── fikstur/            # Fikstür tablosu sekmesi
│   │   ├── puan-durumu/        # Resmi puan durumu sekmesi
│   │   ├── gunun-maclari/      # Günün maçları odaklı görünüm
│   │   ├── takim/[slug]/       # Takım profil ve istatistik sayfası
│   │   ├── lig/[...slug]/      # Lig hub ve grup detay sayfası
│   │   ├── karsilastir/        # İki takımı kafa kafaya karşılaştırma ekranı
│   │   ├── admin/              # Kullanıcı rolleri ve maç override yönetim paneli
│   │   ├── api/                # Next.js Serverless API rotaları (/api/fixtures, /api/sync...)
│   ├── proxy.ts                # Geçersiz il isteklerine gerçek HTTP 404
│   ├── components/             # Yeniden kullanılabilir UI bileşenleri
│   │   ├── FixtureTable.tsx    # Fikstür ve maç satırları tablosu
│   │   ├── StandingsTable.tsx  # TVF resmi puan durumu ve form göstergeleri
│   │   ├── DateRibbon.tsx      # Flashscore tipi yatay gün seçici
│   │   ├── FilterBar.tsx       # Lig, salon, durum filtreleri ve arama barı
│   │   ├── Header.tsx          # Üst navigasyon, arama ve senkronizasyon göstergesi
│   │   ├── MatchCenterDrawer.tsx # Detaylı maç inceleme çekmecesi
│   │   └── common/SkeletonLoaders.tsx # Yükleme iskeletleri
│   ├── contexts/ & hooks/      # AuthContext, useFixturesData, useFavorites, useDashboardFilters...
│   ├── theme/                  # Fileönü renk paleti, theme-vars, tokens
│   ├── types/                  # TypeScript arayüz ve tip tanımları (fixture.ts, unified.ts)
│   └── utils/                  # Yardımcı fonksiyonlar, supabaseClient, citySlugs.ts
└── supabase/                   # Veritabanı şemaları (001_backend_schema.sql, 002_auth_roles.sql)
```

---

## 5. Codex İçin Değişmez Geliştirme Kuralları (Inviolable Rules)

### 🛑 Kural 1: Şehir Allowlist'i (`src/utils/citySlugs.ts`)
- `src/utils/citySlugs.ts` dosyası **asla elle düzenlenmez**.
- `data/cities.json`'a il eklendiğinde/çıkarıldığında veya `src/app` altına kökünde `page.tsx` olan yeni bir statik rota eklendiğinde şu komut çalıştırılır:
  ```bash
  python scripts/generate_city_slugs.py
  ```
- CI bunu `python scripts/generate_city_slugs.py --check` ile doğrular; dosya bayatsa PR/build kırılır.
- `src/proxy.ts` geçersiz veya gizli iller (`src/utils/hiddenCities.ts`) için yumuşak 404 yerine **gerçek HTTP 404** döndürür.

### 🛑 Kural 2: Metadata `<title>` Marka Tekrarı Yasağı
- `src/app/layout.tsx` dosyasında `title.template = "%s | Altyapı Voleybol"` şablonu tanımlıdır.
- Alt sayfalardaki sayfa başlıklarına **asla marka eki eklenmez**:
  - ❌ *Yanlış:* `title: "İstanbul Voleybol Fikstürü — Altyapı Voleybol"` (Çıktı: *İstanbul Voleybol Fikstürü — Altyapı Voleybol | Altyapı Voleybol*)
  - ✅ *Doğru:* `title: "İstanbul Voleybol Fikstürü"`
- Bu kuralı `src/__tests__/metadata-brand.test.ts` zorunlu kılar.

### 🛑 Kural 3: 81 İl Scraper Cooldown (1 Saat Kuralı)
- Kod doğrulaması canlı veri güncellemesinden ayrıdır. 81 il taraması yalnızca saatlik workflow veya açık veri güncelleme talebiyle çalıştırılır.
- İki çekme arasında **en az 60 dakika (1 saat)** bulunmalıdır. Script içinde dahili cooldown kontrolü vardır; süre dolmamışsa işlem güvenle atlanır.
- **Kullanıcı açıkça manuel olarak istemedikçe** (*"hemen çek"*, *"force"*, *"zorla güncelle"* vb.) script'e **asla `--force` bayrağı verilmez**.

### 🛑 Kural 4: Özellik Dalı, PR ve CI

Kod değişikliklerini özellik dalında commit edin; doğrudan `main` dalına push etmeyin. PR üzerinden inceleme ve başarılı CI gereklidir. Kontroller: `npm run typecheck`, `npm run lint`, `npm test`, `python -m pytest tests -q`, `python scripts/generate_city_slugs.py --check`, `python scripts/validate_data_files.py`, üretim derlemesi ve arayüz değişikliklerinde tarayıcı kontrolleri. Dal koruması GitHub yönetici ayarından ayrıca etkinleştirilir.

### 🛑 Kural 5: "Fileönü" Tasarım Sistemi ve Tipografi
- Voleybol filesi ve gece salonu konseptine dayalı koyu tema:
  - Zemin: `bg-canvas` (`#07131F`)
  - Yüzey/Kartlar: `bg-surface` (`#0E2033`)
  - Vurgulu/Yükseltilmiş: `bg-surface-raised` (`#13293F`)
  - Kenarlıklar: `border-line` (`#1B3550`)
- **Skor ve Sayı Tipografisi:** Skor, sayı, sıra numarası hücrelerinde layout shift (kayma) olmaması için mutlaka **`font-scoreboard tabular-nums`** sınıfları kullanılmalıdır.
- **Erişilebilirlik (WCAG 2.x):** Düşük kontrastlı metinler (eski `#64748B`) yerine daima `text-ink-2` (`#94A3B8`) veya `text-ink-1` (`#F1F5F9`) kullanılır.

---

## 6. Sık Kullanılan Geliştirici Komutları

```bash
# Yerel geliştirme sunucusu
npm run dev

# Tip kontrolü (TypeScript)
npm run typecheck

# Linter kontrolü
npm run lint

# Testleri çalıştırma
npm test

# 81 il verisini çekme (1 saat bekleme kuralı devrededir)
python scripts/scrape_all_provinces.py

# 81 il verisini zorla çekme (Sadece kullanıcı açıkça isterse!)
python scripts/scrape_all_provinces.py --force

# Şehir slug dosyasını güncelleme
python scripts/generate_city_slugs.py

# Veri bütünlüğünü doğrulama
python scripts/validate_data_files.py

# Volleybox verilerini senkronize etme
python scripts/sync_volleybox_matches.py
```


## 7. Güncel Veri ve Güvenlik Sözleşmesi

- SSR/API ortak `src/utils/loadFixtures.ts` yükleyicisini kullanır; Supabase verisi yerel skorlarla tamamlanır ve manuel düzeltmeler son uygulanır.
- JWT metadata yerine `user_roles` tablosu yetkilidir. RLS için `008_authoritative_roles.sql` migration'ı dağıtımda uygulanmalıdır.
- Senkronizasyon parolası yapılandırılmamışsa parola erişimi kapalıdır; varsayılan parola yoktur. URL üzerinden erişim jetonu kabul edilmez.
- Sağlık kontrolü yerel snapshot kapsamını ve güncelliğini ölçer. Başarısız tarama kaynak tarihini yenilemez.
- Güncel uygulama kaydı: [docs/implementation-status.md](docs/implementation-status.md).
