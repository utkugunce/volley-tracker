# 09 — Son doğrulama, görsel kontrol listesi, riskler

> 01–08 tamamlandı varsayılır. Taban `dea2414`, Node 22. **GitHub'a push / PR yok — kullanıcı onayı olmadan.**

## Kısa palet/kural özeti
canvas `#07131F` · surface `#0E2033` · raised `#13293F` · line `#1B3550` · ink `#EAF6FA` / ink-2 `#A9C3D1` / ink-3 `#8CA8B8` · primary `#2DD4C0` (Kadınlar 2. Lig `#D98BFF`) · live `#FF6E82` (yalnız CANLI/hata) · done `#9BE15D` · selected-strong `#2A63BD` · warn `#FFC24D`. Fonts: Manrope (gövde), Space Grotesk (başlık/sayı/skor; `font-mono`, `.font-scoreboard` da buna bağlı).

## 9.1 Otomatik kontroller
```bash
node -v                          # v22.x
npx tsc --noEmit                 # temiz
npx eslint src                   # temiz
npx vitest run                   # 63 dosya / 416 test (+yeni testler) geçer
npm run build                    # Turbopack, hatasız; 261+ sayfa statik; çıktıda latin-ext woff2 preload'ları
rg -n "Museo|museo" src public/sw.js public/manifest.json                      # sonuç yok (public/fonts/museo-* silinebilir)
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src --glob '!**/__tests__/**'   # sonuç yok
rg -n "from-red-600|to-rose-600|shadow-glow-red" src                            # yalnız canlı bağlamlar
rg -n "animate-pulse" src                                                       # yalnız canlı göstergeler ve iskeletler
```
- Açık dolguda beyaz yazı yok: `bg-primary`, `bg-live`, `bg-done` ile `text-white` birlikte geçmemeli (örn. `rg -n "bg-(primary|live|done)[^\"'\`]*text-white|text-white[^\"'\`]*bg-(primary|live|done)" src`).
- **Kontrast betiği** (`02c-…` C.2): §palet çiftleri ≥ 4.5 (metin) / ≥ 3 (UI çizgi/ikon): ink/canvas 16.99; ink-2/surface 8.97; ink-3/surface 6.60; primary/surface 8.87; live/surface 6.13; done/surface 10.46; selected-text/surface 7.76; warn/surface 10.27; rank-mid/surface 7.18; orchid/surface 7.14; form-loss/surface 7.61; dolgu: primary-fg/primary 8.92; live-fg/live 6.77; done-fg/done 9.89; `#2B1D00`/warn 10.23; beyaz/selected-strong 5.80; `#2A0B3A`/orchid 7.53; beyaz/`#9333B8` 6.17; beyaz/`#C42D49` 5.50.
- Build sonrası ağ sekmesinde `fonts.gstatic.com` isteği yok (self-host).

## 9.2 Elle / görsel kontrol listesi (1440 px + 768 px + 390 px)
- [ ] Sayfalar: Ana sayfa, Sonuçlar, Günün Maçları, Fikstür, Puan Durumu, Grup Durumu, Lig Hub, Takım, Karşılaştır, Kadınlar 2. Lig (5 sekme), Admin.
- [ ] Kırmızı/mercan yalnız CANLI/hata; PwaInstallPrompt nötr; CityTabBar seçili turkuaz.
- [ ] BUGÜN tarih düğmesi **mavi**, birincil eylemler turkuaz, Kadınlar 2. Lig'de orkide.
- [ ] Puan Durumu: segmented kategori, alt çizgili grup sekmesi, 1–2 turkuaz / 3–8 mor çubuk, G/M halkaları, satır açılır (Son/Sıradaki maç), sticky `th`, `h1`, sağ panel yok.
- [ ] Sayı rozeti hap yok; sade tabular sayılar.
- [ ] Fikstür / Günün Maçları **yapı** değişmedi (eski/yeni ekran görüntüsü karşılaştır: kolonlar, sağ panel, filtreler).
- [ ] Skor/saat/puan hücreleri Space Grotesk tabular; Türkçe karakterler doğru.
- [ ] Hikaye Kartı PNG çıktısı (Manrope/Space Grotesk, Türkçe harf).
- [ ] PWA: manifest `#07131F`, ikonlar (192/512/maskable), iOS `black-translucent`, SW sürümü (`altyapi-voleybol-v4`) yükseltildi ve eski önbellek temizleniyor.
- [ ] Yazdırma önizlemesi: print stilleri beyaz/okunur.
- [ ] `focus-visible` tüm etkileşimlerde görünür; klavye ile gezinme.
- [ ] Lighthouse mobil: Erişilebilirlik 100 korunur; performans 64'ün altına düşmez.
- [ ] Kısmi veri akışı: `/` açılış → "Puan Durumu" sekmesi → temalı `TabViewSkeleton` → tam veri gelince tablo.
- [ ] Lazy bileşenler (05 §5.5): Kadınlar 2. Lig drawer orkide, Altyapı drawer turkuaz, Spotlight `primary/15`, `SkeletonLoaders` renkleri gerçek kartlarla aynı.
Ekran görüntüleri (`gercek-*.png`, 1440 px) **eski tabana** aittir; karşılaştırma referansıdır, hedef değil.

## 9.3 Riskler
1. **Birleştirme riski:** eski yama 16 dosyada çakışır; elle taşırken Antigravity'nin `font-scoreboard tabular-nums`, `min-h-[36/38px]`, `#94A3B8`, `TabViewSkeleton`, `dynamic()`, `<h1>` değişikliklerini **silme**.
2. **Palet yeniden bağlama yan etkisi:** `rose/red/pink` artık canlı rengi; dekoratif `text-rose-*` temizlenmezse "her şey canlı" görünür. `emerald-500` (`#85C250`) eskisinden sönük; `bg-emerald-500 text-white` kontrastı düşük (→ `text-done-fg`).
3. **Otomatik regex süpürmeleri** bağlama kör olabilir (örn. Kadınlar 2. Lig'de `text-primary → text-ink-2`); görsel gözden geçirme şart.
4. **`.font-scoreboard` monospace → Space Grotesk:** genişlikler değişir (tabular olduğundan kayma düşük ama `min-w` kontrol et).
5. **Font yükü:** 2 Google fontu (self-host). Mobil performans (skor 64, LCP 5.2 s) bozulmamalı; ağırlık sayısını artırma.
6. **`data-section` kapsamı:** portal'a taşınan öğeler değişkenleri görmez.
7. **Resmi durum renkleri** (`groupStatus.ts`: `#ffff00`, `#00b050`, `#ff0000` …) "kırmızı = canlı" kuralıyla çakışabilir; ayrı karar gerekir (bilinçli dokunulmadı; test hex'e bağlı).
8. **Takım marka renkleri** (`TeamBadge`) korunur; tema ile çelişen takım renkleri olabilir.
9. **SW önbelleği:** `sw.js` sürümünü artırmadan yayınlarsan eski CSS/font önbellekte kalır.
10. **Veri tarafı:** TVF `form` alanı repoda yalnız 0–2 maçlık → form halkaları çoğu zaman 3–5 kesik halka gösterir; hata değil, veri sınırı (nota yazılı).

## 9.4 Bilinen eksikler
- Son kod değişikliklerinden sonra **tam `next build` tamamlanamamıştı** (ilk sürüm exit 0; eski tabanda tsc/eslint/vitest 402/402 temizdi) → yeni tabanda build'i çalıştır.
- `SocialStoryModal`: `document.fonts.load` çağrısı yok (05 §5.3).
- `PwaInstallPrompt` iOS modalı ve `OfflineBanner` amber; kısmen gözden geçirildi.
- Admin hata kutuları yerelde `primary`'e kaydı; `live` daha doğru (08).
- `TeamInspectorPanel` Puan Durumu'nda kullanılmıyor (dosya duruyor).
- Yeni tabana sonradan eklenen `Kadinlar2LigSidebar` (yeniden yazım) ve `SkeletonLoaders` için **elle temalama yapılmadı**; 07'deki tablolar öneridir.
- Kadınlar 2. Lig Sidebar'daki "Altyapı köprüsü" turkuazı bir tasarım önerisidir; onay gerekebilir.

## 9.5 Test edilmeyenler
Gerçek tarayıcıda tüm sayfaların görsel regresyonu; mobil ≤ 390 px; Lighthouse/axe; admin (auth); SocialStoryModal canvas çıktısı; PWA yükleme/manifest davranışı; Supabase/realtime akışları; 81 ilin tüm rotaları; Safari/iOS render; yeni tabanda **tam** tema (yalnız 2 dosya üst üste konarak test paketi çalıştırılmıştı).

## 9.6 Teslim
Hepsi yeşilse yerel dalda commit'le (`git switch -c tema-fileonu`). **Push/PR yalnız kullanıcı açıkça isterse.**
Bu, son aşamadır.
