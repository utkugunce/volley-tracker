# 00 — OKU BENİ: "Fileönü" Teması Aşamalı Uygulama Rehberi

> Kaynak: `DEVIR-RAPORU.md` (1763 satır, özgün; değiştirilmedi). Bu klasör onu **sırayla uygulanabilir aşamalara** böler. Her aşama dosyası kendi içinde yeterlidir (paleti/kuralları başta kısaca tekrarlar). Hedef okuyucu: başka bir IDE'deki kodlama ajanı. Dosyaları **numara sırasıyla** uygula.

## 1. Bağlam
- **Site:** altyapivoleybol.com.tr — TVF altyapı (Genç/Yıldız/Küçük Kızlar Süper Lig, 1. Lig) fikstür, canlı sonuç, puan durumu, grup durumu, Kadınlar 2. Lig (16 grup), takım detayı, karşılaştırma, admin.
- **Repo:** `https://github.com/utkugunce/volley-tracker`, dal `main`, **taban commit `dea2414`** (63 test dosyası / **416 test**). Rapordaki tüm yollar/sınıflar bu tabana göre doğrulandı.
- **Yığın:** Next.js 16 (App Router, Turbopack), React 19, **Tailwind CSS 3.4** (`tailwind.config.ts`; v4 değil), vitest + Testing Library, `lucide-react`, `next/font`, Vercel, Supabase/realtime. PWA: `public/manifest.json`, `public/sw.js`.
- **Dil:** Arayüz Türkçe (ğ ş ı İ ö ü ç → font `latin-ext` zorunlu).
- **Tema "Fileönü":** derin lacivert-petrol zemin, ince mavi-gri "file çizgileri", **tek** ana vurgu turkuaz (Altyapı); Kadınlar 2. Lig aynı zemin + **orkide** vurgu. Eski görünüm: kırmızı/pembe her yerde (vurgu çok yarışıyordu). Başlık/sayı fontu Space Grotesk, gövde Manrope.
- **Mekanizma:** Tailwind **varsayılan palet adları korunur, değerleri yeniden bağlanır** (`rose/red/pink`, `emerald`, `slate` …); böylece yüzlerce sınıf adı değişmeden yeni palete geçer ve testler kırılmaz. Sabit hex'ler (`bg-[#1E222D]` vb.) token sınıflarına taşınır.

## 2. Durum notu (dürüst)
Tema eski tabanda (`893b2c5`) yerelde uygulanıp denendi (402/402 test). Yeni tabana **tam yama olarak taşınmadı** (16 dosyada 3-yollu çakışma: `globals.css`, `DashboardClient`, `FixtureTable`, `HomePortalView`, `SocialStoryModal`, `StandingsTable`, `Kadinlar2LigHomePortal`, `Kadinlar2LigSidebar`, `AppShell`, `Left/RightSidebarPlaceholder`, `SidebarNavigation`, `CompactMatchFeed`, `CompactMatchRow`, `MatchInspectorPanel`, `SetScoreMatrix`). Bu yüzden **yama kullanma**; bu aşamaları elle/betikle uygula. Yeni tabanda yalnız `tailwind.config.ts` + `StandingsTable.tsx` üst üste konarak 63/63 dosya, 416/416 test geçti. Hiçbir şey GitHub'a push edilmedi.

## 3. Aşama sırası
| Aşama | Dosya | İçerik |
|---|---|---|
| 01 | `01-token-tailwind-globals-font.md` (+ `01c-…`) | Palet/token, `tailwind.config.ts`, `globals.css`, `layout.tsx` + next/font, `ThemeTokens.ts` (tek zemin kaynağı) |
| 02 | `02-kabuk-appshell-header-nav-pwa.md` (+ `02b-…`, `02c-araclar-hexmap-kontrast.md`) | AppShell, Header, sidebar'lar, CityTabBar, mobil nav, PWA install, manifest/ikonlar |
| 03 | `03-anasayfa-fikstur-gunun-maclari-sonuclar.md` (+ `03b-…`) | Ana sayfa, Fikstür, Günün Maçları, Sonuçlar (yapı korunur; yalnız renk/tip/rozet) |
| 04 | `04-puan-durumu.md` | Puan Durumu — Sofascore tarzı yeniden tasarım |
| 05 | `05-inspector-lazy-modallar.md` (+ `05b-…`) | Inspector panelleri, MatchCenterDrawer, SpotlightSearchModal, SocialStoryModal |
| 06 | `06-takim-karsilastirma-lig-grup.md` (+ `06b-…`) | Takım detay, karşılaştırma, lig hub, grup durumu |
| 07 | `07-kadinlar-2-lig.md` (+ `07b-…`) | Kadınlar 2. Lig (orkide, `data-section`, yeni Sidebar, SkeletonLoaders) |
| 08 | `08-admin-kalan-testler.md` (+ `08b-…`) | Admin, kalan dosyalar, test güncellemeleri |
| 09 | `09-son-dogrulama-risk.md` | Son doğrulama, görsel kontrol listesi, riskler |

(`NNb-/NNc-` dosyaları, özgün Ek B/Ek A eşleme tablolarının dosya grubuna göre bölünmüş halidir; ilgili ana aşamada referans verilir.)

## 4. Kurallar (her aşama için geçerli)
1. **Node 22** kullan (Node 20'de vitest bozulur): `node -v` → v22.x.
2. **Her aşama sonunda** sırayla: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`. Hepsi temiz/yeşil olmadan sonraki aşamaya geçme. Hedef: **63 dosya / 416 test + yeni eklenenler** geçer.
3. **Tüm aşamalar bitince:** `npm run build` (Turbopack) hatasız.
4. **GitHub'a push / PR / merge YOK — kullanıcı açık onayı olmadan.** Yerelde dal aç (`git switch -c tema-fileonu`), her aşama sonrası yerel commit (opsiyonel) yeterli.
5. **Silme:** Antigravity'nin son değişikliklerini koru: `font-scoreboard tabular-nums`, `min-h-[36/38px]`, `#94A3B8`, `TabViewSkeleton`, `next/dynamic` blokları, `<h1>` başlıkları, `getInitialHomeFixtures`/`ensureFullData`, `layout.tsx` OG/Twitter/metadata blokları.
6. **Dokunma listesi:** `src/utils/groupStatus.ts` (resmi TVF durum renkleri; test hex'e bağlı), `TeamBadge.tsx` (takım marka gradyanları), `globals.css` print stilleri.
7. **Sınıf adlarını dinamik üretme** (`` `bg-${x}` ``): JIT bulamaz; token sınıflarını tam dize yaz.
8. **Fikstür ve Günün Maçları DOM yapısı değişmez** (kolon/filtre/sağ panel/sıralama/yeni başlık yok). Yalnız Puan Durumu yapısal yenilenir.
9. Test kırılırsa **testi değil kodu** düzelt; istisna yalnız 08'de listelenen iki test (sabit hex bekleyenler).

## 5. Çekirdek palet (özet; ayrıntı 01'de)
canvas `#07131F` · surface `#0E2033` · surface-muted `#0A1A2B` · surface-raised `#13293F` · line `#1B3550` · ink `#EAF6FA` · ink-2 `#A9C3D1` · ink-3 `#8CA8B8` · primary `#2DD4C0` (fg `#032320`) · live `#FF6E82` · done `#9BE15D` · selected `#5B9DFF` / strong `#2A63BD` / text `#7FB4FF` · warn `#FFC24D` · rank-mid `#B79BFF` · form-loss `#FF8FA0` · orchid `#D98BFF`.

## 6. Anlam kuralı (kısa)
Kırmızı/mercan **yalnız CANLI/hata**. Marka/ana eylem = turkuaz (Kadınlar 2. Lig'de orkide). Seçili gezinti = mavi. Bitti/galibiyet = yeşil. Uyarı/favori = kehribar. Sayı rozeti (renkli hap) yok; sade tabular metin. Gradyan düğme yok.

## 7. Yerel kaynaklar (bu makinede, başka IDE'de yoksa gerekmez)
`/workspace/volley-theme/hexmap.py`, `contrast.py`, `scales.json`, `scales.py` (ölçek değerleri), `onizleme/*.png`, `gercek-*.png` (eski tabana ait ekran görüntüleri), çalışan uygulama `/workspace/volley-tracker` (dal `tema-fileonu`), temiz klon `/workspace/volley-tracker-latest`. Tailwind tam ölçek değerleri **01 aşamasında dosyanın içinde** verilmiştir; dışarıya ihtiyaç yoktur.

## 8. Başlarken
```bash
git clone https://github.com/utkugunce/volley-tracker && cd volley-tracker
git checkout dea2414 && git switch -c tema-fileonu
nvm use 22 || node -v   # v22 olmalı
npm ci && npx vitest run   # taban: 63 dosya / 416 test
```
Sonra **`01-token-tailwind-globals-font.md`** ile başla.
