# DEVİR RAPORU — "Fileönü" Teması (altyapivoleybol.com.tr)

> Hazırlanma: 1 Ekim 2026, ~21:10 (TSİ). Hedef okuyucu: başka bir IDE'deki kodlama ajanı. Bu belge **tek başına yeterli** olacak şekilde yazıldı: bağlam, tasarım kararları, hex değerleri, kontrast hesapları, dosya yolu + eski → yeni eşleme tabloları, kod örnekleri, test ve doğrulama listeleri, riskler.
>
> **Doğrulanan taban:** `https://github.com/utkugunce/volley-tracker` → `main` @ `dea2414` (temiz klon: `/workspace/volley-tracker-latest`). Bu taban 63 test dosyası / **416 test** içerir (önceki 60/402 değil). Kullanıcı + Antigravity ajanı mobil performans için değişiklik yaptı (bkz. §3.2). Rapordaki tüm yollar ve sınıflar bu tabana göre doğrulandı; "eski" değerler bu tabandaki değerlerdir.
>
> **Durum notu (dürüst):** Tema, daha eski bir taban (`893b2c5`) üzerinde yerel olarak uygulanıp denendi (71 dosya; 402/402 test, `tsc` ve `eslint` temiz). Yeni tabana **tam yama olarak taşınmadı** (16 dosyada 3-yollu birleştirme çakışması çıktı, bkz. §3.3). Yeni tabanda yalnızca iki dosya (`tailwind.config.ts`, `src/components/StandingsTable.tsx`) üst üste konarak tüm test paketi çalıştırıldı: **63/63 dosya, 416/416 test geçti** (kalan dosyalar eski sınıflarla; yani bu, "bütün tema uygulandı" doğrulaması değildir). Hiçbir şey GitHub'a push edilmedi / PR açılmadı.

---

## İçindekiler
1. Site bağlamı
2. Tema: "Fileönü" ve gerekçe
3. Repo bulguları (güncel taban)
4. Palet ve token tablosu (hex, rol, kontrast)
5. Tipografi
6. Anlam kuralları
7. Kadınlar 2. Lig — ayrışan vurgu paleti
8. Kapsam kısıtları (Fikstür / Günün Maçları dokunulmaz yapı; Puan Durumu yeniden tasarımı)
9. Uygulama planı (sırayla) + kod örnekleri
10. Sayfa-sayfa hedef görünüm ve dosya haritası
11. Bileşen-bileşen eşleme tabloları (tüm site)
12. Lazy-load (next/dynamic) bileşenler — temadan kaçmama notları
13. Güncellenecek / eklenecek testler
14. Doğrulama kontrol listesi
15. Riskler, bilinen eksikler, test edilmeyenler
- Ek A: Dosya başına renk kullanım sayımları (güncel taban)
- Ek B: Dosya başına eski → yeni sınıf eşlemeleri (yerel uygulamadan çıkarıldı)
- Ek C: Otomatik dönüştürme betiği (hexmap) ve kontrast hesaplayıcı

---

## 1. Site bağlamı

- **Site:** altyapivoleybol.com.tr — TVF (Türkiye Voleybol Federasyonu) 81 il temsilciliği Genç / Yıldız / Küçük Kızlar Süper Lig ve 1. Lig fikstürü, canlı sonuç, puan durumu, grup durumu (Volleybox), Kadınlar 2. Lig bölümü (16 grup), takım detayı, karşılaştırma, admin paneli.
- **Yığın:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS **3.4** (`tailwind.config.ts`, JIT; v4 değil), vitest 5 + Testing Library, `lucide-react`, `next/font`, Vercel (+ `@vercel/analytics`), Supabase/realtime. PWA: `public/manifest.json`, `public/sw.js`.
- **Çalışma ortamı notu:** Testler için **Node 22** gerekir (Node 20 ile vitest bozuluyor). Komutlar: `npm run build`, `npx vitest run`, `npx tsc --noEmit`, `npx eslint src`.
- **Dil:** Arayüz Türkçe; kullanıcı Türkçe konuşur. Türkçe karakter (ğ ş ı İ ö ü ç) desteği yazı tipi seçiminde **zorunlu** (`latin-ext`).
- **Marka:** "Altyapı Voleybol". Eski görünüm: koyu lacivert/siyah zemin + her yerde kırmızı/pembe (rose-600) gradyan düğmeler, zümrüt/kehribar/mavi rozetler; yani **vurgu rengi çok fazla yarışıyordu** (kırmızı hem "marka" hem "canlı" hem "hata" anlamına geliyordu).
- **Rota → bileşen:**

| Rota | Dosya | Ana bileşen |
|---|---|---|
| `/` | `src/app/page.tsx` | `DashboardClient` (initialTab="home"; `?city` yoksa `getInitialHomeFixtures()` ile **kısmi** veri) |
| `/[city]` | `src/app/[city]/page.tsx` | `DashboardClient` |
| `/fikstur`, `/fikstur/[city]` | `src/app/fikstur/...` | `DashboardClient` (fixtures) |
| `/gunun-maclari`, `/gunun-maclari/[city]` | `src/app/gunun-maclari/...` | `DashboardClient` (today) |
| `/puan-durumu`, `/puan-durumu/[city]` | `src/app/puan-durumu/...` | `DashboardClient` (standings) |
| `/grup-durumu`, `/grup-durumu/[city]` | `src/app/grup-durumu/...` | `DashboardClient` (group-status) |
| `/sonuclar`, `/sonuclar/[city]` | `src/app/sonuclar/...` | `DashboardClient` (results) |
| `/lig/[...slug]` | `src/app/lig/[...slug]/page.tsx` | `LeagueHubClient` |
| `/takim/[slug]` | `src/app/takim/[slug]/page.tsx` | `TeamDetailClient` |
| `/karsilastir` | `src/app/karsilastir/page.tsx` | `CompareClient` |
| `/kadinlar-2-ligi`, `/kadinlar-2-ligi/[...slug]` | `src/app/kadinlar-2-ligi/...` | `Kadinlar2LigClient` |
| `/admin` | `src/app/admin/page.tsx` (1920 satır, auth gerekir) | — |

---

## 2. Tema: "Fileönü" ve gerekçe

**Fikir:** Voleybol filesinin ("fileönü" = file önü, oyun alanı) gece salonu görünümü: derin lacivert-petrol **zemin**, voleybol ağının çizgilerini andıran ince **mavi-gri çizgiler**, ve **tek** ana vurgu olarak turkuaz (Altyapı bölümü). Kadınlar 2. Lig aynı zemin/yüzey/tipografiyi paylaşır ama **vurgusu orkide (mor)**dur.

**Gerekçeler:**
1. **Tek vurgu:** Eskiden kırmızı gradyan hem marka hem canlı hem hata idi. Yeni sistemde kırmızı-mercan yalnız **CANLI**; marka = turkuaz; seçili durum = mavi; bitti = açık yeşil; uyarı/favori = kehribar.
2. **Kontrast (WCAG 2.x):** Tüm metin/zemin çiftleri ≥ 4.5:1 (normal metin), çoğu ≥ 7:1 (§4). Eski `#64748B` küçük metin yüzeyde 3.47:1 idi (başarısız) → kaldırıldı. Eski `#5B9DFF` üstü beyaz yazı 2.72:1 idi → seçili DOLU zemin `#2A63BD` (beyaz yazı 5.80:1).
3. **Gürültü azaltma:** Sayı rozetleri (renkli hap) → sade tabular metin. Kırmızı/pembe gradyan düğmeler → düz renk. Parıltı (glow) yalnız birincil/seçili eylemlerde.
4. **Okunaklı sayılar:** Skor/sıra/puan için Space Grotesk + `tabular-nums` (kayma yok → CLS ve göz taraması iyi).
5. **Tek renk kaynağı:** Hex'ler dosyalara dağınıktı (≈450 sabit `bg-[#…]` sınıfı); artık `tailwind.config.ts` + `globals.css` token'ları.

Onaylanan görsel öneriler (kullanıcı tarafı): `/workspace/volley-theme/onizleme/oneri-1..3.png` (3 öneri); seçilen yön **Fileönü**.

---

## 3. Repo bulguları (güncel taban `dea2414`)

### 3.1 Genel
- Renkler **üç biçimde** kullanılıyor: (a) Tailwind varsayılan palet sınıfları (`red/rose/pink/emerald/amber/sky/blue/slate-*`), (b) sabit hex sınıfları `bg-[#1E222D]` vb. (**39 dosya**; en sık: `#2a2e3d` 103×, `#94a3b8` 102×, `#1e222d` 67×, `#181a20` 51×, `#f1f5f9` 20×, `#0b1325` 20×, `#cbd5e1` 14×, `#0f172a` 14×, `#121212` 13×), (c) satır içi hex (SVG, canvas, `ThemeTokens.ts`, `groupStatus.ts`, grafik stroke'ları).
- `AppShell.tsx` `--portal-background/panel/border` CSS değişkenlerini `ThemeTokens.ts`'ten verir (testlerce doğrulanıyor).
- `globals.css`: Museo Sans `@font-face` (+ `public/fonts/museo-sans-*.woff` ve `layout.tsx`'te 3 `<link rel="preload">`), body'de **kırmızı radial gradyan** (`rgba(225,29,72,.08)`), `.glass-panel/.glass-card/.match-strip/.card-clean`, `.font-scoreboard`, scrollbar, print stilleri (beyaz çıktı; dokunma).
- `groupStatus.ts`: 21 sabit hex = **resmi TVF/Volleybox durum renkleri**; `groupStatus.test.ts` bu hex'lere bağlı → **DEĞİŞTİRME** (bilinçli istisna, §15).
- `font-mono` sınıfı her yerde rakamlar için kullanılıyor (yazı tipi "mono" değil, tabular amaçlı).
- `Header.test.tsx` `border-primary text-white` bekliyor; `CompactMatchRow.test` `bg-amber-950/30`; `SetScoreMatrix.test` `text-slate-500`, `text-blue-300`, `text-emerald-400` → bu yüzden **Tailwind varsayılan palet adları korunup değerleri yeniden bağlandı** (sınıf adları aynı kalır, test kırılmaz).

### 3.2 Antigravity'nin son değişiklikleri (bu raporun doğruladığı)
| Değişiklik | Dosya | Tema için anlamı |
|---|---|---|
| `getInitialHomeFixtures()` — anasayfa için bugün/dün + son 16 biten + 16 yaklaşan + grup başına yalnız lider | `src/utils/getInitialFixtures.ts`, `src/app/page.tsx` | Renk yok; ama **ana sayfada puan durumu yalnız liderleri içerir** → Puan Durumu yeniden tasarımı yalnız `/puan-durumu` (tam veri) sekmesinde anlamlı. |
| `initialDataPartial` + `ensureFullData()` — sekme `home` dışına geçince tam veriyi `/api/fixtures?city=` ile arka planda yükler; yüklenirken `loading` → `TabViewSkeleton` | `DashboardClient.tsx` | Yükleme sırasında **iskelet** gösterilir → iskelet renkleri temalı olmalı (yoksa eski renk "çakılır"). |
| `HomePortalView` `totalMatchesCount` prop'u; sayfa başlığı `<h1>` (**"Canlı Maç Merkezi & TVF Altyapı Bülteni"**), 2 kolonlu alt widget grid'i, `min-h-[38px]` dokunma hedefleri | `HomePortalView.tsx` | Eşleme tablosunda yeni `h1` ve nokta rozeti için kural var (§11). Sağ sütun artık yok (tam genişlik). |
| `next/dynamic` (`ssr:false`) ile `MatchCenterDrawer`, `SpotlightSearchModal` (Kadinlar2LigClient, LeagueHubClient), `SocialStoryModal` (MatchCenterDrawer içinde) | 4 dosya | §12. |
| `SkeletonLoaders.tsx` (yeni, 328 satır) + `TabViewSkeleton` | `src/components/common/` | Yeni dosya: sabit hex `#181A20 #1E222D #2A2E3D` + `slate-*` içerir → temalanmalı. |
| `font-scoreboard` + `tabular-nums` sınıfları skor hücrelerine eklendi; `ScoreboardTypography.test.tsx` bunu **zorunlu kılıyor** | birçok dosya | **Yeni test bağımlılığı** (§13). |
| `.font-scoreboard` artık `ui-monospace…` (monospace) | `globals.css` | Tema Space Grotesk ister → bu kuralı `var(--font-display)` yap. |
| `AppShell` yan panel `top` değerini `headerHeight` state'inden hesaplıyor | `AppShell.tsx` | Tema `--app-header-h` CSS değişkenini de eklemeli (sticky tablo başlığı); iki ihtiyaç tek `ResizeObserver` ile birleştirilir (§9.4). |
| `Kadinlar2LigSidebar` yeniden yazıldı (açılır bölümler, "TVF Altyapı Ligleri · 81 İl →" köprüsü mavi) + yeni test | dosya + `__tests__/Kadinlar2LigSidebar.test.tsx` | Eski eşleme tablosu geçersiz; §11'de yeni kurallar. |
| `Kadinlar2LigClient` sayfa `<h1>` ("TVF Kadınlar 2. Ligi — Canlı Puan Durumu & Fikstür", mor/pembe renkli) | dosya | §7/§11. |
| `TodayMatchesView` `<h1>` artık "Günün Maçları & Canlı Skor Takibi" + altında tarih `<p>` | dosya | Yapı korunur (§8). |
| Metadata/OG/canonical (`layout.tsx`, sayfalar) | — | Tema ile ilgisiz; `layout.tsx`'e tema eklerken **bu `openGraph/twitter` bloklarını koru**. |
| `#64748B` → `#94A3B8` toplu kontrast düzeltmesi (Antigravity) | çok dosya | Kısmen aynı amaç; bizim token: `text-ink-2`/`ink-3`. `#64748B` artık büyük ölçüde kalmadı. |
| `.vercelignore` genişledi (tests/, docs/, scratch/ vb.) | — | Etkisiz. |

### 3.3 Eski yamanın yeni tabana uygulanması
Eski taban (`893b2c5`) üzerinde üretilen 71 dosyalık değişiklikle yeni tabanın `git apply --3way` sonucu: 55 dosya temiz, **16 dosya çakışma**:
`src/app/globals.css`, `DashboardClient.tsx`, `FixtureTable.tsx`, `HomePortalView.tsx`, `SocialStoryModal.tsx`, `StandingsTable.tsx`, `kadinlar-2-lig/Kadinlar2LigHomePortal.tsx`, `kadinlar-2-lig/Kadinlar2LigSidebar.tsx`, `layout/AppShell.tsx`, `layout/LeftSidebarPlaceholder.tsx`, `layout/RightSidebarPlaceholder.tsx`, `layout/SidebarNavigation.tsx`, `match/CompactMatchFeed.tsx`, `match/CompactMatchRow.tsx`, `match/MatchInspectorPanel.tsx`, `match/SetScoreMatrix.tsx`.
Çakışmaların nedeni çoğunlukla Antigravity'nin `font-scoreboard tabular-nums` / `#64748B→#94A3B8` değişiklikleriyle aynı satırlara dokunulmasıdır. **Öneri:** yamayı değil, **§11 kuralları + Ek C betiğini** yeni tabana uygulayın; ardından §9.4–§9.8'deki yapısal değişiklikleri elle yapın.

---

## 4. Palet ve token tablosu

Tüm kontrastlar WCAG 2.x göreli parlaklık formülüyle hesaplandı (Ek C'deki betik). "zemin" = canvas `#07131F`, "yüzey" = surface `#0E2033`, "yükseltilmiş" = raised `#13293F`.

### 4.1 Zemin ve yüzeyler
| Token (Tailwind / CSS) | Hex | Rol |
|---|---|---|
| `bg-canvas` / `--canvas` / `background` | `#07131F` | Sayfa zemini; `ThemeTokens.background`; manifest/theme-color |
| `bg-surface` / `--surface` / `panel` | `#0E2033` | Kart, panel, yan çubuk, tablo gövdesi; `ThemeTokens.panel` |
| `bg-surface-muted` / `--surface-muted` / `panel-inset` | `#0A1A2B` | İç içe/çukur alan, input zemini, eski `#181A20/#0b1325` karşılığı |
| `bg-surface-raised` / `--surface-raised` | `#13293F` | Hover, açık satır, sekme zemini, detay satırı |
| `border-line` / `--line` / `border` | `#1B3550` | Ayırıcı/çerçeve (**metin değil**; `ThemeTokens.border`) |
| `border-dark` | `#16293F` | Daha sönük çizgi |

### 4.2 Metin
| Token | Hex | zemin | yüzey | yükseltilmiş | Kullanım |
|---|---|---|---|---|---|
| `text-ink` | `#EAF6FA` | 16.99 | 14.97 | 13.46 | Ana metin, başlık, skor |
| `text-ink-2` | `#A9C3D1` | 10.17 | 8.97 | 8.06 | İkincil metin, etiket, ikon |
| `text-ink-3` | `#8CA8B8` | 7.49 | 6.60 | 5.94 | Sönük/ipucu metni (en sönük izin verilen) |
| *(yasak)* | `#64748B` | — | 3.47 ✗ | — | Eski; yüzeyde başarısız, **kullanma** |

### 4.3 Anlam ve vurgu renkleri
| Token | Hex | zemin | yüzey | yükseltilmiş | Rol | Üstündeki metin |
|---|---|---|---|---|---|---|
| `primary` (Altyapı) | `#2DD4C0` | 10.06 | 8.87 | 7.97 | Ana eylem, marka, 1–2. sıra | `primary-fg` `#032320` → **8.92** |
| `primary-hover` | `#5EEAD4` | — | — | — | Hover | `#032320` → 11.22 |
| `live` | `#FF6E82` | 6.96 | 6.13 | 5.51 | **Yalnız** CANLI / hata | `live-fg` `#2B0A10` → 6.77; koyu dolgu `#C42D49` + beyaz → 5.50 |
| `done` | `#9BE15D` | 11.87 | 10.46 | — | Bitti / galibiyet / başarı | `done-fg` `#0B2A05` → 9.89 |
| `selected` | `#5B9DFF` | 6.87 | 6.06 | — | Seçili çizgi/ikon/kenarlık | — |
| `selected-text` | `#7FB4FF` | 8.80 | 7.76 | 6.97 | Seçili **metin** | — |
| `selected-strong` | `#2A63BD` | — | — | — | Seçili **DOLU zemin** | beyaz **5.80**; `ink` 5.27; ⚠ `ink-2` üstünde 3.15 ✗ (dolguda ikincil metin kullanma) |
| `warn` | `#FFC24D` | 11.65 | 10.27 | — | Uyarı, favori yıldız, bağlantı koptu | `#2B1D00` → 10.23 |
| `rank-mid` | `#B79BFF` | 8.15 | 7.18 | — | 3–8. sıra işareti (Klasman) | — |
| `form-loss` | `#FF8FA0` | — | 7.61 | 6.84 | Yalnız form halkası "M" ve puan durumundaki mağlubiyet vurgusu | — |
| `orchid` | `#D98BFF` | 8.10 | 7.14 | 6.41 | Kadınlar 2. Lig vurgusu (§7) | `#2A0B3A` → 7.53 |
| alternatif sönük | `#6F8EA3` | — | 4.77 | — | `slate-600` (yalnız büyük/ikon) | — |

CSS değişkenleri (RGB kanalı olarak, `rgb(var(--primary-rgb) / <alpha-value>)` kullanılabilsin diye): `--primary-rgb: 45 212 192`, `--primary-hover-rgb: 94 234 212`, `--primary-fg-rgb: 3 35 32`, `--rank-mid-rgb: 183 155 255`.

### 4.4 Tailwind varsayılan paletlerin yeniden bağlanması (sınıf adları değişmez!)
Bu, "eski sınıf adı → yeni değer" eşlemesinin temel mekanizmasıdır; böylece yüzlerce `text-rose-400`, `bg-emerald-500/20`, `border-slate-800` vb. sınıf kodda dururken yeni paletle gelir. Ölçeklerin **600** tonu beyaz yazı ≥ 4.5:1 olacak şekilde hesaplandı.

| Ölçek (kaynak) | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **coral** (→ `red`,`rose`,`pink`) | `#FFF0F2` | `#FFDBE0` | `#FFB6C0` | `#FF92A1` | `#FF6E82` | `#DB5F70` | `#C42D49` | `#9D243A` | `#4C2C3B` | `#342331` | `#201C29` |
| **green** (→ `emerald`,`green`,`lime`) | `#F5FCEF` | `#E6F8D6` | `#CDF0AE` | `#B4E886` | `#9BE15D` | `#85C250` | `#557C33` | `#446329` | `#304D30` | `#22382A` | `#162825` |
| **amber** (→ `amber`,`yellow`,`orange`) | `#FFF9ED` | `#FFF0D2` | `#FFE0A6` | `#FFD17A` | `#FFC24D` | `#DBA742` | `#8C6B2A` | `#705622` | `#4C442C` | `#343327` | `#202424` |
| **blue** (→ `blue`,`sky`,`cyan`,`indigo`) | `#F2F8FF` | `#DFECFF` | `#BFDAFF` | `#9FC7FF` | `#7FB4FF` | `#5B9DFF` | `#2A63BD` | `#224F97` | `#29405E` | `#1D3047` | `#132335` |
| **purple** (→ `purple`,`violet`) | `#F8F5FF` | `#EDE6FF` | `#DBCDFF` | `#C9B4FF` | `#B79BFF` | `#9D85DB` | `#7B68AB` | `#625389` | `#38395E` | `#272B47` | `#192135` |
| **teal** (→ `teal`) | `#EAFBF9` | `#CAF4EF` | `#96EAE0` | `#62DFD0` | `#2DD4C0` | `#27B6A5` | `#1B8175` | `#16675E` | `#12494C` | `#0E363C` | `#0B262F` |
| **slate** (→ `slate`) | `#F2FAFC` | `#DCEBF2` | `#C7DAE4` | `#B8CFDC` | `#A9C3D1` | `#8CA8B8` | `#6F8EA3` | `#2A4560` | `#1B3550` | `#0E2033` | `#07131F` |
| **fuchsia / orkide** (→ `fuchsia`) | `#FBF3FF` | `#F6E2FF` | `#ECC5FF` | `#E2A8FF` | `#D98BFF` | `#BB78DB` | `#9333B8` | `#762993` | `#42355E` | `#2D2947` | `#1C1F35` |

Sonuç örnekleri: `text-rose-400` = `#FF6E82` (canlı rengi); `bg-emerald-500` = `#85C250`; `border-slate-800` = `#1B3550`; `bg-slate-900` = `#0E2033`; `bg-slate-950` = `#07131F`; `text-slate-400` = `#A9C3D1` (= ink-2); `text-slate-500` = `#8CA8B8` (= ink-3); `text-slate-600` = `#6F8EA3`.

> **Önemli sonuç:** `rose/red/pink` ölçeği artık **canlı rengi**dir. Bu yüzden dekoratif amaçla `text-rose-*` kullanan yerler **token'a taşınmalıdır** (`text-primary` / `text-ink-2`), yoksa dekoratif öğeler "canlı" gibi görünür (bkz. §6, §11).

### 4.5 Gölgeler
`glow-red` `0 0 20px -3px rgba(255,110,130,.40)`; `glow-amber` `rgba(255,194,77,.40)`; `glow-emerald` `rgba(155,225,93,.35)`; `glow-sky` `rgba(91,157,255,.40)`; `glow-primary` `0 0 20px -3px rgb(var(--primary-rgb) / .40)`; `glow-selected` `0 0 18px -4px rgba(91,157,255,.45)`; `card` `0 8px 30px -4px rgba(0,0,0,.4)`; `card-hover` `0 14px 36px -4px rgba(0,0,0,.6)`.

---

## 5. Tipografi

| Rol | Yazı tipi | Ağırlıklar | Uygulama |
|---|---|---|---|
| Gövde / arayüz | **Manrope** | 400, 500, 600, 700, 800 | `font-sans` (`var(--font-manrope)`) — `body` |
| Başlık, sayı, skor, sıra, puan | **Space Grotesk** | 500, 600, 700 | `font-display`; `h1–h3` ve `.font-display` CSS kuralıyla; `font-mono` ve `.font-scoreboard` de buna bağlanır (tabular) |

- **Türkçe:** `next/font/google` `subsets: ["latin","latin-ext"]` zorunlu. (Yerel derlemede latin-ext woff2 dosyaları üretildiği ve preload edildiği doğrulandı.)
- `font-black` (900) Manrope'ta 800'e, Space Grotesk'te 700'e düşer; tarayıcı en yakın ağırlığı seçer (sentetik kalın yok). Görsel olarak sorun yok.
- **Rakamlar:** `font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1;` (`.tabular, .font-mono, .font-scoreboard`). Tüm skor/sıra/puan/saat/sayaç hücrelerinde `font-display` (veya mevcut `font-mono`) + `tabular-nums`.
- `h1–h3` letter-spacing `-0.01em`; `.font-scoreboard` letter-spacing `-0.02em`.
- Minimum boyutlar: tablo gövdesi 12–14 px, başlık satırı 10–11 px (büyük harf, `tracking-wider`), rozet/sayaç 10–11 px. Dokunma hedefi ≥ 36–38 px (Antigravity `min-h-[36/38px]` değişikliklerini koru).
- **Canvas (SocialStoryModal):** `ctx.font` ile `next/font` aile adı **CSS değişkeninden** okunur (§12.3). Canvas'ta ağırlık **≤ 800 (Manrope) / ≤ 700 (Space Grotesk)** kullanın; `900` yüklü değil.
- Eski yazı tipi (**Museo Sans**) tamamen kaldırılır: `@font-face` blokları, `public/fonts/museo-sans-*` kullanımı, `layout.tsx` `<head>` preload'ları, `sw.js` önbellek girişleri, SocialStoryModal `ctx.font` dizgeleri.

---

## 6. Anlam kuralları (renk ne zaman kullanılır)

| Anlam | Renk | Kural |
|---|---|---|
| **CANLI** | `live` `#FF6E82` | Yalnız canlı maç göstergeleri (LiveMatchScore, "CANLI" rozeti, Mobil alt gezinti "Canlı" sekmesi, canlı satır noktası) ve gerçek **hata** kutuları. Başka hiçbir dekoratif öğe kırmızı/pembe olamaz. Nabız (`animate-pulse`) **yalnız canlı** içindir. |
| **Ana eylem / marka** | `primary` (turkuaz; Kadınlar 2. Lig'de orkide) | Birincil düğme (`bg-primary text-primary-fg font-bold shadow-glow-primary`), kategori segmenti seçili, şehir sekmesi seçili, 1–2. sıra işareti. |
| **Seçili / aktif gezinti** | `selected*` (mavi) | Tarih şeridi BUGÜN/seçili gün, durum sekmeleri, görünüm sekmeleri, Lig hub sekmeleri, admin sekmeleri, grup sekmesi alt çizgisi: dolgu = `bg-selected-strong text-white font-bold shadow-glow-selected`; çizgi/ikon = `border-selected`; metin = `text-selected-text`. |
| **Bitti / galibiyet / başarı** | `done` | Kazanan skor **sade** `text-done font-black` (kırmızı dolgu YOK), "Bitti" rozeti, form "G" halkası, yeşil dolgu üstünde `text-done-fg`. |
| **Uyarı / favori** | `warn` | Yıldız, uyarı, bağlantı koptu (`LiveScoreIndicator`), saat farkı (discrepancy) vurgusu, libero (kort). |
| **Mağlubiyet (form)** | `form-loss` `#FF8FA0` | Yalnız form halkası "M" ve puan durumu mağlubiyet sütunu/metni. Canlı değildir (daha açık/pembe). |
| **Klasman (3–8.)** | `rank-mid` mor (Kadınlar 2. Lig'de mavi `#7FB4FF`) | Puan durumunda 3–8. sıra işareti. |
| **Nötr** | `ink`, `ink-2`, `ink-3`, `line`, `surface*` | Her şeyin geri kalanı. |

Ek kurallar:
1. **Kırmızı üç yerde yarışmasın:** PwaInstallPrompt artık nötr (`bg-surface-raised border-line`, ikon `text-primary`), CityTabBar seçili = `bg-primary`, Canlı Hub / Günün Maçları vurguları birincil/seçili; yalnız "Canlı" = `live`.
2. **Sayı rozetleri (renkli hap) YASAK:** Header, CityTabBar, CitySelector, MobileBottomNav, FilterBar, Kadinlar2 Header/MobileNav/HomePortal, GroupStatusView, yan çubuk sayaçları → `font-display font-semibold tabular-nums text-ink-2` (gerekirse `text-primary`).
3. **Gradyan düğme yok:** `bg-gradient-to-r from-red-600 to-rose-600 …` → düz `bg-primary text-primary-fg` (veya seçili için `bg-selected-strong`).
4. **Beyaz yazı kontrol taraması:** `bg-primary text-white` (1.86) → `text-primary-fg`; `bg-emerald-500 text-white` (2.14) → `bg-done text-done-fg`; `bg-live text-white` (2.69) → `text-live-fg`; `bg-blue-500 text-white` (2.72) → `bg-selected-strong text-white`.
5. **Form rozetleri** (FormBadge, MatchInspectorPanel, TeamInspectorPanel): dolu renk yerine **halka**: G → `bg-transparent text-done border border-done`; M → `bg-transparent text-form-loss border border-form-loss`.
6. **Takım marka renkleri** (`TeamBadge.tsx` gradyanları) bilerek **dokunulmadı**; takım kimliğidir.
7. **Resmi durum renkleri** (`groupStatus.ts`) dokunulmadı.

---

## 7. Kadınlar 2. Lig — ayrışan vurgu paleti

**Karar:** Kadınlar 2. Lig bölümü, Altyapı bölümünden **yalnız vurgu rengiyle** ayrışır: **orkide / mor `#D98BFF`**. Zemin, yüzeyler, çizgiler, metin, tipografi ve **tüm anlam renkleri (canlı, bitti, seçili, uyarı) aynıdır**. Eski durumda bu bölüm kırmızı-pembe (rose) idi; canlı rengiyle karıştığı için pembe/kırmızı vurgu **kaldırıldı**.

| Token | Hex | zemin | yüzey | yükseltilmiş | Not |
|---|---|---|---|---|---|
| `--primary` (bölümde) | `#D98BFF` | 8.10 | 7.14 | 6.41 | Birincil metin/ikon/çizgi |
| `--primary-hover` | `#E8B1FF` | — | 9.55 | — | Hover |
| `--primary-fg` | `#2A0B3A` | — | — | — | Orkide dolgu üstünde metin: **7.53** |
| koyu dolgu | `#9333B8` | — | — | — | Beyaz yazılı koyu dolgu: **6.17** (fuchsia-600) |
| `--rank-mid` (bölümde) | `#7FB4FF` | 8.80 | 7.76 | 6.97 | 3–8. sıra işareti **mavi** (mor birincil olduğundan) |

**Kapsam sınıfı:** `[data-section="kadinlar-2-lig"]` nitelik seçicisi. `AppShell` yeni `section?: "altyapi" | "kadinlar-2-lig"` prop'u ile kökte `data-section` yazar; yalnız `Kadinlar2LigClient` `section="kadinlar-2-lig"` verir. Bölüm içinde `bg-primary`, `text-primary`, `border-primary`, `shadow-glow-primary`, `ring-primary`, `from-primary/10` vb. otomatik orkide olur (Tailwind `primary` rengi `rgb(var(--primary-rgb) / <alpha-value>)`).

```css
[data-section="kadinlar-2-lig"] {
  --primary: #d98bff;
  --primary-rgb: 217 139 255;
  --primary-hover-rgb: 232 177 255;
  --primary-fg-rgb: 42 11 58;          /* #2A0B3A */
  --primary-soft: rgb(217 139 255 / 0.14);
  --rank-mid-rgb: 127 180 255;          /* #7FB4FF */
}
```

Uygulama notları:
- Kadınlar 2. Lig dosyalarındaki eski `text-rose-*`/`bg-rose-*` (marka amaçlı) → `text-primary`/`bg-primary` (§11.3). Gerçek canlı/hata kalır `live`.
- `TeamDetailClient`'taki fuchsia "Kadınlar 2. Ligi" rozeti ve `Left/SidebarNavigation` içindeki Kadınlar 2. Lig noktası (`bg-pink-500 animate-pulse` → `bg-fuchsia-400`, nabızsız) bölüm dışında olduğundan `fuchsia` ölçeğine (= orkide) ya da `orchid` token'ına bağlanır.
- Güncel tabandaki yeni `Kadinlar2LigClient` `<h1>` bandı (`border-purple-800/40`, `bg-pink-500 animate-pulse` nokta, `text-purple-300`, `bg-purple-950/60`) → `border-line`, nokta `bg-primary` (**nabız yok**; canlı değil), rozet `text-primary bg-primary/10 border-primary/40 font-display tabular-nums`.
- Sidebar köprü bağlantısı "TVF Altyapı Ligleri · 81 İl →" (mavi `bg-blue-950/40 border-blue-800/40 text-blue-200`, nokta `bg-blue-400`): bu bir **Altyapı'ya geçiş** olduğundan Altyapı vurgusunu (turkuaz) temsil edebilir: `bg-[#2DD4C0]/10 border-[#2DD4C0]/40 text-teal-300`, nokta `bg-teal-400` — veya seçili (mavi) token'larda bırakın. Karar: **turkuaz** (`teal-*` ölçeği hazır), çünkü bölüm içinde `primary` orkide'dir.

---

## 8. Kapsam kısıtları

### 8.1 Yapısı DEĞİŞMEYECEK sayfalar: Fikstür ve Günün Maçları
- **Yalnız renk/tipografi** değişir. DOM yapısı, kolonlar, filtre çubukları, sağ `MatchInspectorPanel`, kart/tablo görünüm anahtarı, `TodayMatchesView` / `FixtureTable` / `DateRibbon` / `FilterBar` / `CompactMatchFeed` düzeni **aynen kalır**.
- İzin verilen: sınıf adı eşlemesi (§11), kırmızı/pembe dolgu → token, sayı rozeti → sade metin, kazanan skor dolgusu → sade `text-done`, tarih şeridi BUGÜN → `bg-selected-strong`.
- Yasak: kolon ekleme/silme, sağ paneli kaldırma, sıralama/filtre mantığı değiştirme, yeni `<h1>`/başlık ekleme (güncel tabanda `TodayMatchesView` başlığı Antigravity tarafından zaten eklendi; **olduğu gibi** bırak).
- Güncel taban yapısal notları: `FixtureTable` ve `TodayMatchesView` skor hücrelerinde `font-mono font-scoreboard tabular-nums` var; `ScoreboardTypography` testi `CompactMatchRow` + `SetScoreMatrix`'i bunlara bağlar → bu sınıfları **silme**.

### 8.2 Puan Durumu — Sofascore tarzı yeniden tasarım (`StandingsTable.tsx`, `DashboardClient.tsx`)
Yalnızca **/puan-durumu** (ve DashboardClient'ın "standings" sekmesi) yapısal olarak yenilenir. Yerel uygulamada yapılan tasarım (dosya: `/workspace/volley-tracker/src/components/StandingsTable.tsx`, 902 satır; yeniden yazıldı):

**Sayfa başlığı:** `DashboardClient`'ta puan durumu sekmesinin üstünde `<h1>`: `"{Şehir} Puan Durumu · Genç & Yıldız Kızlar Süper Lig"` (şehir yoksa yalnız "Puan Durumu · …"). Başlık sınıfı: `font-display text-lg sm:text-xl font-bold text-ink`.

**Filtre çubuğu (kart: `rounded-2xl border border-line bg-surface p-3 sm:p-4`):**
1. İl seçici (açılır liste korunur; MapPin ikonu `text-ink-2`, seçili il noktası `bg-primary`, seçili satır `bg-primary/20 text-primary border-primary/40`).
2. **Kategori = segmented kontrol:** kapsayıcı `inline-flex rounded-xl border border-line bg-canvas p-0.5`; düğmeler `rounded-[10px] px-3 py-1.5 text-xs font-semibold`; **seçili `bg-primary text-primary-fg font-bold shadow-glow-primary`**, pasif `text-ink-2 hover:text-ink`; `aria-pressed`.
3. **Lig segmenti** (birden çok lig varsa): aynı kapsayıcı, seçili `bg-surface-raised text-ink`.
4. **Grup sekmeleri:** `role="tablist"`, alt çizgi stili: kapsayıcı `border-b border-line`; sekme `-mb-px border-b-2 px-3 py-2 text-xs font-semibold`; seçili `border-selected text-selected-text` (mavi), pasif `border-transparent text-ink-2 hover:text-ink`; `aria-current`.

**Tablo kartı (`rounded-2xl border border-line bg-surface shadow-card`):**
- Başlık şeridi: Trophy ikonu `text-warn`; `<h2>` `"{İL} • {LİG} • {GRUP} - PUAN DURUMU"` (testler `h2` metnine bağlı: **koru**); sağda `CSV İndir` düğmesi (`border-line bg-surface-raised text-ink-2`) ve `"{n} Takım"`.
- `<table table-fixed>` kolonları: **# | Takım | O | G | M | Set (yalnız `sm:`+) | Puan | Form**; `<caption class="sr-only">`; **sticky `<th>`**: `sticky top-[var(--app-header-h,0px)] z-20 bg-surface shadow-[0_1px_0_var(--line)]` (başlık yüksekliği `AppShell`'in yayınladığı `--app-header-h` değişkeninden).
- Satır: `border-t border-line/70`, `py-2.5`, hover `bg-surface-raised/70`, açıkken `bg-surface-raised`; tıklanabilir (`cursor-pointer`, bağlantılara tıklama satırı açmaz).
- **Sıra işareti:** sol kenarda 3 px dikey çubuk + sıra numarası. 1–2: `bg-primary` / `text-primary` ("Final Etabı"); 3–8: `bg-rank-mid` / `text-rank-mid` ("Klasman"); 9+: şeffaf / `text-ink-2`.
- Takım: logo + `TeamVolleyboxLink` (ilk 4 `font-bold`), sağda `ChevronRight` düğmesi (`aria-expanded`, `aria-label="{takım} takımını incele"`, açıkken 90° döner).
- Sayılar `font-display font-scoreboard tabular-nums` (O `text-ink-2`, G/M `text-ink`, Set `text-ink-2`, **Puan `text-sm font-bold text-ink`**).
- **Form:** `FormDots` — 5 halka (18 px); G: `border-done text-done` ("G"), M: `border-form-loss text-form-loss` ("M"), oynanmamış: `border border-dashed border-line`; `role="img"` + `aria-label="Son N maç: G M …"`.
- **Satır içi detay** (tıklayınca altında `<tr data-detail-for>` açılır, `bg-surface-raised`, solda 3 px `bg-primary` çubuk): Set oranı, Sayı oranı, Set (aldığı-verdiği), Sayı (aldığı-verdiği), **Son maç**, **Sıradaki maç**. `onSelectTeam` açılırken çağrılır (geri uyum).
- **Veri:** `summarizeTeam(row, ctx, matches)` — formu **maç verisinden** (son 5 `finished` + skorlu) türetir; maç eşleşmezse TVF puan tablosundaki `form` alanına (repo verisinde 0–2 maçlık; `data/fixtures.json` 128 satırda uzunluk dağılımı: 0→48, 1→39, 2→41) düşer; o da boşsa kesik halka + açıklama notu. Yeni opsiyonel prop `matches?: Match[]` (DashboardClient `data?.matches` verir).
- **Alt açıklama:** sol: `▌1-2: Final Etabı (Play-Off)` (primary çubuk), `▌3-8: Klasman Etabı` (rank-mid çubuk), `9+: Normal Sezon`; sağ: `Form: (G) (M) (kesik) oynanmadı`; veri eksikse `text-ink-3` bir not.
- **Sağ panel puan durumunda KALDIRILDI:** `DashboardClient`'ta puan durumunda `rightSidebar` undefined; `TeamInspectorPanel` dynamic import'u ve `selectedStandingTeam` state'i silindi (bileşen dosyası kalır, kullanılmaz). Tüm genişlik tabloya gider.
- Eski ▲▼ "trend" metni ve gradyan/emerald-amber legend kutuları kalktı.

**Güncel tabanla uyum (önemli):**
- `ScoreboardTypography.test.tsx` StandingsTable için `ones.forEach(el => toHaveClass("font-scoreboard"), toHaveClass("tabular-nums"))` ve puan hücresi için aynısını bekliyor → yeni tabloda **sıra numarası `<span>`'ı, O/G/M hücreleri ve Puan hücresi** `font-scoreboard tabular-nums` taşımalı. (Yerel kodda yalnızca `font-display tabular-nums` vardı; yeni tabanda test için bunlar eklenip **63/63 dosya, 416/416 test** geçti. Eklenecek yerler: sıra `<span>`, `row.played`, `row.won`, `row.lost`, `row.points` hücreleri.)
- Test `getAllByText("1")` ile **tüm** "1" metinlerini yakalar: `Set` sütunu `"{sets_won}-{sets_lost}"` birleşik tek metin olduğundan çakışmaz; ayrı `<span>` ile "1" üretme.
- `DashboardClient` (güncel): `StandingsTable` ilk açılışta `loading` iskeletinden sonra gelir; `matches={data?.matches || []}` geçirirken **kısmi veri** (yalnız ana sayfada) form türetimini bozmaz; `/puan-durumu` tam veriyle gelir (`getInitialFixtures`).
- Ana sayfada (`getInitialHomeFixtures`) standings yalnız liderleri içerir; bu yüzden **HomePortalView "Grup Liderleri" widget'ı** tam tablo değildir (dokunma).

---

## 9. Uygulama planı (sırayla) ve kod örnekleri

Sıra: **(1)** `tailwind.config.ts` → **(2)** `globals.css` → **(3)** `layout.tsx` (font) → **(4)** `ThemeTokens.ts` + `AppShell.tsx` → **(5)** otomatik hex taşıma (Ek C) → **(6)** elle anlam düzeltmeleri (§11) → **(7)** PWA/ikon → **(8)** Puan Durumu → **(9)** testler → **(10)** doğrulama (§14).

### 9.1 `tailwind.config.ts` (tam iskelet; tüm ölçekler §4.4'te)
```ts
import type { Config } from "tailwindcss";

const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Anlamsal token'lar ----
        canvas: "#07131F",
        background: "#07131F",
        surface: { DEFAULT: "#0E2033", muted: "#0A1A2B", raised: "#13293F" },
        panel: "#0E2033",
        "panel-inset": "#0A1A2B",
        line: "#1B3550",
        border: "#1B3550",
        "border-dark": "#16293F",
        ink: { DEFAULT: "#EAF6FA", 2: "#A9C3D1", 3: "#8CA8B8" },
        primary: {
          DEFAULT: withAlpha("--primary-rgb"),
          hover: withAlpha("--primary-hover-rgb"),
          fg: withAlpha("--primary-fg-rgb"),
          light: "#CAF4EF",
        },
        live: "#FF6E82",
        "live-fg": "#2B0A10",
        orchid: "#D98BFF",
        "form-loss": "#FF8FA0",
        done: "#9BE15D",
        "done-fg": "#0B2A05",
        warn: "#FFC24D",
        selected: { DEFAULT: "#5B9DFF", strong: "#2A63BD", text: "#7FB4FF" },
        "rank-mid": withAlpha("--rank-mid-rgb"),
        navy: { DEFAULT: "#EAF6FA", light: "#C7DAE4", muted: "#A9C3D1" },

        // ---- Varsayılan paletlerin yeniden bağlanması (ölçekler §4.4) ----
        slate:   { /* "50":"#F2FAFC", … "600":"#6F8EA3", "700":"#2A4560", "800":"#1B3550", "900":"#0E2033", "950":"#07131F" */ },
        red:     { /* coral ölçeği */ }, rose: { /* coral */ }, pink: { /* coral */ },
        emerald: { /* green */ }, green: { /* green */ }, lime: { /* green */ },
        amber:   { /* amber */ }, yellow: { /* amber */ }, orange: { /* amber */ },
        blue:    { /* blue */ },  sky: { /* blue */ },   cyan: { /* blue */ }, indigo: { /* blue */ },
        teal:    { /* teal */ },
        purple:  { /* purple */ }, violet: { /* purple */ },
        fuchsia: { /* orkide ölçeği */ },
      },
      boxShadow: {
        "glow-red": "0 0 20px -3px rgba(255, 110, 130, 0.40)",
        "glow-amber": "0 0 20px -3px rgba(255, 194, 77, 0.40)",
        "glow-emerald": "0 0 20px -3px rgba(155, 225, 93, 0.35)",
        "glow-sky": "0 0 20px -3px rgba(91, 157, 255, 0.40)",
        "glow-primary": "0 0 20px -3px rgb(var(--primary-rgb) / 0.40)",
        "glow-selected": "0 0 18px -4px rgba(91, 157, 255, 0.45)",
        card: "0 8px 30px -4px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 14px 36px -4px rgba(0, 0, 0, 0.6)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
        display: ["var(--font-space-grotesk)", "'Space Grotesk'", "var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "'Space Grotesk'", "var(--font-manrope)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```
> Mevcut `tailwind.config.ts`'te **korunacak** diğer `extend` anahtarları (animasyon/keyframes, `screens` vb.) varsa silme; yukarıdaki `colors/boxShadow/fontFamily` bloklarını **birleştir**. Yerel çalışan dosya: `/workspace/volley-tracker/tailwind.config.ts` (tam ölçek değerleriyle, 300+ satır) — doğrudan kopyalanabilir; yeni tabanda `tailwind.config.ts` çakışmasız uygulandı.
> Tailwind sınıfı `text-primary-fg` için `colors.primary.fg` yeterlidir; `globals.css`'teki `.text-primary-fg` yardımcı sınıfı da aynı amaçla var (opsiyonel yedek).

### 9.2 `src/app/globals.css`
```css
@tailwind base; @tailwind components; @tailwind utilities;

:root {
  --canvas: #07131f; --surface: #0e2033; --surface-muted: #0a1a2b; --surface-raised: #13293f; --line: #1b3550;
  --ink: #eaf6fa; --ink-2: #a9c3d1; --ink-3: #8ca8b8;
  --live: #ff6e82; --done: #9be15d; --selected: #5b9dff; --selected-strong: #2a63bd; --selected-text: #7fb4ff; --warn: #ffc24d;
  --primary: #2dd4c0; --primary-rgb: 45 212 192; --primary-hover-rgb: 94 234 212; --primary-fg-rgb: 3 35 32;
  --primary-soft: rgb(45 212 192 / 0.14);
  --rank-mid-rgb: 183 155 255;
  /* geri uyumluluk */
  --background: var(--canvas); --border: var(--line); --text-main: var(--ink); --text-muted: var(--ink-2);
  --font-body: var(--font-manrope), "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-space-grotesk), "Space Grotesk", var(--font-manrope), system-ui, sans-serif;
}
[data-section="kadinlar-2-lig"] { /* §7 */ }

html, body, button, input, select, textarea { font-family: var(--font-body); }
h1, h2, h3, .font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
.tabular, .font-mono, .font-scoreboard { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }

body { background-color: var(--canvas); color: var(--ink); -webkit-font-smoothing: antialiased; }
/* ESKİ: background-image: radial-gradient(… rgba(225,29,72,.08) …) ve background-attachment: fixed → SİL */

@layer utilities {
  .glass-panel { background: rgb(14 32 51 / .78); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.08); }
  .glass-card  { background: rgb(14 32 51 / .62); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.07); transition: all .2s cubic-bezier(.4,0,.2,1); }
  .glass-card:hover { background: rgb(19 41 63 / .88); border-color: rgb(var(--primary-rgb) / .35); box-shadow: 0 10px 25px -5px rgba(0,0,0,.45); }
  .match-strip { background: rgb(14 32 51 / .62); border: 1px solid rgba(255,255,255,.06); transition: all .15s ease-out; }
  .match-strip:hover { background: rgb(19 41 63 / .88); border-color: rgb(var(--primary-rgb) / .40); }
  .card-clean { background: rgb(14 32 51 / .68); border: 1px solid rgba(255,255,255,.07); border-radius: 1rem; }
  .text-glow-red   { text-shadow: 0 0 12px rgba(255,110,130,.50); }
  .text-glow-amber { text-shadow: 0 0 12px rgba(255,194,77,.50); }
  .text-glow-emerald { text-shadow: 0 0 12px rgba(155,225,93,.45); }
  /* GÜNCEL TABANDA .font-scoreboard monospace; Space Grotesk'e çevir: */
  .font-scoreboard { font-family: var(--font-display); letter-spacing: -0.02em; }
  .text-primary-fg { color: rgb(var(--primary-fg-rgb)); }
  .bg-primary-soft { background: var(--primary-soft); }
  .bg-selected-fill { background: var(--selected-strong); color: #fff; }
  .focus-ring:focus-visible { outline: 2px solid rgb(var(--primary-rgb)); outline-offset: 2px; }
  .ambient-glow-red { box-shadow: 0 0 35px -8px rgba(255,110,130,.30); }
  .ambient-glow-emerald { box-shadow: 0 0 35px -8px rgba(155,225,93,.30); }
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--line); }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--selected); }
}
::-webkit-scrollbar-track { background: var(--canvas); }
::-webkit-scrollbar-thumb { background: var(--line); }
/* Museo Sans @font-face blokları → SİL. Print stilleri → DOKUNMA. */
```
Kritik: `.font-scoreboard` kuralını Space Grotesk yapmak `ScoreboardTypography.test.tsx`'i bozmaz (testler yalnız sınıf adını arar).

### 9.3 `src/app/layout.tsx` (next/font + tema meta; mevcut OG/Twitter blokları KORUNUR)
```tsx
import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],          // latin-ext = Türkçe ğ ş ı İ ö ü ç
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#07131F", width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  /* … title/description/metadataBase/manifest/openGraph/twitter AYNEN KORU … */
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Altyapı Voleybol" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      {/* <head> içindeki museo-sans preload <link>'leri SİLİNDİ */}
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-selected-strong selection:text-white">
        {children}
        {/* Script/Analytics/ServiceWorkerRegister aynen */}
      </body>
    </html>
  );
}
```
Not: `next.config` CSP `font-src 'self' data:` — `next/font/google` derleme zamanında fontları kendi origin'inden sunar (self-host), ek CSP değişikliği gerekmez; yine de build sonrası ağ sekmesinde `fonts.gstatic.com` isteği olmadığını doğrula.

### 9.4 `ThemeTokens.ts` ve `AppShell.tsx`
```ts
// src/components/layout/ThemeTokens.ts
export const ThemeTokens = { background: "#07131F", panel: "#0E2033", border: "#1B3550" } as const;
```
`AppShell.tsx` — **güncel tabandaki** `headerHeight` state'i ve `sidebarStyle` korunur; üstüne: (a) `section` prop → `data-section`, (b) aynı `ResizeObserver` içinde `--app-header-h` yayınla, (c) kök sınıfları tokenlaştır:
```tsx
export interface AppShellProps { /* … */ section?: "altyapi" | "kadinlar-2-lig"; }

export const AppShell: React.FC<AppShellProps> = ({ header, leftSidebar, children, rightSidebar, footer, className = "", section = "altyapi" }) => {
  const [headerHeight, setHeaderHeight] = React.useState(64);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = headerRef.current, root = rootRef.current;
    if (!el) return;
    const apply = () => {
      setHeaderHeight(el.offsetHeight);
      root?.style.setProperty("--app-header-h", `${el.offsetHeight}px`);   // sticky <th> için
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-section={section}
      className={`min-h-screen flex flex-col bg-[var(--portal-background)] text-ink font-sans antialiased selection:bg-selected-strong selection:text-white ${className}`}
      style={{ "--portal-background": ThemeTokens.background, "--portal-panel": ThemeTokens.panel, "--portal-border": ThemeTokens.border } as React.CSSProperties}
    >
      {/* header / grid / aside'lar güncel tabandaki gibi (aside style={sidebarStyle}); aside sınıfları bg-[var(--portal-panel)] border-[var(--portal-border)] KALIR */}
    </div>
  );
};
```
`Kadinlar2LigClient.tsx`: `<AppShell … section="kadinlar-2-lig">`. **Dikkat:** `data-section` yalnız `AppShell` kökünde olduğundan, `createPortal` ile `document.body`'ye çıkan öğeler (varsa) bölge değişkenlerini **görmez** (§12.4).

### 9.5 PWA ve ikonlar
- `public/manifest.json`: `"background_color": "#07131F"`, `"theme_color": "#07131F"`.
- `public/sw.js`: `CACHE_NAME = "altyapi-voleybol-v4"` (sürüm artır), önbellek listesinden museo font girişlerini çıkar.
- `public/icon.svg`, `src/app/apple-icon.svg`: zemin `#dc2626` → `#2DD4C0`, top çizgileri → `#07131F`. `src/app/icon.svg`: kırmızı/amber gradyanlar → turkuaz/mavi (`#2DD4C0`, `#5B9DFF`, `#7FB4FF`, `#2A63BD`; zemin `#07131F/#0E2033`).
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: yeniden üret (turkuaz zemin; maskable için içerik **%80 güvenli alan** içinde). Yerelde headless Chrome ile SVG'den üretildi; ikili dosyalar `git apply` ile taşınamaz — yeniden üretilmeli.

### 9.6 Otomatik sabit-hex taşıma (Ek C) — özet kuralları
Önce betik (güvenli, regex), sonra elle gözden geçirme. Eşlemeler (non-text önek → token | text önek → token):

| Eski hex | `bg/border/from/via/to/divide/ring/fill/stroke` → | `text-` → |
|---|---|---|
| `#050810 #070b14 #070d19 #080c14 #080f24 #090d16 #0a1226 #0b1220 #121212 #12141a #1e1b4b #0f172a #020617` | `canvas` | `canvas` |
| `#0b1325 #0c1630 #0d1424 #0d1628 #0d172a #0e1627 #181a20` | `surface-muted` | `surface-muted` |
| `#1e222d #1e293b #121f3d #162342 #172547 #18233c #1b2a4d #1b2b52 #242936 #252a38` | `panel` | `panel` |
| `#2a2e3d #334155 #374151 #475569` | `line` | `line` |
| `#94a3b8` | `slate-400` | **`ink-2`** |
| `#64748b` | `slate-600` | **`ink-3`** |
| `#f1f5f9 #f8fafc` | `ink` | `ink` |
| `#cbd5e1 #e2e8f0` | `slate-200` | `slate-200` |
| `#ef4444 #dc2626` | `live` | `live` |
| `#f59e0b #fbbf24` | `warn` | `warn` |
| `#3b82f6` | `selected` | `selected` |
| `#38bdf8` | `blue-400` | `blue-400` |
| `#1f497d` (GroupStatusView) | `selected-strong` (elle) | — |
Opaklık eki (`/30` vb.) korunur. `__tests__` klasörleri **dışlanır** (testleri elle güncelle §13). `groupStatus.ts` ve satır içi SVG/canvas hex'leri betik kapsamı dışıdır.

Güncel tabanda sayım: `[#2a2e3d]`103, `[#94a3b8]`102, `[#1e222d]`67, `[#181a20]`51, `[#f1f5f9]`20, `[#0b1325]`20, `[#cbd5e1]`14, `[#0f172a]`14, `[#121212]`13, `[#ef4444]`6, `[#1e293b]`6, `[#0d1424]`5 … (toplam ≈ 460 sınıf / 39 dosya). Yerel uygulamada 36 dosyada ~456 sınıf dönüştürüldü.

### 9.7 Anlam düzeltmeleri (betiğin yapamadığı, elle)
Kırmızı/pembe/rose/red ve zümrüt/mavi dekoratif sınıfları §11 tablolarına göre tek tek token'a taşı. Yardımcı arama: `rg -n "(red|rose|pink)-[0-9]+|from-red|to-rose|shadow-glow-red|bg-gradient-to-" src --glob '!**/__tests__/**'`. Her eşleşme için "bu öğe gerçekten CANLI/HATA mı?" sorusunu sor: evet → `live` (veya `rose/red` ölçeği olduğu gibi kalabilir); hayır → `primary`/`ink-2`/`selected`.

### 9.8 Puan Durumu
Bkz. §8.2. İskelet kod (tam kaynak yerelde `/workspace/volley-tracker/src/components/StandingsTable.tsx`):
```tsx
export type FormResult = "W" | "L";
interface TeamMatchSummary { form: FormResult[]; formSource: "matches"|"standings"|"none"; last: Match|null; next: Match|null; }

export function summarizeTeam(row: StandingItem, ctx: {city:string; leagueName:string; groupName:string}|null, matches?: Match[]): TeamMatchSummary {
  const fallback = (row.form || []).slice(-5);
  const empty = { form: fallback, formSource: fallback.length ? "standings" : "none", last: null, next: null } as TeamMatchSummary;
  if (!matches?.length) return empty;
  const name = trLower(row.team.trim());
  const mine = matches.filter(m => /* takım adı (home/away) + şehir + lig + grup eşleşmesi: trLower/trIncludes/formatGroupName */);
  if (!mine.length) return empty;
  const key = (m: Match) => `${m.date} ${m.time || ""}`;
  const finished = mine.filter(m => m.status === "finished" && hasScore(m)).sort((a,b)=>key(a).localeCompare(key(b)));
  const upcoming = mine.filter(m => m.status === "upcoming" || m.status === "live").sort((a,b)=>key(a).localeCompare(key(b)));
  const form = finished.slice(-5).map(m => { /* isHome → ben-onlar skoru */ return mine > theirs ? "W" : "L"; });
  return { form: form.length ? form : fallback, formSource: form.length ? "matches" : fallback.length ? "standings" : "none",
           last: finished.at(-1) ?? null, next: upcoming[0] ?? null };
}

export const FormDots = ({ form, source }: { form: FormResult[]; source?: TeamMatchSummary["formSource"] }) => {
  const padded: (FormResult|null)[] = [...form.slice(-5)]; while (padded.length < 5) padded.push(null);
  return (
    <div className="flex items-center justify-center gap-1" role="img"
         aria-label={form.length ? `Son ${form.length} maç: ${form.map(f => f==="W"?"G":"M").join(" ")}` : "Form verisi yok"}
         title={source === "standings" ? "Form: TVF puan tablosundan (yalnız oynanan maçlar)" : undefined}>
      {padded.map((f,i)=> f===null
        ? <span key={i} className="h-[18px] w-[18px] rounded-full border border-dashed border-line" aria-hidden="true" />
        : <span key={i} aria-hidden="true"
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] font-display text-[9px] font-bold leading-none ${f==="W" ? "border-done text-done" : "border-form-loss text-form-loss"}`}>
            {f==="W" ? "G" : "M"}
          </span>)}
    </div>
  );
};
```
Satır/ detay JSX'i §8.2'deki sınıf listesiyle; `ScoreboardTypography` için sayı hücrelerine `font-scoreboard` eklemeyi unutma.

---

## 10. Sayfa-sayfa hedef görünüm ve dosya haritası

Ortak: zemin `canvas`, kartlar `surface` + `border-line` + `rounded-2xl`, metin `ink/ink-2`, başlıklar Space Grotesk, rakamlar tabular, birincil düğme turkuaz, seçili durum mavi, canlı mercan. Üst başlık (`Header.tsx`, `AppShell` header) `bg-canvas/90` + `backdrop-blur`, alt çizgi `border-line`.

| # | Sayfa / rota | Dosyalar | Hedef görünüm | Yapı değişir mi? |
|---|---|---|---|---|
| 1 | **Ana sayfa** `/`, `/[city]` | `HomePortalView.tsx`, `DashboardClient.tsx`, `Header.tsx`, `CityTabBar.tsx`, `FeaturedMatchHero.tsx`, `PrimaryTeamWidget.tsx`, `layout/Left/RightSidebarPlaceholder.tsx`, `SidebarNavigation.tsx` | `<h1>` "Canlı Maç Merkezi & TVF Altyapı Bülteni": nokta `bg-done` (güncel tabanda `bg-emerald-500 animate-pulse`; nabız yalnız gerçekten canlı maç varken kalsın), sayaç `text-ink-2 font-display tabular-nums`. Filtre hapları: seçili "Tümü/Bugün" `bg-selected-strong text-white`, "Bitenler" `bg-done text-done-fg`, "Fikstür" `bg-selected-strong`; pasif `bg-surface-raised text-ink-2`. Şehir hızlı seçim seçili `bg-primary/20 text-primary border-primary/40`. Hero `bg-surface-raised border-line`, canlı rozet `live`, "Maç Merkezi" düğmesi `bg-primary text-primary-fg shadow-glow-primary`. Alt iki kolon widget (Grup Liderleri `warn` kupa). | Hayır (yalnız renk) |
| 2 | **Sonuçlar** `/sonuclar[/city]` | `DashboardClient.tsx` (results), `DateRibbon.tsx`, `FilterBar.tsx`, `FixtureTable.tsx`, `FormBadge`, `MatchCenterDrawer` | Tarih şeridi seçili `bg-selected-strong shadow-glow-selected`; "TÜMÜ" pasif `glass-panel text-ink-2`; yeşil (emerald) temalı şerit `done` ile kalabilir. Kazanan skor `text-done font-black` (dolgu yok). | Hayır |
| 3 | **Günün Maçları** `/gunun-maclari[/city]` | `TodayMatchesView.tsx`, `DashboardClient.tsx`, `match/*`, `MatchInspectorPanel`, `RightSidebarPlaceholder` | Kart/Tablo anahtarı seçili `bg-selected-strong`; BUGÜN şerit düğmesi `bg-selected-strong` (**mavi**, turkuaz değil). CANLI rozeti `bg-live/15 text-live border-live/50` (+ nabız). Kazanan skor `text-done`. Saat rozeti (sky) ölçek bağlı, sınıf aynı. Sağ panel kalır. | **Hayır** (§8.1) |
| 4 | **Fikstür** `/fikstur[/city]` | `FixtureTable.tsx`, `FilterBar.tsx`, `DateRibbon.tsx`, `CompactMatchFeed/Row`, `FeaturedMatchHero` | `FilterBar` durum sekmeleri `bg-selected-strong font-bold shadow-glow-selected`; birincil "Filtreleri Sıfırla" `bg-primary text-primary-fg`. Saat/salon farkı (discrepancy) `warn` kalır. Favori yıldız `warn`. | **Hayır** (§8.1) |
| 5 | **Puan Durumu** `/puan-durumu[/city]` | `StandingsTable.tsx`, `DashboardClient.tsx` | §8.2 (yeniden tasarım). | **Evet** (yalnız burada) |
| 6 | **Grup Durumu** `/grup-durumu[/city]` | `GroupStatusView.tsx`, `utils/groupStatus.ts` | `<h1>` korunur. Resmi durum renkleri (`groupStatus.ts`) **aynen**; `#1f497d` → `selected-strong`; il sayacı sade metin; birincil düğme `bg-primary text-primary-fg`. | Hayır |
| 7 | **Lig Hub** `/lig/[...slug]` | `league/LeagueHubClient.tsx` (1060 satır; `dynamic` MatchCenterDrawer + SpotlightSearchModal) | Kök `bg-canvas`, hero `from-surface-muted via-canvas to-canvas`; sekmeler seçili `bg-selected-strong font-bold shadow-glow-selected`; `selection:bg-primary/30`; "tamamlandı" yeşil `bg-done text-done-fg`. | Hayır |
| 8 | **Takım detayı** `/takim/[slug]` | `app/takim/[slug]/page.tsx`, `TeamDetailClient.tsx`, `TeamRosterView.tsx`, `VolleyballCourtView.tsx`, `TeamBadge.tsx`, `FormBadge.tsx` | Başlık gradyanı `from-primary/10 to-canvas/60`; sekmeler seçili mavi; form rozetleri halka; kort `#0E2F4D, #0A2038, #07131F`, libero `warn`, seçili oyuncu mavi; grafik stroke `#1B3550`, `#9BE15D`. Kadınlar 2. Lig rozeti fuchsia (= orkide). | Hayır |
| 9 | **Karşılaştır** `/karsilastir` | `karsilastir/CompareClient.tsx`, `page.tsx` | Gradyan `from-canvas via-surface-muted to-panel`; grafik: A takımı `#2DD4C0`, B takımı `#7FB4FF`, eksen `#A9C3D1`, ızgara `#1B3550`/`#2A4560`; kaybeden `text-form-loss`. | Hayır |
| 10 | **Kadınlar 2. Lig** `/kadinlar-2-ligi[/…]` | `kadinlar-2-lig/*` (14 dosya), `Kadinlar2LigClient.tsx`, `AppShell section` | §7. Seçili sekme `bg-selected-strong`; birincil eylemler `bg-primary` (orkide); hero `from-primary/10`; mobil nav aktif `text-primary`. | Hayır |
| 11 | **Admin** `/admin` | `app/admin/page.tsx` (1920 satır) | Sekmeler seçili `bg-selected-strong`; birincil `bg-primary text-primary-fg`; başarı `bg-done`. Hata kutuları yerelde birincil'e kaydı; öneri: hata için `bg-live/10 border-live/40 text-live`. Auth gerektirir, görsel test edilemedi. | Hayır |
| 12 | **Global** | `PwaInstallPrompt`, `NotificationBanner`, `SpotlightSearchModal`, `MatchCenterDrawer`, `SocialStoryModal`, `MobileBottomNav`, `MobileMatchDrawer`, `BrandLogo`, `common/SkeletonLoaders.tsx` | §11.6, §12. | Hayır |

Ekran görüntüleri (yerel build, 1440 px, **eski tabana ait**): `/workspace/volley-theme/gercek-puan-durumu.png`, `gercek-gunun-maclari.png`, `gercek-fikstur.png`, `gercek-kadinlar-2-lig.png`. Gözlem: Günün Maçları görüntüsünde BUGÜN düğmesi turkuaz görünüyordu; görüntü DateRibbon `bg-selected-strong` düzeltmesinden önce alınmış olabilir. Yeni uygulamada doğrula (hedef: mavi).

---

## 11. Bileşen-bileşen eşleme tabloları

### 11.1 Ortak çeviri sözlüğü (her dosyada aynı kural)
| Eski (sınıf) | Yeni | Koşul |
|---|---|---|
| `bg-[#121212]` `bg-[#0f172a]` `bg-[#080c14]` `bg-[#070b14]` `bg-[#020617]` | `bg-canvas` | sayfa/iç zemin |
| `bg-[#181A20]` `bg-[#0b1325]` `bg-[#0d1424]` | `bg-surface-muted` | iç içe alan |
| `bg-[#1E222D]` `bg-[#1e293b]` | `bg-panel` | kart/yan çubuk |
| `border-[#2A2E3D]` `border-slate-700/800` | `border-line` (slate-800 zaten `#1B3550`) | ayırıcı |
| `text-[#94A3B8]` | `text-ink-2` | |
| `text-[#64748B]` (eski) | `text-ink-3` | küçük ipucu (≥ 6.6:1) |
| `text-[#F1F5F9]` | `text-ink` | |
| `text-[#CBD5E1]` | `text-slate-200` | |
| `text-[#EF4444]` `bg-[#EF4444]` | `text-live` `bg-live` | yalnız canlı |
| `bg-gradient-to-r from-red-600 to-rose-600 (hover:from-red-500 …) text-white shadow-glow-red` | birincil eylem: `bg-primary text-primary-fg shadow-glow-primary`; seçili sekme: `bg-selected-strong text-white font-bold shadow-glow-selected`; kazanan skor: `text-done font-black`; nötr: `bg-surface-raised border border-line` | bağlama göre |
| `text-rose-400/300`, `text-red-400/300`, `text-pink-400` (dekoratif ikon/etiket) | `text-ink-2` (etiket/ikon) veya `text-primary` (vurgu) | canlı değilse |
| `bg-rose-500/10..20`, `border-rose-500/30..40`, `bg-red-950/*` (dekoratif) | `bg-primary/10..20`, `border-primary/30..40` (vurgu) veya `bg-surface-raised border-line` (nötr) | |
| `bg-emerald-600 text-white` | `bg-done text-done-fg` | |
| `bg-blue-600 text-white` / `bg-primary` seçili sekme | `bg-selected-strong text-white` | |
| sayı rozeti `px-1.5 py-0.5 rounded-full bg-… text-white font-mono` | `font-display font-semibold tabular-nums text-ink-2` | |
| `animate-pulse` dekoratif nokta | kaldır | yalnız canlı için |

### 11.2 Çekirdek / paylaşılan dosyalar
| Dosya | Eski → Yeni (özet; ayrıntı Ek B) |
|---|---|
| `tailwind.config.ts` | Baştan yaz (§9.1). |
| `src/app/globals.css` | §9.2. Museo `@font-face` sil; body `#121212` + kırmızı radial gradyan sil → `var(--canvas)`; glass/card renkleri; scrollbar; `.font-scoreboard` (monospace → Space Grotesk). |
| `src/app/layout.tsx` | §9.3. `<head>` preload ×3 sil; `statusBarStyle:"default"` → `"black-translucent"`; `viewport.themeColor`; `<body>` `bg-[#121212] text-[#F1F5F9] … selection:bg-blue-600` → `bg-canvas text-ink … selection:bg-selected-strong`. |
| `layout/ThemeTokens.ts` | `#121212 → #07131F`, `#1E222D → #0E2033`, `#2A2E3D → #1B3550`. |
| `layout/AppShell.tsx` | `text-[#F1F5F9] → text-ink`, `selection:bg-blue-600 → bg-selected-strong`; `section` prop; `--app-header-h`. |
| `public/manifest.json`, `public/sw.js`, `public/icon.svg`, `src/app/icon.svg`, `src/app/apple-icon.svg`, `public/icons/*.png` | §9.5. |
| `common/SkeletonLoaders.tsx` (**yeni, güncel tabanda**) | `bg-[#181A20] → bg-surface-muted`, `bg-[#1E222D] → bg-panel`, `border-[#2A2E3D](/40,/50) → border-line(/40,/50)`, `divide-[#2A2E3D]/50 → divide-line/50`; iskelet çubukları `bg-slate-800/60`, `bg-slate-700/60` ölçek bağlı olduğundan otomatik uyar (slate-800 `#1B3550`, slate-700 `#2A4560`); `bg-sky-900/40 → bg-blue-900/40`, `bg-emerald-500/40 → bg-done/40`; satır içi `#2A2E3D` (1×) → `#1B3550`. İskelet kartları gerçek kartlarla aynı yüzey/çizgi renklerini kullanmalı (yükleme → gerçek geçişinde renk sıçramasın). |

### 11.3 Sayfa bileşenleri (özet; adetler Ek B)
| Dosya | Önemli eşlemeler |
|---|---|
| `Header.tsx` | `from-red-950/30 → from-primary/10` ×6, `bg-[#080c14]/90 → bg-canvas/90`; sayaç rozetleri (`bg-rose-700/bg-red-700 text-white … font-mono`) → `font-display font-semibold tabular-nums text-ink-2`; "Bugün" `bg-emerald-500 text-white` → `bg-done text-done-fg`. Aktif sekme sınıfı `border-primary text-white` **KALIR** (`Header.test`). |
| `CityTabBar.tsx` | seçili şehir: kırmızı gradyan → `bg-primary text-primary-fg font-bold shadow-glow-primary`; sayı rozeti → sade metin. |
| `CitySelector.tsx` | `bg-[#0b1325] → bg-surface-muted`, `bg-[#0f172a] → bg-canvas`, `text-primary → text-ink-2`, `bg-emerald-600 … rounded-full` sayaç → sade; seçili satır `text-white → text-primary-fg`. |
| `FilterBar.tsx` | birincil gradyan + `ring-2 ring-red-500/30` → `bg-primary text-primary-fg shadow-glow-primary`; durum sekmesi gradyanı → `bg-selected-strong shadow-glow-selected`; sayı rozeti `min-w-5 h-5 … bg-primary text-white` → `text-[11px] font-display tabular-nums text-primary`; `focus:border-red-500 → focus:border-primary/40`. |
| `DateRibbon.tsx` | seçili gün ×3 gradyan → `bg-selected-strong text-white font-bold shadow-glow-selected`; `text-rose-400 → text-ink-2`. |
| `FeaturedMatchHero.tsx` | `border-red-500/25 → border-primary/25`, `via-[#0b1220]/95 → via-canvas/95`, canlı stroke `#ef4444 → #FF6E82`; ikon kapsülü → `bg-surface-raised border-line`; "Detay" → `bg-primary text-primary-fg shadow-glow-primary`; `font-mono font-scoreboard tabular-nums` **kalır**. |
| `FixtureTable.tsx` | kazanan skor rozeti (kırmızı gradyan, 3×) → `text-done font-black`; salon rozeti `bg-red-950/40 text-red-200 border-red-800/50` → `bg-surface-raised text-ink-2 border-line`; ev seti `bg-rose-950/50 text-rose-200 border-rose-800/60` → `bg-surface-raised text-ink-2 border-line`; `bg-red-600 text-white → bg-primary text-primary-fg` ×2; `hover:text-primary → hover:text-ink`; `font-scoreboard tabular-nums` ve `min-w-[36px]` **kalır**. |
| `TodayMatchesView.tsx` | Kart/Tablo anahtarı seçili gradyan ×2 → `bg-selected-strong shadow-glow-selected`; kazanan skor gradyan ×2 → `text-done`; `bg-red-600 text-white → bg-primary text-primary-fg` ×2; `group-hover/hall:decoration-red-400 → decoration-primary`; `bg-black/40 text-amber-300 px-1 rounded-full font-mono → text-warn font-display tabular-nums`; `<h1>` + `<p>` yapısı **kalır**. |
| `HomePortalView.tsx` | filtre hapı seçili `bg-rose-600 text-white shadow-sm` ×2 → `bg-selected-strong text-white font-bold shadow-glow-selected`; Bitenler `bg-emerald-600` → `bg-done text-done-fg`; Fikstür `bg-sky-600` → `bg-selected-strong`; şehir hızlı seçim `bg-rose-500/20 text-rose-300 border-rose-500/40` → `bg-primary/20 text-primary border-primary/40`; sayaç rozetleri (`px-1.5 py-0.2 rounded-full bg-black/30 font-mono`) → `font-display font-semibold tabular-nums text-ink-2 opacity-90`; `text-rose-400` ×7 → `text-ink-2`; `to-[#0e1627] → to-surface-muted`; `bg-[#0f172a]/70 → bg-canvas/70`; `hover:bg-[#18233c] → hover:bg-panel`; yeni `<h1>` noktası `bg-emerald-500 animate-pulse → bg-done`. |
| `GroupStatusView.tsx` | Ek B. |
| `MatchCenterDrawer.tsx` | zemin `from-[#0b1220] via-[#080c14] to-[#050810] → from-canvas via-canvas to-canvas`; CANLI rozeti `bg-red-950/90 text-red-300 border-red-500 animate-pulse` → `bg-live/15 text-live border-live/50`; birincil `bg-red-600 hover:bg-red-500 … shadow-glow-red` → `bg-primary text-primary-fg shadow-glow-primary` ×2; ev seti rozeti `bg-red-950/60 text-red-200 border-red-800/80` → `bg-surface-raised text-ink-2 border-line`; `font-scoreboard tabular-nums` kalır. |
| `MobileBottomNav.tsx` | kök `bg-[#1E222D] border-t border-[#2A2E3D] → bg-panel border-t border-line` (**test güncellenir**); "Canlı" `text-red-400/bg-red-500 → text-live/bg-live`; aktif sekme `text-blue-400 → text-selected-text`, `fill-blue-400/20 → fill-selected-text/20`; pasif `text-[#94A3B8] → text-ink-2`; sayaç `bg-blue-600 text-white text-[9px] font-mono → text-selected-text text-[10px] font-display`. |
| `MobileMatchDrawer.tsx` | `bg-[#1E222D] → bg-panel`, `border-[#2A2E3D] → border-line`. |
| `PrimaryTeamWidget.tsx` | `bg-[#0f172a]/60 → bg-canvas/60`, `bg-[#0b1325] → bg-surface-muted`, `text-rose-400 → text-ink-2`, `hover:text-rose-* → hover:text-ink`, `focus:border-rose-500 → focus:border-primary/40`. |
| `PwaInstallPrompt.tsx` | kök `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red border-red-400/40 → bg-surface-raised border-line` (nötr); ikon `animate-pulse → text-primary`; düğme `text-white hover:from-red-500… → text-ink hover:bg-white/5`; iOS modalı birincil düğme `text-white → text-primary-fg`. |
| `NotificationBanner.tsx` | `hover:bg-primary/90 text-white → text-primary-fg font-bold shadow-glow-primary`. |
| `SpotlightSearchModal.tsx` | `bg-[#080c14] → bg-canvas`, seçili sonuç `bg-red-500/15 text-red-400 border-red-500/30 → bg-primary/15 text-primary border-primary/30`. |
| `BrandLogo.tsx` | SVG: `#0f172a → #07131F`, `#f59e0b/#fbbf24 → #2DD4C0`, `#ef4444/#f43f5e → #7FB4FF`, `#3b82f6 → #5B9DFF`, `#d97706 → #1B8175`, `#b91c1c → #2A63BD`, `#1e293b → #13293F`; "ALTYAPI" rozeti kırmızı-amber gradyan → `bg-primary/15 text-primary border-primary/40 font-display font-bold`. |
| `FormBadge.tsx` | G: `bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-glow-emerald → bg-transparent text-done border-done`; M: `bg-rose-500/25 text-rose-300 border-rose-500/50 → bg-transparent text-form-loss border-form-loss`. |
| `TeamInspectorPanel.tsx` | `border-[#2A2E3D] → border-line` ×5, `bg-[#181A20] → bg-surface-muted` ×4, `bg-[#1E222D] → bg-panel`, `bg-[#121212] → bg-canvas`; form hapları halka. |
| `TeamRosterView.tsx` | `border-[#162342\|#1b2b52\|#1b2a4d\|#172547] → border-panel`, `bg-[#0c1630] → bg-surface-muted`, `bg-[#0a1226\|#080f24] → bg-canvas`, `bg-red-600 → bg-primary` + `text-white → text-primary-fg`, `*-pink-500 → *-primary`. |
| `TeamDetailClient.tsx` | Ek B (26 satır). Başlık gradyanı `from-red-950/50 to-[#1e1b4b]/60 → from-primary/10 to-canvas/60`; birincil `hover:bg-primary/90 text-white shadow-sm → text-primary-fg shadow-glow-primary`; sekme `bg-primary shadow-xs → bg-selected-strong font-bold shadow-glow-selected` ×3; grafik `#334155 → #1B3550`, `#10b981 → #9BE15D`. |
| `TeamBadge.tsx` | **DOKUNMA** (takım marka gradyanları). |
| `VolleyballCourtView.tsx` | kort `from-[#0b3b60] via-[#072640] to-[#041525] → from-[#0E2F4D] via-[#0A2038] to-[#07131F]`, `bg-[#072640] → bg-[#0A2038]`, `border-[#38bdf8]/40 → border-blue-400/40`; seçili oyuncu `bg-red-600/30 border-red-400 shadow-glow-red → bg-selected/20 border-selected shadow-glow-selected`; yer tutucu gradyan → `bg-surface-raised border border-line`. |
| `SocialStoryModal.tsx` | §12.3. |
| `TeamVolleyboxLink.tsx` | `hover:text-primary → hover:text-ink`. Diğerleri (`LeagueVolleyboxLink`, `PrintScheduleButton`, `ServiceWorkerRegister`) ölçek bağlamasıyla otomatik. |
| `app/karsilastir/CompareClient.tsx` | Ek B (stroke `#38bdf8 → #2DD4C0`, `#818cf8 → #7FB4FF`, `#94a3b8 → #A9C3D1`, `#334155 → #1B3550`, `#475569 → #2A4560`). |
| `app/takim/[slug]/page.tsx` | `hover:bg-primary/90 text-white shadow-md → text-primary-fg shadow-glow-primary`. |
| `app/admin/page.tsx` | Ek B (21 satır). |
| `league/LeagueHubClient.tsx` | `bg-primary shadow-glow-red → bg-selected-strong font-bold shadow-glow-selected` ×5; `bg-[#070b14] → bg-canvas` (+/90), `from-[#0b1325] → from-surface-muted`, `bg-rose-500 / text-white → bg-primary / text-primary-fg`, `bg-emerald-500 text-white → bg-done text-done-fg`, `font-mono → font-display` (1×). `dynamic()` blokları **kalır**. |
| `realtime/LiveMatchScore.tsx` | canlı kırmızı **kalır** (rose/red ölçeği = `live`). |
| `realtime/LiveScoreIndicator.tsx` | bağlantı koptu: `bg-red-950/80 text-red-400 border-red-800 → bg-warn/10 text-warn border-warn/40`. |
| `realtime/RealtimeErrorHandler.tsx` | yerel: `bg-red-950/90 border-red-800 text-red-300/400 → bg-primary/10 border-primary/40 text-primary/ink-2`. **Öneri:** hata için `bg-live/10 border-live/40 text-live`. |

### 11.4 Düzen / maç bileşenleri (sabit-hex yoğun)
| Dosya | Eşleme (sayılar Ek B'de) |
|---|---|
| `layout/LeftSidebarPlaceholder.tsx` | `border-[#2A2E3D] → border-line` ×9, `text-[#94A3B8] → text-ink-2` ×9, `bg-[#1E222D] → bg-panel` ×4, `bg-[#181A20] → bg-surface-muted` ×3, `hover:bg-[#1E222D] → hover:bg-panel` ×3, `text-[#F1F5F9] → text-ink`; sayaç `font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded → font-display font-semibold tabular-nums text-ink-2`; `bg-pink-500 animate-pulse → bg-fuchsia-400`. |
| `layout/RightSidebarPlaceholder.tsx` | `border-[#2A2E3D] → border-line` ×12 (+/80 ×2), `text-[#94A3B8] → text-ink-2` ×11, `bg-[#181A20] → bg-surface-muted` ×6, `bg-[#1E222D] → bg-panel` ×6, `text-[#EF4444]/bg-[#EF4444] → text-live/bg-live` (canlı), `hover:bg-[#242936] → hover:bg-panel`. |
| `layout/SidebarNavigation.tsx` | `text-[#94A3B8] → text-ink-2` (güncel tabanda #64748B'den dönmüş ×7 dahil), seçili grup `border-blue-500 bg-blue-500/10 → border-selected bg-selected/10`, `bg-pink-500 animate-pulse → bg-fuchsia-400`. |
| `match/CompactMatchRow.tsx` | `text-[#F1F5F9] → text-ink` ×3, `border-[#2A2E3D]/40 → border-line/40` ×2, `bg-[#181A20] → bg-surface-muted`, `text-[#EF4444] → text-live`; `font-scoreboard tabular-nums` **kalır** (test); `bg-amber-950/30` **kalır** (test). |
| `match/CompactMatchFeed.tsx` | `border-[#2A2E3D] → border-line` ×2, `bg-[#181A20]`, `bg-[#1E222D]`, `text-[#94A3B8] → text-ink-2`. |
| `match/DateNavigationRibbon.tsx` | `bg-[#181A20] → bg-surface-muted` ×8, `border-[#2A2E3D] → border-line` ×6, `bg-[#EF4444] text-white → bg-live text-live-fg` ×2 (bugün işareti canlı değilse `bg-selected-strong text-white` tercih et), `text-[#EF4444] → text-live`. |
| `match/LeagueSection.tsx` | `text-[#94A3B8] → text-ink-2` ×3, `border-[#2A2E3D] → border-line` ×2, `hover:bg-[#121212] → hover:bg-canvas`, `divide-[#2A2E3D]/40 → divide-line/40`. |
| `match/MatchInspectorPanel.tsx` | `border-[#2A2E3D] → border-line` ×19, `text-[#94A3B8] → text-ink-2` ×16, `bg-[#181A20] → bg-surface-muted` ×12, `bg-[#1E222D] → bg-panel` ×9, `text-[#CBD5E1] → text-slate-200` ×10; form hapları `bg-emerald-600/30 text-emerald-300 border-emerald-500/40 → bg-transparent text-done border-done`; `bg-rose-600/30 text-rose-300 border-rose-500/40 → bg-transparent text-form-loss border-form-loss`. |
| `match/SetScoreMatrix.tsx` | `border-[#2A2E3D] → border-line` ×3, `text-[#94A3B8] → text-ink-2` ×3, `bg-[#181A20] → bg-surface-muted` ×2, `bg-[#12141A] → bg-canvas`; `text-slate-500`, `text-blue-300`, `text-emerald-400` **kalır** (test). |

### 11.5 Kadınlar 2. Lig bileşenleri (`src/components/kadinlar-2-lig/`)
Genel kural: marka amaçlı `rose/red` → `primary` (orkide); etiket/ikon `text-rose-400` → `text-ink-2`; seçili sekme `bg-selected-strong`; birincil `bg-primary text-primary-fg`; sayaç rozeti → sade metin.

| Dosya | Eşlemeler |
|---|---|
| `Kadinlar2LigClient.tsx` | `section="kadinlar-2-lig"`; `<h1>` bandı: `border-purple-800/40 → border-line`, nokta `bg-pink-500 animate-pulse → bg-primary`, rozet `text-purple-300 bg-purple-950/60 border-purple-800/50 → text-primary bg-primary/10 border-primary/40`; `dynamic()` aynen. |
| `Kadinlar2LigHeader.tsx` | `from-red-950/30 → from-primary/10` ×9, `bg-[#080c14]/90 → bg-canvas/90`; aktif `bg-red-950/80 border-red-500/40 text-red-300 → bg-primary/10 border-primary/40 text-primary`; sayaç `bg-rose-700 text-white … → text-ink-2 font-display tabular-nums`; "Bugün" `bg-emerald-500 text-white → bg-done text-done-fg`. |
| `Kadinlar2LigSidebar.tsx` (**yeniden yazıldı**) | kök `bg-[#1E222D] → bg-panel`; üst başlık `bg-[#1E222D]/95 border-[#2A2E3D] → bg-panel/95 border-line`; ikon kapsülü `border-rose-500/40 bg-rose-500/15 text-rose-300 → border-primary/40 bg-primary/15 text-primary`; "Maç" sayacı `border-[#2A2E3D] bg-[#121212] text-rose-300 → border-line bg-canvas text-primary font-display tabular-nums`; bölüm kutuları `bg-[#181A20] border-[#2A2E3D] → bg-surface-muted border-line`; aktif satır `border-l-2 border-rose-400 bg-rose-500/10 text-white → border-l-2 border-primary bg-primary/10 text-ink`; grup aktif `bg-rose-500/15 text-rose-200 → bg-primary/15 text-primary`; fikstür bağlantısı aktif `bg-rose-500/20 text-rose-300 border-rose-500/40 → bg-primary/20 text-primary border-primary/40`, hover `hover:text-rose-300 → hover:text-ink`; pasif `text-[#CBD5E1] → text-slate-200`, `text-[#94A3B8] → text-ink-2`; "Takip edilenler" sayacı `bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded → font-display font-semibold tabular-nums text-ink-2`; yıldızlar `text-amber-400` **kalır**; Altyapı köprüsü `bg-blue-950/40 border-blue-800/40 text-blue-200 hover:bg-blue-950/70`, nokta `bg-blue-400`, `text-blue-400` → turkuaz `bg-teal-950/40 border-teal-800/40 text-teal-200`, `bg-teal-400`, `text-teal-300`; `Users text-blue-300 → text-ink-2`. Test `Kadinlar2LigSidebar.test.tsx` yalnız metin/href/click doğrular; sınıf değişimi güvenli. |
| `Kadinlar2LigHomePortal.tsx` | `text-rose-400` ×8–10 → `text-ink-2`; kırmızı gradyan ×3 → `bg-selected-strong shadow-glow-selected`; `bg-rose-500 text-white → bg-primary text-primary-fg`; sayaç rozetleri → sade. (`convertK2MatchToMatch` import'u Antigravity'nin; etkilemez.) |
| `Kadinlar2LigGroupBar.tsx` | gradyan + `ring-2 ring-red-500/30` ×2 → `bg-primary text-primary-fg (font-bold) shadow-glow-primary`; `bg-[#0f172a] → bg-canvas`; `bg-[#0b1325] → bg-surface-muted`; `focus:*-red/rose-500 → focus:*-primary/40`; `bg-rose-500 → bg-primary`. |
| `Kadinlar2LigCompare.tsx` | `text-rose-400` ×7 → `text-ink-2`/`text-primary`; `bg-rose-950/80\|60 → bg-primary/10`, `border-rose-500/40 → border-primary/40`, `border-rose-700/50 → border-primary/50`, `bg-rose-500 → bg-primary`, `from-rose-500/20 → from-primary/20`. |
| `Kadinlar2LigStandings.tsx` | kaybeden sayı `text-rose-400` ×3 → `text-form-loss`; `border-l-emerald-500 bg-emerald-950/15 text-emerald-400 → border-l-primary bg-primary/5 text-primary` (play-off); `border-l-rose-500 bg-rose-950/15 → border-l-line bg-transparent`; `bg-rose-500 → bg-primary`. |
| `StatuView`, `Fixtures`, `Leaders`, `Results`, `Teams`, `TodayMatches`, `MobileNav` | Ek B: `text-rose-400 → text-ink-2`, birincil gradyan → `bg-primary text-primary-fg`, seçili gradyan → `bg-selected-strong`, `focus:border-red-500 → focus:border-primary/40`, `hover:bg-emerald-500 → hover:bg-done`; MobileNav sayaç `bg-red-600 text-white text-[9px] font-mono → text-primary text-[10px] font-display`. |

### 11.6 Küresel notlar
- `shadow-glow-red` yalnız canlıda; birincil `shadow-glow-primary`; seçili `shadow-glow-selected`.
- Dekoratif `ring-2 ring-red-500/30` halkaları kalkar.
- `hover:bg-primary/90` + `text-white` → `text-primary-fg` (metin rengi kritik).
- `selection:bg-red-600/30 → selection:bg-primary/30`.
- Eski `bg-primary` **seçili sekme** yerlerinde (LeagueHub, TeamDetail, Admin sekmeleri) → `bg-selected-strong`; eskiden "primary" hem seçili hem ana eylemdi, artık ayrı.

---

## 12. Lazy-load (next/dynamic) bileşenler — temadan kaçmama notları

**Güncel tabanda dinamik yüklenenler** (hepsi `ssr:false`):
| Bileşen | Nerede dinamik | Tema gereksinimi |
|---|---|---|
| `MatchCenterDrawer` | `kadinlar-2-lig/Kadinlar2LigClient.tsx`, `league/LeagueHubClient.tsx` | Tam tema uygulanmalı (zemin, CANLI rozeti, birincil düğme, set rozetleri, `font-scoreboard`). |
| `SpotlightSearchModal` | `Kadinlar2LigClient.tsx`, `LeagueHubClient.tsx`, `DashboardClient.tsx` (zaten dinamikti) | `bg-canvas`, seçili sonuç `primary/15`, ikon/etiket token'ları. |
| `SocialStoryModal` | `MatchCenterDrawer.tsx` içinde | Canvas çizimi §12.3; DOM kısmı (kapsayıcı, düğmeler) token'lı. |
| `HomePortalView`, `CompactMatchFeed`, `StandingsTable`, `TeamInspectorPanel`, `GroupStatusView`, `MobileMatchDrawer`, `NotificationBanner` | `DashboardClient.tsx` (`loading: TabViewLoading` → `TabViewSkeleton`) | Her biri için tema uygulanmalı; **iskelet de temalı** (`SkeletonLoaders.tsx`). |

> **Önemli:** Lazy-load edilen bileşenler "ana sayfada görünmüyor" diye temadan **dışarıda bırakılmamalı**. Drawer/Spotlight/Story kullanıcı etkileşiminde açılır ve en çok eski kırmızı renkleri taşıyan bileşenlerdir (MatchCenterDrawer: `shadow-glow-red`, `bg-red-600`, `bg-red-950/*`). Bunlar §11.3'te listelendi.

### 12.1 Stiller dynamic import yüzünden kaçar mı?
- **Tailwind sınıfları:** JIT, `content` glob'u (`./src/**/*.{ts,tsx}`) ile **kaynak dosyalardan** sınıf toplar; bileşenin ayrı chunk'ta yüklenmesi CSS'i etkilemez (tek CSS bundle). Ancak sınıf adı **dinamik üretilirse** (`` `bg-${tone}` ``) JIT bulamaz → token sınıflarını **tam dize** yaz (`"bg-primary"`).
- **Global CSS değişkenleri** (`:root`, `[data-section]`) `layout.tsx`'in import ettiği `globals.css`'te olduğundan her chunk için hazırdır.
- **`next/font` değişkenleri** `<html className>` üzerinde olduğundan modal/drawer dahil tüm DOM'a miras kalır.
- **Yükleme sırasında renk sıçraması / CLS:** `ssr:false` bileşenler ilk render'da yoktur. `loading` verilecekse **temalı** olmalı (`bg-surface border-line animate-pulse`).

### 12.2 `data-section` ve modal
`MatchCenterDrawer`, `SpotlightSearchModal`, `SocialStoryModal` şu an `fixed inset-0 z-50` olarak **React ağacında** render ediliyor (`createPortal` aranıp bulunmadı). `Kadinlar2LigClient` içinde (AppShell altında) açıldıklarında `[data-section="kadinlar-2-lig"]` değişkenlerini **miras alır** (drawer birincil düğmesi orkide olur — istenen). `LeagueHubClient` / `DashboardClient` altında turkuaz olur. İleride `createPortal(document.body)` eklenirse `data-section` sarmalayıcıyla ayrıca verilmeli. Canlı/bitti/seçili/uyarı token'ları sabit olduğundan bölümden etkilenmez.

### 12.3 `SocialStoryModal` canvas
Canvas CSS sınıfı kullanmaz; renkler **sabit hex**, fontlar **dizge**dir (dinamik chunk'ta da aynı). Değişiklikler:
- Font: `'Museo Sans'` ×8 yer → `next/font` CSS değişkeninden okunan gerçek aile adı:
```ts
const cs = getComputedStyle(document.documentElement);
const FONT_BODY = (cs.getPropertyValue("--font-manrope").trim() || "Manrope") + ", system-ui, sans-serif";
const FONT_NUM  = (cs.getPropertyValue("--font-space-grotesk").trim() || "Space Grotesk") + ", system-ui, sans-serif";
ctx.font = `700 32px ${FONT_BODY}`;      // ağırlık ≤ 800 (Manrope) / ≤ 700 (Space Grotesk); 900 yüklü değil
```
- **Fontun yüklü olduğundan emin ol:** çizimden önce `await document.fonts.load("700 32px " + FONT_BODY)` (ve numerik font) önerilir. (Yerelde eklenmedi → bilinen eksik.)
- Renkler: zemin gradyanı `#07131F → #0E2033 → #0A1A2B → #07131F`; rozet `#2DD4C0` üstü `#032320`; metinler `#EAF6FA / #A9C3D1 / #8CA8B8`; vurgular `#7FB4FF` ve `#FFC24D`; kırmızı gradyanlar kaldırıldı. Güncel tabandaki filigran `ctx.fillStyle = "#94a3b8"` → `#8CA8B8`.
- `MatchCenterDrawer.test.tsx` artık `await screen.findByText("Instagram & WhatsApp Hikaye Kartı")` (dinamik yükleme asenkron) — bozmayın.

### 12.4 Kontrol listesi (lazy bileşenler)
1. Kadınlar 2. Lig'te bir maç aç → drawer birincil düğmesi orkide, CANLI rozeti mercan, set rozetleri token'lı.
2. Altyapı Lig Hub'da aynı drawer → turkuaz.
3. `Ctrl/Cmd+K` Spotlight → seçili öğe `primary/15`.
4. Hikaye Kartı → canvas Manrope/Space Grotesk ile çiziliyor; PNG indirilebilir; Türkçe harfler doğru.
5. Ağ sekmesi: chunk yüklenirken CSS 404 yok (aynı CSS bundle), fontlar self-host.
6. `SkeletonLoaders` renkleri gerçek kartlarla aynı yüzey/çizgi tonlarında.

---

## 13. Güncellenecek / eklenecek testler (güncel taban: 63 dosya / **416 test**)

| Test dosyası | Beklenen değişiklik |
|---|---|
| `src/components/__tests__/MobileBottomNav.test.tsx` (satır ~97) | `"fixed bottom-0 left-0 right-0 z-50 bg-[#1E222D] border-t border-[#2A2E3D]"` → `"… z-50 bg-panel border-t border-line"` |
| `src/components/layout/__tests__/MainLayout.test.tsx` (satır ~116–131) | Test adı; `--portal-background` `#121212 → #07131F`, `--portal-panel` `#1E222D → #0E2033`, `--portal-border` `#2A2E3D → #1B3550`; `className` `toContain("text-[#F1F5F9]")` → `toContain("text-ink")` |
| `src/components/__tests__/ScoreboardTypography.test.tsx` (**yeni, Antigravity**) | Değişmez; ama yeni StandingsTable sıra `<span>`, O/G/M ve Puan hücrelerinde `font-scoreboard tabular-nums` taşımalı (§8.2). `CompactMatchRow`/`SetScoreMatrix` sınıfları silinmemeli. **Doğrulandı:** yeni tablo bu sınıflar eklenince 3/3 geçti. |
| `Header.test.tsx` | Değişmez: `border-primary text-white` aktif sekme sınıfı korunmalı. |
| `match/__tests__/CompactMatchRow.test.tsx` | Değişmez: `bg-amber-950/30` (amber ölçeği korunduğu için çalışır). |
| `match/__tests__/SetScoreMatrix.test.tsx` | Değişmez: `text-slate-500`, `text-blue-300`. |
| `StandingsTable.test.tsx`, `StandingsTableCsv.test.tsx`, `results-and-city-header.test.tsx` | Değişmemeli (buton adları `B Grubu`, `Genç (U18)`, `… takımını incele`, `h2` başlığı). |
| `groupStatus.test.ts` | Değişmez (resmi durum hex'leri). |
| `kadinlar-2-lig/__tests__/Kadinlar2LigSidebar.test.tsx` (**yeni**) | Yalnız metin/href/click; sınıf bağımsız. |
| `common/__tests__/SkeletonLoaders.test.tsx` (**yeni**) | `className.toContain("animate-pulse")` → iskelet kök sınıfında `animate-pulse` **kalmalı**. |
| `MatchCenterDrawer.test.tsx` | `await findByText` (dinamik); bozma. |
| `utils/__tests__/getInitialFixtures.test.ts` | Tema ile ilgisiz. |
| **Eklenmesi önerilen** | (a) `StandingsTable`: satıra tıkla → `data-detail-for` açılır, `aria-expanded=true`; (b) `summarizeTeam`: 5 maçlık W/L, eşleşme yoksa `standings` ve `none` dalları; (c) `AppShell`: `section` prop → `data-section`; (d) tema sözleşmesi: `tailwind.config.ts` `canvas === "#07131F"` ve kontrast ≥ 4.5 hesaplayıcı; (e) `globals.css`'te `[data-section="kadinlar-2-lig"]` bloğu var. |

Hedef: **63 dosya / 416 test + yeni eklenenler, hepsi geçer.** Ölçüm: eski tabanda tam tema ile 60/402 geçti; yeni tabanda yalnız `tailwind.config.ts` + `StandingsTable.tsx` üst üste konarak 63/416 geçti.

---

## 14. Doğrulama kontrol listesi

**Otomatik**
- [ ] Node 22: `npx tsc --noEmit` temiz.
- [ ] `npx eslint src` temiz.
- [ ] `npx vitest run` → **63 dosya / 416 test** (+ yeni testler) geçer.
- [ ] `npm run build` (Turbopack) hatasız; 261+ sayfa statik üretildi; çıktıda `latin-ext` woff2 preload'ları var.
- [ ] `rg -n "Museo|museo" src public/sw.js public/manifest.json` → sonuç yok (`public/fonts/museo-*` dosyaları silinebilir).
- [ ] `rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src --glob '!**/__tests__/**'` → sonuç yok.
- [ ] `rg -n "from-red-600|to-rose-600|shadow-glow-red" src` → yalnız canlı bağlamlar.
- [ ] Açık dolguda beyaz yazı yok: `bg-primary`, `bg-live`, `bg-done` ile `text-white` birlikte geçmemeli.
- [ ] `rg -n "animate-pulse" src` → yalnız canlı göstergeler ve iskeletler.
- [ ] Kontrast betiği (Ek C.2) ile §4 tablosundaki tüm çiftler ≥ 4.5 (metin) / ≥ 3 (UI çizgi/ikon).

**Elle / görsel (1440 px + 768 px + 390 px)**
- [ ] Ana sayfa, Sonuçlar, Günün Maçları, Fikstür, Puan Durumu, Grup Durumu, Lig Hub, Takım, Karşılaştır, Kadınlar 2. Lig (5 sekme), Admin.
- [ ] Kırmızı/mercan yalnız CANLI/hata; PwaInstallPrompt nötr; CityTabBar seçili turkuaz.
- [ ] BUGÜN tarih düğmesi **mavi**, birincil eylemler turkuaz, Kadınlar 2. Lig'de orkide.
- [ ] Puan Durumu: segmented kategori, alt çizgili grup sekmesi, 1–2 turkuaz / 3–8 mor çubuk, G/M halkaları, satır açılır (Son/Sıradaki maç), sticky `th`, `h1`, sağ panel yok.
- [ ] Sayı rozeti hap yok; sade tabular sayılar.
- [ ] Fikstür / Günün Maçları **yapı** değişmedi (ekran görüntüsü karşılaştırması: kolonlar, sağ panel, filtreler).
- [ ] Skor/saat/puan hücreleri Space Grotesk tabular; Türkçe karakterler doğru.
- [ ] Hikaye Kartı PNG çıktısı.
- [ ] PWA: manifest `#07131F`, ikonlar (192/512/maskable), iOS `black-translucent`, SW sürümü yükseltildi ve eski önbellek temizleniyor.
- [ ] Yazdırma önizlemesi: print stilleri beyaz/okunur.
- [ ] `focus-visible` tüm etkileşimlerde görünür; klavye ile gezinme.
- [ ] Lighthouse mobil: Erişilebilirlik 100 korunur; performans 64'ün altına düşmez.
- [ ] Kısmi veri akışı: `/` açılış → "Puan Durumu" sekmesi → temalı `TabViewSkeleton` → tam veri gelince tablo.

---

## 15. Riskler, bilinen eksikler, test edilmeyenler

**Riskler**
1. **Birleştirme riski:** Yerel eski yama 16 dosyada yeni tabanla çakışıyor (§3.3). Elle taşırken Antigravity'nin `font-scoreboard tabular-nums`, `min-h-[36/38px]`, `#94A3B8`, `TabViewSkeleton`, `dynamic()`, `h1` değişikliklerini **silmeyin**.
2. **Palet yeniden bağlama yan etkisi:** `rose/red/pink` artık canlı rengi; dekoratif `text-rose-*` temizlenmezse "her şey canlı" görünür. `emerald-500` (`#85C250`) eskisinden sönük; `bg-emerald-500 text-white` kontrastı düşük (→ `text-done-fg`).
3. **Otomatik regex süpürmeleri** bağlama kör olabilir (örn. Kadınlar 2. Lig'de `text-primary → text-ink-2` dönüşümleri); görsel gözden geçirme şart.
4. **`.font-scoreboard` monospace → Space Grotesk:** genişlikler değişir (tabular olduğu için kolon kayması düşük ama `min-w` kontrol edin).
5. **Font yükü:** 2 Google fontu (self-host). Mobil performans çalışması (mobil skor 64, LCP 5.2 s) bozulmamalı: ağırlık sayısını artırmayın.
6. **`data-section` kapsamı:** portal'a taşınan öğeler değişkenleri görmez (§12.2).
7. **Resmi durum renkleri** (`groupStatus.ts`: `#ffff00`, `#00b050`, `#ff0000` …) anlam kuralıyla (kırmızı = canlı) çakışabilir; ayrı karar gerekir (bilinçli dokunulmadı; test hex'e bağlı).
8. **Takım marka renkleri** (`TeamBadge`) korunur; tema ile çelişen takım renkleri olabilir.
9. **SW önbelleği:** `sw.js` sürümünü artırmadan yayınlarsanız eski CSS/font önbellekte kalır.
10. **Veri tarafı:** TVF `form` alanı repoda yalnız 0–2 maçlık → form halkaları çoğu zaman 3–5 kesik halka gösterir; bu hata değil, veri sınırı (nota yazıldı).

**Bilinen eksikler**
- Son kod değişikliklerinden sonra **tam `next build` tamamlanamadı** (kesildi); ilk sürüm exit 0 idi, son hal için `tsc` + `eslint` + `vitest` (eski tabanda 402/402) temizdi. Yeni tabanda build'i yeniden çalıştırın.
- `SocialStoryModal`: `document.fonts.load` çağrısı yok (§12.3).
- `PwaInstallPrompt` iOS modalı ve `OfflineBanner` amber; kısmen gözden geçirildi.
- Admin hata kutuları birincil'e kaydı; `live` daha doğru.
- `TeamInspectorPanel` Puan Durumu'nda kullanılmıyor (dosya duruyor).
- Yeni tabana sonradan eklenen `Kadinlar2LigSidebar` (yeniden yazım) ve `SkeletonLoaders` için **elle temalama yapılmadı**; §11'deki tablolar öneridir.
- Kadınlar 2. Lig Sidebar'daki "Altyapı köprüsü" rengi (turkuaz) bir tasarım önerisidir; onay gerekebilir.

**Test edilmeyenler**
Gerçek tarayıcıda tüm sayfaların görsel regresyonu; mobil ≤ 390 px; Lighthouse/axe; admin (auth); SocialStoryModal canvas çıktısı; PWA yükleme/manifest davranışı; Supabase/realtime akışları; 81 ilin tüm rotaları; Safari/iOS render; yeni tabanda **tam** tema (yalnız 2 dosya üst üste konarak test paketi çalıştırıldı).

---

## Ek A — Dosya başına renk kullanım sayımları (güncel taban `dea2414`)
`hex` = sabit `x-[#…]` sınıfları + satır içi `"#rrggbb"`; diğer sütunlar Tailwind palet sınıfı sayısı. Sıralama: toplam kullanıma göre azalan.

| Dosya | satır | hex | kırmızı/pembe | zümrüt | kehribar | mavi | mor | slate | primary | gradyan |
|---|---|---|---|---|---|---|---|---|---|---|
| `src/app/admin/page.tsx` | 1920 | 0 | 36 | 30 | 11 | 18 | 1 | 210 | 52 | 1 |
| `src/components/FixtureTable.tsx` | 926 | 3 | 29 | 13 | 102 | 6 | 0 | 126 | 1 | 8 |
| `src/components/TodayMatchesView.tsx` | 974 | 0 | 29 | 15 | 52 | 29 | 0 | 103 | 8 | 11 |
| `src/components/league/LeagueHubClient.tsx` | 1060 | 7 | 5 | 27 | 21 | 29 | 1 | 135 | 15 | 5 |
| `src/components/TeamDetailClient.tsx` | 806 | 8 | 19 | 13 | 46 | 16 | 13 | 105 | 17 | 2 |
| `src/app/karsilastir/CompareClient.tsx` | 843 | 9 | 4 | 8 | 19 | 35 | 2 | 123 | 11 | 10 |
| `src/components/DashboardClient.tsx` | 1930 | 20 | 10 | 23 | 37 | 35 | 0 | 76 | 6 | 5 |
| `src/components/match/MatchInspectorPanel.tsx` | 804 | 103 | 17 | 17 | 10 | 23 | 0 | 5 | 0 | 1 |
| `src/components/StandingsTable.tsx` | 902 | 6 | 24 | 13 | 11 | 3 | 0 | 95 | 0 | 7 |
| `src/components/kadinlar-2-lig/Kadinlar2LigHeader.tsx` | 390 | 1 | 20 | 3 | 6 | 3 | 0 | 102 | 14 | 10 |
| `src/components/kadinlar-2-lig/Kadinlar2LigHomePortal.tsx` | 566 | 3 | 22 | 7 | 9 | 0 | 0 | 85 | 0 | 5 |
| `src/components/HomePortalView.tsx` | 684 | 3 | 26 | 13 | 13 | 8 | 0 | 61 | 0 | 1 |
| `src/components/kadinlar-2-lig/Kadinlar2LigCompare.tsx` | 602 | 0 | 25 | 4 | 1 | 8 | 1 | 82 | 0 | 1 |
| `src/components/Header.tsx` | 303 | 1 | 8 | 7 | 6 | 0 | 0 | 71 | 10 | 7 |
| `src/components/common/SkeletonLoaders.tsx` | 329 | 9 | 0 | 1 | 0 | 1 | 0 | 98 | 0 | 0 |
| `src/components/FilterBar.tsx` | 374 | 0 | 10 | 13 | 15 | 0 | 0 | 55 | 7 | 4 |
| `src/components/MatchCenterDrawer.tsx` | 403 | 4 | 18 | 7 | 19 | 0 | 0 | 50 | 2 | 3 |
| `src/components/GroupStatusView.tsx` | 539 | 9 | 1 | 1 | 1 | 1 | 1 | 73 | 11 | 2 |
| `src/components/kadinlar-2-lig/Kadinlar2LigStandings.tsx` | 374 | 1 | 11 | 16 | 8 | 0 | 0 | 62 | 0 | 1 |
| `src/components/kadinlar-2-lig/Kadinlar2LigStatuView.tsx` | 239 | 0 | 14 | 3 | 16 | 5 | 0 | 51 | 3 | 2 |
| `src/components/FeaturedMatchHero.tsx` | 343 | 2 | 15 | 4 | 18 | 1 | 0 | 36 | 1 | 3 |
| `src/components/layout/RightSidebarPlaceholder.tsx` | 270 | 50 | 4 | 4 | 4 | 16 | 0 | 0 | 0 | 0 |
| `src/components/layout/LeftSidebarPlaceholder.tsx` | 198 | 40 | 1 | 0 | 6 | 18 | 5 | 0 | 0 | 0 |
| `src/components/kadinlar-2-lig/Kadinlar2LigGroupBar.tsx` | 384 | 2 | 19 | 0 | 1 | 0 | 0 | 45 | 0 | 2 |
| `src/components/layout/SidebarNavigation.tsx` | 313 | 36 | 1 | 0 | 5 | 17 | 5 | 0 | 0 | 0 |
| `src/components/DateRibbon.tsx` | 237 | 0 | 10 | 12 | 4 | 4 | 0 | 22 | 5 | 6 |
| `src/components/match/CompactMatchRow.tsx` | 275 | 16 | 2 | 5 | 25 | 6 | 0 | 8 | 0 | 0 |
| `src/components/kadinlar-2-lig/Kadinlar2LigFixtures.tsx` | 406 | 0 | 6 | 1 | 10 | 0 | 0 | 40 | 0 | 3 |
| `src/components/TeamBadge.tsx` | 153 | 0 | 11 | 3 | 16 | 7 | 3 | 7 | 0 | 12 |
| `src/components/kadinlar-2-lig/Kadinlar2LigSidebar.tsx` | 206 | 29 | 17 | 0 | 5 | 7 | 0 | 0 | 0 | 0 |
| `src/components/TeamRosterView.tsx` | 349 | 20 | 5 | 0 | 0 | 1 | 0 | 29 | 0 | 0 |
| `src/components/CityTabBar.tsx` | 260 | 3 | 4 | 4 | 0 | 0 | 0 | 29 | 7 | 1 |
| `src/components/VolleyballCourtView.tsx` | 208 | 6 | 7 | 0 | 7 | 4 | 0 | 17 | 0 | 4 |
| `src/components/PrimaryTeamWidget.tsx` | 253 | 4 | 5 | 0 | 9 | 1 | 0 | 24 | 0 | 1 |
| `src/components/kadinlar-2-lig/Kadinlar2LigLeaders.tsx` | 197 | 0 | 4 | 1 | 0 | 0 | 0 | 34 | 3 | 1 |
| `src/components/kadinlar-2-lig/Kadinlar2LigTeams.tsx` | 205 | 0 | 3 | 4 | 4 | 0 | 0 | 31 | 0 | 0 |
| `src/components/SocialStoryModal.tsx` | 321 | 20 | 4 | 3 | 1 | 0 | 0 | 12 | 0 | 1 |
| `src/components/match/DateNavigationRibbon.tsx` | 209 | 23 | 2 | 4 | 0 | 8 | 0 | 2 | 0 | 0 |
| `src/components/TeamInspectorPanel.tsx` | 151 | 15 | 1 | 4 | 4 | 3 | 0 | 10 | 0 | 0 |
| `src/components/CitySelector.tsx` | 197 | 3 | 0 | 5 | 1 | 0 | 0 | 22 | 4 | 0 |
| `src/components/match/SetScoreMatrix.tsx` | 194 | 19 | 0 | 4 | 2 | 4 | 0 | 2 | 0 | 0 |
| `src/components/SpotlightSearchModal.tsx` | 301 | 1 | 3 | 0 | 3 | 3 | 0 | 18 | 1 | 0 |
| `src/components/kadinlar-2-lig/Kadinlar2LigResults.tsx` | 290 | 0 | 1 | 6 | 4 | 0 | 0 | 17 | 0 | 1 |
| `src/components/PwaInstallPrompt.tsx` | 179 | 0 | 5 | 0 | 6 | 1 | 0 | 9 | 5 | 1 |
| `src/components/realtime/LiveMatchScore.tsx` | 98 | 0 | 8 | 4 | 4 | 0 | 0 | 6 | 0 | 0 |
| `src/utils/groupStatus.ts` | 335 | 21 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/NotificationBanner.tsx` | 133 | 0 | 0 | 4 | 0 | 9 | 0 | 5 | 2 | 1 |
| `src/components/BrandLogo.tsx` | 141 | 16 | 2 | 0 | 1 | 0 | 0 | 1 | 0 | 1 |
| `src/components/kadinlar-2-lig/Kadinlar2LigTodayMatches.tsx` | 206 | 0 | 1 | 0 | 3 | 0 | 0 | 16 | 0 | 1 |
| `src/app/icon.svg` | 52 | 18 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/MobileBottomNav.tsx` | 137 | 5 | 6 | 0 | 0 | 5 | 0 | 0 | 0 | 0 |
| `src/components/match/LeagueSection.tsx` | 125 | 12 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 |
| `src/components/realtime/LiveScoreIndicator.tsx` | 63 | 0 | 3 | 3 | 0 | 0 | 0 | 4 | 0 | 0 |
| `src/components/kadinlar-2-lig/Kadinlar2LigMobileNav.tsx` | 111 | 2 | 1 | 0 | 0 | 0 | 0 | 3 | 3 | 0 |
| `src/components/TeamVolleyboxLink.tsx` | 139 | 0 | 0 | 1 | 4 | 0 | 0 | 2 | 1 | 0 |
| `src/components/realtime/RealtimeErrorHandler.tsx` | 77 | 0 | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/match/CompactMatchFeed.tsx` | 203 | 6 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `src/app/takim/[slug]/page.tsx` | 78 | 0 | 0 | 0 | 0 | 0 | 0 | 5 | 2 | 0 |
| `src/components/FormBadge.tsx` | 57 | 0 | 3 | 3 | 0 | 0 | 0 | 1 | 0 | 0 |
| `src/components/kadinlar-2-lig/Kadinlar2LigClient.tsx` | 393 | 0 | 1 | 0 | 0 | 0 | 4 | 2 | 0 | 0 |
| `src/components/PrintScheduleButton.tsx` | 33 | 0 | 0 | 0 | 0 | 0 | 0 | 6 | 0 | 0 |
| `src/app/layout.tsx` | 104 | 3 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `src/components/MobileMatchDrawer.tsx` | 116 | 2 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| `src/app/apple-icon.svg` | 8 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/LeagueVolleyboxLink.tsx` | 55 | 0 | 0 | 1 | 1 | 0 | 0 | 1 | 0 | 0 |
| `src/components/layout/ThemeTokens.ts` | 5 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/layout/AppShell.tsx` | 105 | 1 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `src/app/karsilastir/page.tsx` | 58 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0 | 0 |

---

## Ek B — Dosya başına eski → yeni sınıf eşlemeleri (yerel uygulamadan çıkarıldı)

> Kaynak: eski taban `893b2c5` üzerinde yapılan gerçek değişikliklerin dosya-başı farkı (adet = o dosyadaki sayı). **462 eşlemenin 454'ü güncel tabanda birebir bulunuyor.** Kalan 8 satır (`text-[#64748B] → text-ink-3`: Kadinlar2LigSidebar 5, LeftSidebarPlaceholder 2, RightSidebarPlaceholder 4, SidebarNavigation 7, CompactMatchFeed 1, CompactMatchRow 5, MatchInspectorPanel 10, SetScoreMatrix 1) güncel tabanda Antigravity tarafından `text-[#94A3B8]`'e çevrildi; bu yerlerde yeni kural `text-[#94A3B8] → text-ink-2` (küçük ipucu için isterseniz `text-ink-3`). Aynı eski sınıf farklı yerlerde farklı yeni değere gidebilir (ör. `text-white` → `text-primary-fg` veya `text-done-fg`); karar kuralı §6 ve §11.1. "yapısal yeniden yazım" yazan dosyalar için kodlar §9'dadır.


### public/icon.svg
| Eski | Yeni | Adet |
|---|---|---|
| `#dc2626` | `#2DD4C0` | 1 |
| `#dc2626` | `#07131F` | 1 |

### public/sw.js
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/app/admin/page.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-primary shadow-sm` | `bg-selected-strong font-bold shadow-glow-selected` | 4 |
| `hover:bg-primary/90 text-white` | `text-primary-fg font-bold shadow-glow-primary` | 4 |
| `text-white` | `text-done-fg` | 3 |
| `text-primary` | `text-ink-2` | 3 |
| `text-red-400` | `text-ink-2` | 3 |
| `bg-red-500/20` | `bg-primary/20` | 3 |
| `bg-emerald-500` | `bg-done` | 2 |
| `text-red-400` | `text-primary` | 2 |
| `hover:bg-emerald-500` | `hover:bg-done` | 1 |
| `hover:bg-red-950/80` | `hover:bg-primary/10` | 1 |
| `hover:text-red-400` | `hover:text-ink` | 1 |
| `focus-visible:ring-red-400` | `focus-visible:ring-primary/40` | 1 |
| `bg-rose-950/90` | `bg-surface-raised` | 1 |
| `text-rose-300` | `text-ink-2` | 1 |
| `border-rose-800` | `border-line` | 1 |
| `bg-red-950` | `bg-surface-raised` | 1 |
| `border-red-800` | `border-line` | 1 |
| `bg-gradient-to-br from-primary/20 to-primary/10` | `bg-primary/15` | 1 |
| `bg-red-950/80` | `bg-primary/10` | 1 |
| `border-red-800` | `border-primary/40` | 1 |
| `text-red-300` | `text-primary` | 1 |

### src/app/apple-icon.svg
| Eski | Yeni | Adet |
|---|---|---|
| `#dc2626` | `#2DD4C0` | 1 |
| `#dc2626` | `#07131F` | 1 |

### src/app/globals.css
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/app/icon.svg
| Eski | Yeni | Adet |
|---|---|---|
| `#020617` | `#07131F` | 4 |
| `#0f172a` | `#0E2033` | 2 |
| `#f59e0b` | `#2DD4C0` | 2 |
| `#fbbf24` | `#2DD4C0` | 2 |
| `#ef4444` | `#7FB4FF` | 1 |
| `#6366f1` | `#5B9DFF` | 1 |
| `#f43f5e` | `#5B9DFF` | 1 |
| `#be123c` | `#2A63BD` | 1 |

### src/app/karsilastir/CompareClient.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-primary` | `text-ink-2` | 3 |
| `hover:text-primary` | `hover:text-ink` | 2 |
| `text-rose-400` | `text-form-loss` | 2 |
| `bg-[#0b1325]/95` | `bg-surface-muted/95` | 1 |
| `from-[#0f172a]` | `from-canvas` | 1 |
| `via-[#0b1325]` | `via-surface-muted` | 1 |
| `to-[#1e293b]` | `to-panel` | 1 |
| `text-primary/70` | `text-ink-2` | 1 |
| `bg-red-600/20` | `bg-primary/20` | 1 |
| `border-red-500/30` | `border-primary/30` | 1 |
| `#334155` | `#1B3550` | 1 |
| `#475569` | `#2A4560` | 1 |
| `#38bdf8` | `#2DD4C0` | 1 |
| `#818cf8` | `#7FB4FF` | 1 |
| `#94a3b8` | `#A9C3D1` | 1 |

### src/app/layout.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/app/takim/[slug]/page.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `hover:bg-primary/90 text-white shadow-md` | `text-primary-fg shadow-glow-primary` | 1 |

### src/components/BrandLogo.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `#0f172a` | `#07131F` | 3 |
| `#f59e0b` | `#2DD4C0` | 2 |
| `#fbbf24` | `#FFC24D` | 1 |
| `#1e293b` | `#13293F` | 1 |
| `#ef4444` | `#7FB4FF` | 1 |
| `#3b82f6` | `#5B9DFF` | 1 |
| `#d97706` | `#1B8175` | 1 |
| `#ef4444` | `#5B9DFF` | 1 |
| `#b91c1c` | `#2A63BD` | 1 |
| `#fbbf24` | `#2DD4C0` | 1 |
| `#f43f5e` | `#7FB4FF` | 1 |
| `bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white font-black shadow-xs border-white/10` | `bg-primary/15 text-primary border-primary/40 font-display font-bold` | 1 |

### src/components/CitySelector.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-primary` | `text-ink-2` | 2 |
| `bg-[#0b1325]` | `bg-surface-muted` | 2 |
| `bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono font-bold` | `font-display font-semibold tabular-nums text-ink-2` | 1 |
| `bg-[#0f172a]` | `bg-canvas` | 1 |
| `text-white` | `text-primary-fg` | 1 |

### src/components/CityTabBar.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/DashboardClient.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/DateRibbon.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red ring-2 ring-red-500/30` | `bg-selected-strong shadow-glow-selected` | 3 |
| `text-rose-400` | `text-ink-2` | 1 |

### src/components/FeaturedMatchHero.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-red-400` | `text-ink-2` | 2 |
| `border-red-500/25` | `border-primary/25` | 1 |
| `via-[#0b1220]/95` | `via-canvas/95` | 1 |
| `#ef4444` | `#FF6E82` | 1 |
| `bg-red-600/15` | `bg-primary/15` | 1 |
| `group-hover:bg-red-600/20` | `group-hover:bg-primary/20` | 1 |
| `bg-red-600/20` | `bg-surface-raised` | 1 |
| `border-red-500/30` | `border-line` | 1 |
| `bg-gradient-to-br` | `bg-surface-raised` | 1 |
| `from-red-600` | `border` | 1 |
| `to-rose-700` | `border-line` | 1 |
| `text-white` | `text-ink-2` | 1 |
| `font-black` | `font-display` | 1 |
| `shadow-glow-red` | `font-bold` | 1 |
| `hover:decoration-red-400` | `hover:decoration-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-red` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `text-primary` | `text-ink-2` | 1 |

### src/components/FilterBar.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `focus:border-red-500` | `focus:border-primary/40` | 2 |
| `focus-visible:ring-red-500/30` | `focus-visible:ring-primary/30` | 2 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] flex items-center justify-center` | `text-[11px] font-display tabular-nums text-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-xs ring-1 ring-red-500/40` | `bg-selected-strong shadow-glow-selected` | 1 |

### src/components/FixtureTable.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-red-600` | `bg-primary` | 2 |
| `text-white` | `text-primary-fg` | 2 |
| `text-rose-400` | `text-ink-2` | 2 |
| `bg-red-500/10` | `bg-primary/10` | 2 |
| `border-red-500/25` | `border-primary/25` | 2 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red` | `text-done font-black` | 2 |
| `text-red-400` | `text-ink-2` | 2 |
| `via-[#0d1424]/90` | `via-surface-muted/90` | 1 |
| `via-[#0b1325]/90` | `via-surface-muted/90` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red` | `text-done` | 1 |
| `bg-rose-500/15` | `bg-surface-raised` | 1 |
| `border-rose-500/30` | `border-line` | 1 |
| `group-hover:bg-rose-500/25` | `group-hover:bg-primary/25` | 1 |
| `bg-rose-950/50` | `bg-surface-raised` | 1 |
| `text-rose-200` | `text-ink-2` | 1 |
| `border-rose-800/60` | `border-line` | 1 |
| `hover:text-primary` | `hover:text-ink` | 1 |
| `bg-[#0b1325]/95` | `bg-surface-muted/95` | 1 |
| `bg-red-950/40` | `bg-surface-raised` | 1 |
| `text-red-200` | `text-ink-2` | 1 |
| `border-red-800/50` | `border-line` | 1 |
| `group-hover/hall:decoration-red-400` | `group-hover/hall:decoration-primary` | 1 |

### src/components/FormBadge.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-glow-emerald` | `bg-transparent text-done border-done` | 1 |
| `bg-rose-500/25` | `bg-transparent` | 1 |
| `text-rose-300` | `text-form-loss` | 1 |
| `border-rose-500/50` | `border-form-loss` | 1 |

### src/components/GroupStatusView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-primary` | `text-ink-2` | 2 |
| `via-[#0d1628]` | `via-surface-muted` | 1 |
| `bg-primary/20` | `bg-surface-raised` | 1 |
| `text-rose-300` | `text-ink-2` | 1 |
| `border-primary/30` | `border-line` | 1 |
| `bg-[#0f172a]/95` | `bg-canvas/95` | 1 |
| `font-mono font-bold bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700` | `font-display font-semibold tabular-nums text-ink-2` | 1 |
| `text-white` | `text-primary-fg` | 1 |
| `hover:bg-primary/90` | `font-bold` | 1 |
| `shadow-md` | `shadow-glow-primary` | 1 |
| `bg-[#1f497d]/20` | `bg-selected-strong/20` | 1 |
| `hover:bg-[#1f497d]/40` | `hover:bg-selected-strong/40` | 1 |
| `border-[#1f497d]/40` | `border-selected-strong/40` | 1 |

### src/components/Header.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `from-red-950/30` | `from-primary/10` | 6 |
| `bg-[#080c14]/90` | `bg-canvas/90` | 1 |
| `bg-rose-700 text-white px-1.5 py-0.5 rounded-full font-mono font-bold shadow-xs` | `text-ink-2 font-display font-semibold normal-case tracking-normal` | 1 |
| `bg-emerald-500` | `bg-done` | 1 |
| `text-white` | `text-done-fg` | 1 |
| `text-[9px] sm:text-[10px] bg-red-700 text-white px-1.5 py-0.5 rounded-full font-mono font-bold shadow-xs` | `text-[10px] sm:text-[11px] text-ink-2 font-display font-semibold normal-case tracking-normal tabular-nums` | 1 |
| `text-[9px] sm:text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded-full font-normal border border-slate-700/50` | `text-[10px] font-display font-semibold tabular-nums text-ink-2` | 1 |

### src/components/HomePortalView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 5 |
| `px-1.5` | `font-display` | 3 |
| `py-0.2` | `font-semibold` | 3 |
| `rounded-full` | `tabular-nums` | 3 |
| `bg-black/30` | `text-ink-2` | 3 |
| `font-mono` | `opacity-90` | 3 |
| `bg-rose-600` | `bg-primary` | 2 |
| `text-white` | `text-primary-fg` | 2 |
| `bg-rose-500/20` | `bg-surface-raised` | 2 |
| `text-rose-300` | `text-ink-2` | 2 |
| `border-rose-500/40` | `border-line` | 2 |
| `hover:text-rose-300` | `hover:text-ink` | 2 |
| `group-hover:text-rose-100` | `group-hover:text-ink` | 2 |
| `px-1.5 py-0.5 rounded-full bg-rose-700 text-white font-mono shadow-xs` | `font-display tabular-nums text-primary` | 1 |
| `bg-rose-500/20` | `bg-primary/20` | 1 |
| `border-rose-500/30` | `border-primary/30` | 1 |
| `text-rose-400` | `text-primary` | 1 |
| `bg-rose-950/70` | `bg-primary/10` | 1 |
| `border-rose-500/60` | `border-primary/60` | 1 |
| `to-[#0e1627]` | `to-surface-muted` | 1 |
| `bg-[#0f172a]/70` | `bg-canvas/70` | 1 |
| `hover:bg-[#18233c]` | `hover:bg-panel` | 1 |
| `hover:border-rose-500/40` | `hover:border-primary/40` | 1 |

### src/components/MatchCenterDrawer.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-red-400` | `text-ink-2` | 2 |
| `hover:text-primary` | `hover:text-ink` | 2 |
| `from-[#0b1220]` | `from-canvas` | 1 |
| `via-[#080c14]` | `via-canvas` | 1 |
| `to-[#050810]` | `to-canvas` | 1 |
| `bg-red-600/20` | `bg-surface-raised` | 1 |
| `border-red-500/30` | `border-line` | 1 |
| `via-[#0d1424]/90` | `via-surface-muted/90` | 1 |
| `bg-red-600/10` | `bg-primary/10` | 1 |
| `bg-red-950/90 text-red-300 border-red-500 animate-pulse` | `bg-live/15 text-live border-live/50` | 1 |
| `bg-red-950/60` | `bg-surface-raised` | 1 |
| `text-red-200` | `text-ink-2` | 1 |
| `border-red-800/80` | `border-line` | 1 |
| `bg-red-600 hover:bg-red-500 text-white shadow-glow-red` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red hover:from-red-500 hover:to-rose-500` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |

### src/components/MobileBottomNav.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-red-400` | `text-live` | 2 |
| `text-blue-400` | `text-selected-text` | 2 |
| `text-[#94A3B8]` | `text-ink-2` | 2 |
| `bg-red-500` | `bg-live` | 2 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |
| `hover:text-[#F1F5F9]` | `hover:text-ink` | 1 |
| `fill-red-400/20` | `fill-live/20` | 1 |
| `fill-blue-400/20` | `fill-selected-text/20` | 1 |
| `bg-red-400` | `bg-live` | 1 |
| `bg-blue-600 text-white text-[9px] font-mono shadow-xs` | `text-selected-text text-[10px] font-display` | 1 |
| `bg-blue-500` | `bg-selected` | 1 |

### src/components/MobileMatchDrawer.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |

### src/components/NotificationBanner.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `hover:bg-primary/90 text-white` | `text-primary-fg font-bold shadow-glow-primary` | 1 |

### src/components/PrimaryTeamWidget.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#0f172a]/60` | `bg-canvas/60` | 1 |
| `hover:bg-[#0f172a]/80` | `hover:bg-canvas/80` | 1 |
| `text-rose-400` | `text-ink-2` | 1 |
| `hover:text-rose-300` | `hover:text-ink` | 1 |
| `bg-[#0b1325]` | `bg-surface-muted` | 1 |
| `focus:border-rose-500` | `focus:border-primary/40` | 1 |
| `via-[#0d172a]` | `via-surface-muted` | 1 |
| `hover:text-rose-200` | `hover:text-ink` | 1 |
| `hover:text-rose-400` | `hover:text-ink` | 1 |

### src/components/PwaInstallPrompt.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red border-red-400/40` | `bg-surface-raised border-line` | 1 |
| `text-white hover:from-red-500 hover:to-rose-500` | `text-ink hover:bg-white/5` | 1 |
| `animate-pulse` | `text-primary` | 1 |
| `text-white/80` | `text-ink-2` | 1 |
| `hover:text-white` | `hover:text-ink` | 1 |
| `hover:bg-white/10` | `hover:bg-white/5` | 1 |
| `border-white/20` | `border-line` | 1 |
| `text-white` | `text-primary-fg` | 1 |
| `hover:bg-primary/90` | `shadow-glow-primary` | 1 |

### src/components/SocialStoryModal.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/SpotlightSearchModal.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#080c14]` | `bg-canvas` | 1 |
| `bg-red-500/15` | `bg-primary/15` | 1 |
| `text-red-400` | `text-primary` | 1 |
| `border-red-500/30` | `border-primary/30` | 1 |

### src/components/StandingsTable.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/TeamDetailClient.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-primary` | `text-ink-2` | 6 |
| `text-rose-400` | `text-ink-2` | 4 |
| `bg-primary shadow-xs` | `bg-selected-strong font-bold shadow-glow-selected` | 3 |
| `via-[#0b1325]` | `via-surface-muted` | 2 |
| `text-pink-400` | `text-ink-2` | 2 |
| `text-white` | `text-primary-fg` | 2 |
| `bg-rose-600/20` | `bg-primary/20` | 1 |
| `bg-red-600/25` | `bg-primary/25` | 1 |
| `border-red-500/40` | `border-primary/40` | 1 |
| `from-red-950/50` | `from-primary/10` | 1 |
| `to-[#1e1b4b]/60` | `to-canvas/60` | 1 |
| `bg-red-600/15` | `bg-primary/15` | 1 |
| `border-red-500/30` | `border-primary/30` | 1 |
| `from-[#0f172a]` | `from-canvas` | 1 |
| `to-[#1e293b]` | `to-panel` | 1 |
| `#334155` | `#1B3550` | 1 |
| `#10b981` | `#9BE15D` | 1 |
| `bg-rose-500` | `bg-primary` | 1 |
| `bg-[#0b1325]/95` | `bg-surface-muted/95` | 1 |
| `hover:bg-primary/90 text-white shadow-sm` | `text-primary-fg shadow-glow-primary` | 1 |
| `text-primary/70` | `text-ink-2` | 1 |
| `bg-primary/20` | `bg-surface-raised` | 1 |
| `border-primary/30` | `border-line` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red ring-2 ring-red-500/40` | `bg-selected-strong shadow-glow-selected` | 1 |
| `border-rose-500/40` | `border-primary/40` | 1 |
| `bg-rose-950/10` | `bg-primary/10` | 1 |
| `text-rose-400` | `text-form-loss` | 1 |

### src/components/TeamInspectorPanel.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 5 |
| `bg-[#181A20]` | `bg-surface-muted` | 4 |
| `bg-[#1E222D]` | `bg-panel` | 2 |
| `bg-[#121212]` | `bg-canvas` | 1 |
| `bg-[#1E222D]/90` | `bg-panel/90` | 1 |
| `hover:bg-[#181A20]` | `hover:bg-surface-muted` | 1 |
| `text-white bg-emerald-600 bg-rose-600` | `bg-transparent text-done border border-done bg-transparent text-form-loss border border-form-loss` | 1 |
| `divide-[#2A2E3D]/70` | `divide-line/70` | 1 |

### src/components/TeamRosterView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#162342]` | `border-panel` | 4 |
| `bg-[#0c1630]` | `bg-surface-muted` | 3 |
| `border-[#1b2b52]` | `border-panel` | 3 |
| `border-[#1b2a4d]` | `border-panel` | 2 |
| `bg-red-600` | `bg-primary` | 2 |
| `text-white` | `text-primary-fg` | 2 |
| `bg-[#0a1226]/90` | `bg-canvas/90` | 2 |
| `hover:bg-[#121f3d]` | `hover:bg-panel` | 2 |
| `bg-[#0a1226]/50` | `bg-canvas/50` | 2 |
| `bg-[#080f24]` | `bg-canvas` | 1 |
| `border-[#172547]` | `border-panel` | 1 |
| `border-pink-500/80` | `border-primary/80` | 1 |
| `bg-pink-500/10` | `bg-primary/10` | 1 |
| `text-pink-500` | `text-primary` | 1 |

### src/components/TeamVolleyboxLink.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `hover:text-primary` | `hover:text-ink` | 1 |

### src/components/TodayMatchesView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-red-400` | `text-ink-2` | 3 |
| `bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-glow-red` | `text-done` | 2 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-sm` | `bg-selected-strong shadow-glow-selected` | 2 |
| `bg-red-600` | `bg-primary` | 2 |
| `text-white` | `text-primary-fg` | 2 |
| `group-hover/hall:decoration-red-400` | `group-hover/hall:decoration-primary` | 1 |
| `group-hover/hall:text-red-400` | `group-hover/hall:text-ink-2` | 1 |
| `bg-gradient-to-r from-red-600/90 to-rose-700/90 text-white border-red-500 shadow-glow-red ring-2 ring-red-500/30` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `bg-red-600/10` | `bg-primary/10` | 1 |
| `bg-red-500/15` | `bg-surface-raised` | 1 |
| `border-red-500/30` | `border-line` | 1 |
| `bg-black/40 text-amber-300 px-1 rounded-full font-mono` | `text-warn font-display tabular-nums` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-red` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `hover:bg-red-500` | `hover:bg-primary` | 1 |

### src/components/VolleyballCourtView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#38bdf8]/40` | `border-blue-400/40` | 2 |
| `bg-red-600/30` | `bg-selected/20` | 1 |
| `border-red-400` | `border-selected` | 1 |
| `shadow-glow-red` | `shadow-glow-selected` | 1 |
| `bg-gradient-to-br` | `bg-surface-raised` | 1 |
| `from-red-600` | `border` | 1 |
| `to-rose-700` | `border-line` | 1 |
| `text-white` | `text-ink` | 1 |
| `from-[#0b3b60]` | `from-[#0E2F4D]` | 1 |
| `via-[#072640]` | `via-[#0A2038]` | 1 |
| `to-[#041525]` | `to-[#07131F]` | 1 |
| `bg-[#072640]` | `bg-[#0A2038]` | 1 |
| `bg-red-600/20` | `bg-primary/20` | 1 |
| `border-red-500/40` | `border-primary/40` | 1 |
| `text-red-300` | `text-primary` | 1 |

### src/components/__tests__/MobileBottomNav.test.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigClient.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/kadinlar-2-lig/Kadinlar2LigCompare.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 6 |
| `focus:border-rose-500` | `focus:border-primary/40` | 4 |
| `text-rose-300` | `text-primary` | 2 |
| `hover:text-rose-400` | `hover:text-ink` | 2 |
| `text-rose-300` | `text-ink-2` | 2 |
| `from-rose-500/20` | `from-primary/20` | 1 |
| `border-rose-500/30` | `border-primary/30` | 1 |
| `text-rose-400` | `text-primary` | 1 |
| `bg-rose-950/80` | `bg-primary/10` | 1 |
| `border-rose-500/40` | `border-primary/40` | 1 |
| `text-rose-500` | `text-ink-2` | 1 |
| `bg-rose-950/60` | `bg-primary/10` | 1 |
| `border-rose-700/50` | `border-primary/50` | 1 |
| `bg-rose-500` | `bg-primary` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigFixtures.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 2 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red` | `bg-selected-strong shadow-glow-selected` | 2 |

### src/components/kadinlar-2-lig/Kadinlar2LigGroupBar.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 4 |
| `bg-rose-500` | `bg-primary` | 2 |
| `focus:ring-red-500` | `focus:ring-primary/40` | 1 |
| `bg-[#0f172a]` | `bg-canvas` | 1 |
| `bg-[#0b1325]` | `bg-surface-muted` | 1 |
| `focus:border-rose-500` | `focus:border-primary/40` | 1 |
| `focus:ring-rose-500` | `focus:ring-primary/40` | 1 |
| `bg-red-600/20` | `bg-primary/20` | 1 |
| `text-rose-300` | `text-primary` | 1 |
| `border-red-500/40` | `border-primary/40` | 1 |
| `shadow-glow-red` | `shadow-glow-primary` | 1 |
| `hover:text-rose-300` | `hover:text-ink` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30` | `bg-primary text-primary-fg font-bold shadow-glow-primary` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigHeader.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `from-red-950/30` | `from-primary/10` | 9 |
| `text-rose-400` | `text-ink-2` | 2 |
| `bg-[#080c14]/90` | `bg-canvas/90` | 1 |
| `bg-red-950/80` | `bg-primary/10` | 1 |
| `border-red-500/40` | `border-primary/40` | 1 |
| `text-red-300` | `text-primary` | 1 |
| `bg-rose-950/40` | `bg-primary/10` | 1 |
| `hover:bg-rose-900/60` | `hover:bg-primary/10` | 1 |
| `border-rose-800/50` | `border-primary/50` | 1 |
| `text-rose-200` | `text-primary` | 1 |
| `text-[9px] sm:text-[10px] bg-rose-700 text-white px-1.5 py-0.5 rounded-full font-mono font-bold shadow-xs` | `text-[10px] font-display font-semibold tabular-nums text-ink-2` | 1 |
| `bg-emerald-500` | `bg-done` | 1 |
| `text-white` | `text-done-fg` | 1 |
| `focus:border-red-500` | `focus:border-primary/40` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigHomePortal.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 8 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red` | `bg-selected-strong shadow-glow-selected` | 3 |
| `px-1.5` | `font-display` | 3 |
| `py-0.2` | `font-semibold` | 3 |
| `rounded-full` | `tabular-nums` | 3 |
| `bg-black/30` | `text-ink-2` | 3 |
| `font-mono` | `opacity-90` | 3 |
| `hover:text-rose-300` | `hover:text-ink` | 2 |
| `text-rose-300` | `text-ink-2` | 2 |
| `hover:text-rose-400` | `hover:text-ink` | 2 |
| `bg-rose-500` | `bg-primary` | 1 |
| `text-white` | `text-primary-fg` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigLeaders.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-rose-500` | `bg-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600` | `bg-primary` | 1 |
| `hover:text-rose-400` | `hover:text-ink` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigMobileNav.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |
| `bg-red-600 text-white text-[9px] font-mono` | `text-primary text-[10px] font-display` | 1 |
| `shadow-glow-red` | `shadow-glow-primary` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigResults.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `focus:border-red-500` | `focus:border-primary/40` | 1 |
| `hover:bg-emerald-500` | `hover:bg-done` | 1 |
| `text-white` | `text-done-fg` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigSidebar.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-[#64748B]` | `text-ink-3` | 5 |
| `border-[#2A2E3D]` | `border-line` | 4 |
| `text-[#94A3B8]` | `text-ink-2` | 4 |
| `hover:bg-[#1E222D]` | `hover:bg-panel` | 4 |
| `text-rose-300` | `text-ink-2` | 2 |
| `bg-[#181A20]` | `bg-surface-muted` | 2 |
| `text-[#CBD5E1]` | `text-slate-200` | 2 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `bg-[#1E222D]/95` | `bg-panel/95` | 1 |
| `border-rose-500/40` | `border-primary/40` | 1 |
| `bg-rose-500/15` | `bg-primary/15` | 1 |
| `text-rose-300` | `text-primary` | 1 |
| `bg-[#121212]` | `bg-canvas` | 1 |
| `border-rose-400` | `border-primary` | 1 |
| `bg-rose-500/10` | `bg-primary/10` | 1 |
| `hover:text-rose-300` | `hover:text-ink` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigStandings.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-form-loss` | 3 |
| `text-rose-400` | `text-ink-2` | 2 |
| `via-[#0d1424]/90` | `via-surface-muted/90` | 1 |
| `border-l-emerald-500` | `border-l-primary` | 1 |
| `bg-emerald-950/15` | `bg-primary/5` | 1 |
| `border-l-rose-500` | `border-l-line` | 1 |
| `bg-rose-950/15` | `bg-transparent` | 1 |
| `text-emerald-400` | `text-primary` | 1 |
| `hover:text-rose-400` | `hover:text-ink` | 1 |
| `bg-rose-950/80` | `bg-primary/10` | 1 |
| `text-rose-300` | `text-primary` | 1 |
| `border-rose-500/40` | `border-primary/40` | 1 |
| `bg-rose-500` | `bg-primary` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigStatuView.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-rose-400` | `text-ink-2` | 3 |
| `bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-glow-red` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `text-rose-400` | `text-primary` | 1 |
| `bg-rose-950/40` | `bg-primary/10` | 1 |
| `border-rose-500/30` | `border-primary/30` | 1 |
| `text-rose-300` | `text-ink-2` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigTeams.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `hover:text-rose-400` | `hover:text-ink` | 2 |
| `focus:border-red-500` | `focus:border-primary/40` | 1 |

### src/components/kadinlar-2-lig/Kadinlar2LigTodayMatches.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `focus:border-red-500` | `focus:border-primary/40` | 1 |

### src/components/layout/AppShell.tsx
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/layout/LeftSidebarPlaceholder.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 9 |
| `text-[#94A3B8]` | `text-ink-2` | 9 |
| `bg-[#1E222D]` | `bg-panel` | 4 |
| `bg-[#181A20]` | `bg-surface-muted` | 3 |
| `hover:bg-[#1E222D]` | `hover:bg-panel` | 3 |
| `text-[#F1F5F9]` | `text-ink` | 3 |
| `hover:text-[#F1F5F9]` | `hover:text-ink` | 2 |
| `text-[#64748B]` | `text-ink-3` | 2 |
| `bg-[#1E222D]/90` | `bg-panel/90` | 1 |
| `bg-[#121212]` | `bg-canvas` | 1 |
| `bg-[#1E222D]/60` | `bg-panel/60` | 1 |
| `hover:border-[#2A2E3D]` | `hover:border-line` | 1 |
| `font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded` | `font-display font-semibold tabular-nums text-ink-2` | 1 |
| `bg-pink-500 animate-pulse` | `bg-fuchsia-400` | 1 |
| `bg-[#2A2E3D]` | `bg-line` | 1 |

### src/components/layout/RightSidebarPlaceholder.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 12 |
| `text-[#94A3B8]` | `text-ink-2` | 11 |
| `bg-[#181A20]` | `bg-surface-muted` | 6 |
| `bg-[#1E222D]` | `bg-panel` | 6 |
| `text-[#64748B]` | `text-ink-3` | 4 |
| `text-[#F1F5F9]` | `text-ink` | 3 |
| `hover:bg-[#181A20]` | `hover:bg-surface-muted` | 2 |
| `border-[#2A2E3D]/80` | `border-line/80` | 2 |
| `text-rose-400` | `text-ink-2` | 2 |
| `bg-[#1E222D]/90` | `bg-panel/90` | 1 |
| `text-[#EF4444]` | `text-live` | 1 |
| `bg-[#EF4444]` | `bg-live` | 1 |
| `hover:bg-[#242936]` | `hover:bg-panel` | 1 |

### src/components/layout/SidebarNavigation.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-[#64748B]` | `text-ink-3` | 7 |
| `text-[#94A3B8]` | `text-ink-2` | 6 |
| `border-[#2A2E3D]` | `border-line` | 5 |
| `hover:bg-[#1E222D]` | `hover:bg-panel` | 4 |
| `bg-[#121212]` | `bg-canvas` | 2 |
| `bg-[#181A20]` | `bg-surface-muted` | 2 |
| `border-blue-500` | `border-selected` | 2 |
| `bg-blue-500/10` | `bg-selected/10` | 2 |
| `hover:text-[#F1F5F9]` | `hover:text-ink` | 2 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `bg-[#1E222D]/90` | `bg-panel/90` | 1 |
| `bg-[#1E222D]/60` | `bg-panel/60` | 1 |
| `hover:border-[#2A2E3D]` | `hover:border-line` | 1 |
| `text-[#F1F5F9]` | `text-ink` | 1 |
| `font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded` | `font-display font-semibold tabular-nums text-ink-2` | 1 |
| `bg-pink-500 animate-pulse` | `bg-fuchsia-400` | 1 |
| `border-[#2A2E3D]/50` | `border-line/50` | 1 |
| `hover:bg-[#1E222D]/80` | `hover:bg-panel/80` | 1 |
| `border-[#2A2E3D]/40` | `border-line/40` | 1 |

### src/components/layout/ThemeTokens.ts
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### src/components/layout/__tests__/MainLayout.test.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `Sofascore koyu renk s flar (bg-[#121212], border-[#2A2E3D], bg-[#1E222D])` | `File token lar (canvas #07131F, panel #0E2033, line #1B3550)` | 1 |
| `#121212` | `#07131F` | 1 |
| `text-[#F1F5F9]` | `text-ink` | 1 |
| `#1E222D` | `#0E2033` | 1 |
| `#2A2E3D` | `#1B3550` | 1 |

### src/components/league/LeagueHubClient.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-primary shadow-glow-red` | `bg-selected-strong font-bold shadow-glow-selected` | 5 |
| `text-rose-400` | `text-ink-2` | 3 |
| `hover:text-primary` | `hover:text-ink` | 2 |
| `text-primary` | `text-ink-2` | 2 |
| `bg-[#070b14]` | `bg-canvas` | 1 |
| `selection:bg-red-600/30` | `selection:bg-primary/30` | 1 |
| `bg-[#070b14]/90` | `bg-canvas/90` | 1 |
| `from-[#0b1325]` | `from-surface-muted` | 1 |
| `via-[#070b14]` | `via-canvas` | 1 |
| `to-[#070b14]` | `to-canvas` | 1 |
| `hover:bg-primary/90 text-white shadow-glow-red` | `text-primary-fg shadow-glow-primary` | 1 |
| `bg-[#0b1325]/95` | `bg-surface-muted/95` | 1 |
| `via-[#0d1424]/90` | `via-surface-muted/90` | 1 |
| `bg-emerald-500` | `bg-done` | 1 |
| `text-white` | `text-done-fg` | 1 |
| `bg-rose-500` | `bg-primary` | 1 |
| `text-white` | `text-primary-fg` | 1 |
| `font-mono` | `font-display` | 1 |

### src/components/match/CompactMatchFeed.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 2 |
| `bg-[#181A20]` | `bg-surface-muted` | 1 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `text-[#64748B]` | `text-ink-3` | 1 |
| `text-[#94A3B8]` | `text-ink-2` | 1 |

### src/components/match/CompactMatchRow.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-[#64748B]` | `text-ink-3` | 5 |
| `text-[#F1F5F9]` | `text-ink` | 3 |
| `border-[#2A2E3D]/40` | `border-line/40` | 2 |
| `text-[#94A3B8]` | `text-ink-2` | 2 |
| `border-[#2A2E3D]/50` | `border-line/50` | 1 |
| `hover:bg-[#1E222D]/80` | `hover:bg-panel/80` | 1 |
| `bg-[#181A20]` | `bg-surface-muted` | 1 |
| `text-[#EF4444]` | `text-live` | 1 |

### src/components/match/DateNavigationRibbon.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#181A20]` | `bg-surface-muted` | 8 |
| `border-[#2A2E3D]` | `border-line` | 6 |
| `text-[#94A3B8]` | `text-ink-2` | 4 |
| `bg-[#EF4444]` | `bg-live` | 2 |
| `bg-[#1E222D]/95` | `bg-panel/95` | 1 |
| `border-[#2A2E3D]/50` | `border-line/50` | 1 |
| `text-white` | `text-live-fg` | 1 |
| `text-[#EF4444]` | `text-live` | 1 |

### src/components/match/LeagueSection.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `text-[#94A3B8]` | `text-ink-2` | 3 |
| `border-[#2A2E3D]` | `border-line` | 2 |
| `bg-[#181A20]` | `bg-surface-muted` | 1 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `hover:bg-[#242936]` | `hover:bg-panel` | 1 |
| `border-[#2A2E3D]/80` | `border-line/80` | 1 |
| `bg-[#121212]` | `bg-canvas` | 1 |
| `hover:bg-[#121212]` | `hover:bg-canvas` | 1 |
| `divide-[#2A2E3D]/40` | `divide-line/40` | 1 |

### src/components/match/MatchInspectorPanel.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 19 |
| `text-[#94A3B8]` | `text-ink-2` | 16 |
| `bg-[#181A20]` | `bg-surface-muted` | 12 |
| `text-[#64748B]` | `text-ink-3` | 10 |
| `text-[#CBD5E1]` | `text-slate-200` | 10 |
| `bg-[#1E222D]` | `bg-panel` | 9 |
| `text-rose-400` | `text-ink-2` | 5 |
| `hover:bg-[#1E222D]` | `hover:bg-panel` | 4 |
| `bg-[#121212]` | `bg-canvas` | 3 |
| `border-[#2A2E3D]/60` | `border-line/60` | 3 |
| `border-[#2A2E3D]/80` | `border-line/80` | 3 |
| `hover:bg-[#181A20]` | `hover:bg-surface-muted` | 2 |
| `bg-emerald-600/30` | `bg-transparent` | 2 |
| `text-emerald-300` | `text-done` | 2 |
| `border-emerald-500/40` | `border-done` | 2 |
| `bg-rose-600/30` | `bg-transparent` | 2 |
| `text-rose-300` | `text-form-loss` | 2 |
| `border-rose-500/40` | `border-form-loss` | 2 |
| `bg-[#1E222D]/90` | `bg-panel/90` | 1 |
| `from-[#1E222D]` | `from-panel` | 1 |
| `to-[#181A20]` | `to-surface-muted` | 1 |
| `bg-[#2A2E3D]` | `bg-line` | 1 |
| `border-[#374151]` | `border-line` | 1 |
| `bg-[#12141A]` | `bg-canvas` | 1 |
| `text-[#F1F5F9]` | `text-ink` | 1 |
| `hover:bg-[#252A38]` | `hover:bg-panel` | 1 |
| `border-[#2A2E3D]/50` | `border-line/50` | 1 |
| `divide-[#2A2E3D]/40` | `divide-line/40` | 1 |
| `hover:bg-[#1E222D]/40` | `hover:bg-panel/40` | 1 |
| `bg-[#1E222D]/30` | `bg-panel/30` | 1 |

### src/components/match/SetScoreMatrix.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 3 |
| `text-[#94A3B8]` | `text-ink-2` | 3 |
| `bg-[#181A20]` | `bg-surface-muted` | 2 |
| `hover:bg-[#1E222D]/40` | `hover:bg-panel/40` | 2 |
| `text-[#CBD5E1]` | `text-slate-200` | 2 |
| `bg-[#1E222D]/30` | `bg-panel/30` | 2 |
| `text-[#64748B]` | `text-ink-3` | 1 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `divide-[#2A2E3D]/50` | `divide-line/50` | 1 |
| `bg-[#12141A]` | `bg-canvas` | 1 |
| `bg-[#1E222D]/40` | `bg-panel/40` | 1 |

### src/components/realtime/LiveScoreIndicator.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-red-950/80` | `bg-warn/10` | 1 |
| `text-red-400` | `text-warn` | 1 |
| `border-red-800` | `border-warn/40` | 1 |

### src/components/realtime/RealtimeErrorHandler.tsx
| Eski | Yeni | Adet |
|---|---|---|
| `bg-red-950/90` | `bg-primary/10` | 1 |
| `border-red-800` | `border-primary/40` | 1 |
| `bg-red-900/50` | `bg-primary/10` | 1 |
| `hover:bg-red-900/70` | `hover:bg-primary/10` | 1 |
| `text-red-300` | `text-primary` | 1 |
| `text-red-400` | `text-ink-2` | 1 |

### tailwind.config.ts
_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_


---

## Ek C — Araçlar

### C.1 Sabit-hex → token dönüştürücü (Python 3; repo kökünde çalıştır; kaynak: `/workspace/volley-theme/hexmap.py`)
```python
import re, os
CANVAS=["#050810","#070b14","#070d19","#080c14","#080f24","#090d16","#0a1226","#0b1220","#121212","#12141a","#1e1b4b","#0f172a","#020617"]
MUTED=["#0b1325","#0c1630","#0d1424","#0d1628","#0d172a","#0e1627","#181a20"]
PANEL=["#1e222d","#1e293b","#121f3d","#162342","#172547","#18233c","#1b2a4d","#1b2b52","#242936","#252a38"]
LINE=["#2a2e3d","#334155","#374151","#475569"]
M={}
for h in CANVAS: M[h]=("canvas","canvas")
for h in MUTED:  M[h]=("surface-muted","surface-muted")
for h in PANEL:  M[h]=("panel","panel")
for h in LINE:   M[h]=("line","line")
M.update({"#94a3b8":("slate-400","ink-2"),"#64748b":("slate-600","ink-3"),"#f1f5f9":("ink","ink"),"#f8fafc":("ink","ink"),
 "#cbd5e1":("slate-200","slate-200"),"#e2e8f0":("slate-200","slate-200"),"#ffffff":("white","white"),
 "#3b82f6":("selected","selected"),"#38bdf8":("blue-400","blue-400"),"#ef4444":("live","live"),"#dc2626":("live","live"),
 "#f59e0b":("warn","warn"),"#fbbf24":("warn","warn")})
rx=re.compile(r"\b((?:[a-z0-9\-\[\]=&>_]+:)*)(bg|text|border|border-[trblxy]|ring|from|via|to|divide|fill|stroke|outline|decoration|placeholder|accent|caret)-\[(#[0-9a-fA-F]{6})\](/\d+)?")
def sub(m):
    pre,p,h,op=m.group(1),m.group(2),m.group(3).lower(),m.group(4) or ""
    if h not in M: return m.group(0)
    tok=M[h][1] if p in ("text","placeholder") else M[h][0]
    return f"{pre}{p}-{tok}{op}"
for root,_,fs in os.walk("src"):
    if "__tests__" in root: continue
    for f in fs:
        if f.endswith((".tsx",".ts")):
            p=os.path.join(root,f); s=open(p).read(); n=rx.sub(sub,s)
            if n!=s: open(p,"w").write(n)
```
Sonra `git diff --stat` (~36–39 dosya beklenir) ve §11'deki **elle** düzeltmeler. Betik `text-[#94A3B8] → text-ink-2`, `bg-[#1E222D] → bg-panel` vb. dönüşümleri yapar; `groupStatus.ts` içindeki satır içi hex'lere dokunmaz.

### C.2 WCAG kontrast
```python
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return (la+0.05)/(lb+0.05)
print(round(cr('#2DD4C0','#07131F'),2))   # 10.06
print(round(cr('#032320','#2DD4C0'),2))   # 8.92
print(round(cr('#FFFFFF','#2A63BD'),2))   # 5.80
```
Kontrol çiftleri: `ink/canvas` 16.99, `ink-2/surface` 8.97, `ink-3/surface` 6.60, `primary/surface` 8.87, `live/surface` 6.13, `done/surface` 10.46, `selected-text/surface` 7.76, `warn/surface` 10.27, `rank-mid/surface` 7.18, `orchid/surface` 7.14, `form-loss/surface` 7.61; dolgu üstü: `primary-fg/primary` 8.92, `live-fg/live` 6.77, `done-fg/done` 9.89, `#2B1D00/warn` 10.23, `white/selected-strong` 5.80, `#2A0B3A/orchid` 7.53, `white/#9333B8` 6.17, `white/#C42D49` 5.50.

### C.3 Yerel referanslar
- Çalışan uygulama (eski taban + tema): `/workspace/volley-tracker` (dal `tema-fileonu`, uncommitted; yedek yama `/tmp/vt/work-in-progress.patch`, 71 dosya, ikili ikonlar hariç tutulmalı).
- Güncel taban (temiz klon): `/workspace/volley-tracker-latest` (`main@dea2414`).
- Üç öneri görseli: `/workspace/volley-theme/onizleme/`.
