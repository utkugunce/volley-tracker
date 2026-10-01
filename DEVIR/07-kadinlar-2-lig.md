# 07 — Kadınlar 2. Lig (orkide vurgu, `data-section`, yeni Sidebar, SkeletonLoaders)

> Önce 00–06 (özellikle 01'deki `[data-section]` CSS bloğu ve 02'deki `AppShell section` prop'u). Taban `dea2414`, Node 22, push yok. Kapsam: `src/components/kadinlar-2-lig/*` (14 dosya) + `common/SkeletonLoaders.tsx`.

## Kısa palet/kural özeti
Zemin/yüzey/çizgi/metin/tipografi ve **tüm anlam renkleri (live/done/selected/warn) Altyapı ile aynıdır**; bölüm yalnız **vurgu rengiyle** ayrışır: **orkide `#D98BFF`**. Eski bölüm kırmızı-pembe (rose) idi; canlı rengiyle karıştığı için kaldırıldı.
| Token (bölüm içi) | Hex | zemin/yüzey/raised kontrast | Not |
|---|---|---|---|
| `--primary` | `#D98BFF` | 8.10 / 7.14 / 6.41 | birincil metin/ikon/çizgi |
| `--primary-hover` | `#E8B1FF` | yüzey 9.55 | hover |
| `--primary-fg` | `#2A0B3A` | orkide dolgu üstü **7.53** | |
| koyu dolgu | `#9333B8` (fuchsia-600) | beyaz yazı **6.17** | |
| `--rank-mid` | `#7FB4FF` | 8.80 / 7.76 / 6.97 | 3–8. sıra **mavi** (mor birincil olduğundan) |
Altyapı tarafı: primary `#2DD4C0`, canvas `#07131F`, panel `#0E2033`, line `#1B3550`, ink-2 `#A9C3D1`. Seçili sekme `bg-selected-strong` (mavi); ana eylem `bg-primary text-primary-fg shadow-glow-primary` (bölümde orkide); sayaç rozeti → sade metin.

## 7.1 Kapsam mekanizması
- CSS (01'de eklendi — burada doğrula):
```css
[data-section="kadinlar-2-lig"] {
  --primary: #d98bff; --primary-rgb: 217 139 255; --primary-hover-rgb: 232 177 255;
  --primary-fg-rgb: 42 11 58; --primary-soft: rgb(217 139 255 / 0.14); --rank-mid-rgb: 127 180 255;
}
```
- `AppShell` (02) kökte `data-section` yazar; **yalnız** `Kadinlar2LigClient` `<AppShell … section="kadinlar-2-lig">` verir.
- Bölüm içinde `bg-primary`, `text-primary`, `border-primary`, `shadow-glow-primary`, `ring-primary`, `from-primary/10` otomatik orkide olur (Tailwind `primary` = `rgb(var(--primary-rgb) / <alpha-value>)`).
- `createPortal(document.body)` ile çıkan öğeler `data-section`'ı görmez (şu an böyle öğe yok; drawer/spotlight/story AppShell altında).
- `TeamDetailClient`'taki fuchsia "Kadınlar 2. Ligi" rozeti ve `Left/SidebarNavigation` içindeki Kadınlar 2. Lig noktası (`bg-pink-500 animate-pulse` → `bg-fuchsia-400`, nabızsız) bölüm **dışında** olduğundan `fuchsia` ölçeğine (= orkide) bağlanır.

## 7.2 Genel kural
Marka amaçlı `rose/red` → `primary` (orkide); etiket/ikon `text-rose-400` → `text-ink-2`; seçili sekme `bg-selected-strong`; birincil `bg-primary text-primary-fg`; sayaç rozeti → sade metin; gerçek canlı/hata `live` kalır.

## 7.3 Dosya eşlemeleri (özet; tam tablolar `07b-ek-b-kadinlar-2-lig-tablolari.md`)
| Dosya | Eşlemeler |
|---|---|
| `Kadinlar2LigClient.tsx` | `section="kadinlar-2-lig"`; yeni `<h1>` bandı ("TVF Kadınlar 2. Ligi — Canlı Puan Durumu & Fikstür"): `border-purple-800/40 → border-line`, nokta `bg-pink-500 animate-pulse → bg-primary` (**nabız yok**; canlı değil), rozet `text-purple-300 bg-purple-950/60 border-purple-800/50 → text-primary bg-primary/10 border-primary/40 font-display tabular-nums`; `dynamic()` (MatchCenterDrawer, SpotlightSearchModal) aynen. |
| `Kadinlar2LigHeader.tsx` | `from-red-950/30 → from-primary/10` ×9, `bg-[#080c14]/90 → bg-canvas/90`; aktif `bg-red-950/80 border-red-500/40 text-red-300 → bg-primary/10 border-primary/40 text-primary`; sayaç `bg-rose-700 text-white … → text-ink-2 font-display tabular-nums`; "Bugün" `bg-emerald-500 text-white → bg-done text-done-fg`. |
| **`Kadinlar2LigSidebar.tsx`** (**yeniden yazıldı; YENİ**) | kök `bg-[#1E222D] → bg-panel`; üst başlık `bg-[#1E222D]/95 border-[#2A2E3D] → bg-panel/95 border-line`; ikon kapsülü `border-rose-500/40 bg-rose-500/15 text-rose-300 → border-primary/40 bg-primary/15 text-primary`; "Maç" sayacı `border-[#2A2E3D] bg-[#121212] text-rose-300 → border-line bg-canvas text-primary font-display tabular-nums`; bölüm kutuları `bg-[#181A20] border-[#2A2E3D] → bg-surface-muted border-line`; aktif satır `border-l-2 border-rose-400 bg-rose-500/10 text-white → border-l-2 border-primary bg-primary/10 text-ink`; grup aktif `bg-rose-500/15 text-rose-200 → bg-primary/15 text-primary`; fikstür bağlantısı aktif `bg-rose-500/20 text-rose-300 border-rose-500/40 → bg-primary/20 text-primary border-primary/40`, hover `hover:text-rose-300 → hover:text-ink`; pasif `text-[#CBD5E1] → text-slate-200`, `text-[#94A3B8] → text-ink-2`; "Takip edilenler" sayacı `bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded → font-display font-semibold tabular-nums text-ink-2`; yıldızlar `text-amber-400` **kalır**. **Altyapı köprüsü** "TVF Altyapı Ligleri · 81 İl →" (Altyapı'ya geçiş; bölümde primary orkide olduğundan **turkuaz sabit**): `bg-blue-950/40 border-blue-800/40 text-blue-200 hover:bg-blue-950/70` → `bg-teal-950/40 border-teal-800/40 text-teal-200 hover:bg-teal-950/70`, nokta `bg-blue-400 → bg-teal-400`, `text-blue-400 → text-teal-300`; `Users text-blue-300 → text-ink-2`. (Turkuaz seçimi bir **tasarım önerisidir**, onay gerekebilir; alternatif: seçili mavi token'larda bırak.) Test `Kadinlar2LigSidebar.test.tsx` yalnız metin/href/click doğrular → sınıf değişimi güvenli. |
| `Kadinlar2LigHomePortal.tsx` | `text-rose-400` ×8–10 → `text-ink-2`; kırmızı gradyan ×3 → `bg-selected-strong shadow-glow-selected`; `bg-rose-500 text-white → bg-primary text-primary-fg`; sayaç rozetleri → sade. (`convertK2MatchToMatch` import'u Antigravity'nin; etkilemez.) |
| `Kadinlar2LigGroupBar.tsx` | gradyan + `ring-2 ring-red-500/30` ×2 → `bg-primary text-primary-fg (font-bold) shadow-glow-primary`; `bg-[#0f172a] → bg-canvas`; `bg-[#0b1325] → bg-surface-muted`; `focus:*-red/rose-500 → focus:*-primary/40`; `bg-rose-500 → bg-primary`. |
| `Kadinlar2LigCompare.tsx` | `text-rose-400` ×7 → `text-ink-2`/`text-primary`; `bg-rose-950/80\|60 → bg-primary/10`, `border-rose-500/40 → border-primary/40`, `border-rose-700/50 → border-primary/50`, `bg-rose-500 → bg-primary`, `from-rose-500/20 → from-primary/20`. |
| `Kadinlar2LigStandings.tsx` | kaybeden sayı `text-rose-400` ×3 → `text-form-loss`; `border-l-emerald-500 bg-emerald-950/15 text-emerald-400 → border-l-primary bg-primary/5 text-primary` (play-off); `border-l-rose-500 bg-rose-950/15 → border-l-line bg-transparent`; `bg-rose-500 → bg-primary`. |
| `StatuView`, `Fixtures`, `Leaders`, `Results`, `Teams`, `TodayMatches`, `MobileNav` | `text-rose-400 → text-ink-2`, birincil gradyan → `bg-primary text-primary-fg`, seçili gradyan → `bg-selected-strong`, `focus:border-red-500 → focus:border-primary/40`, `hover:bg-emerald-500 → hover:bg-done`; MobileNav sayaç `bg-red-600 text-white text-[9px] font-mono → text-primary text-[10px] font-display`, `bg-[#1E222D]→bg-panel`, `border-[#2A2E3D]→border-line`, `shadow-glow-red→shadow-glow-primary`. |

## 7.4 `common/SkeletonLoaders.tsx` (yeni, güncel tabanda, 328 satır — `TabViewSkeleton`)
`bg-[#181A20] → bg-surface-muted`, `bg-[#1E222D] → bg-panel`, `border-[#2A2E3D](/40,/50) → border-line(/40,/50)`, `divide-[#2A2E3D]/50 → divide-line/50`; iskelet çubukları `bg-slate-800/60`, `bg-slate-700/60` ölçek bağlı olduğundan **otomatik** uyar (slate-800 `#1B3550`, slate-700 `#2A4560`); `bg-sky-900/40 → bg-blue-900/40`, `bg-emerald-500/40 → bg-done/40`; satır içi `#2A2E3D` (1×) → `#1B3550`. İskelet kartları **gerçek kartlarla aynı** yüzey/çizgi renklerini kullanmalı (yükleme → gerçek geçişinde sıçrama olmasın). `common/__tests__/SkeletonLoaders.test.tsx`: iskelet kök sınıfında **`animate-pulse` kalmalı** (`className.toContain("animate-pulse")`).
Not: Özgün raporun §15'i bu iki yeni dosya (Sidebar yeniden yazımı, SkeletonLoaders) için "elle temalama yapılmadı; tablolar öneridir" der → dikkatle uygula ve görsel kontrol et.

## 7.5 Testler
`kadinlar-2-lig/__tests__/Kadinlar2LigSidebar.test.tsx` (yeni): yalnız metin/href/click; sınıf bağımsız. Önerilen yeni test: `globals.css` içinde `[data-section="kadinlar-2-lig"]` bloğu var (ve `AppShell` `section` → `data-section`, 02).

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run         # 63 dosya / 416 test; SkeletonLoaders + Kadinlar2LigSidebar testleri yeşil
rg -n "(red|rose|pink)-[0-9]+|from-red|to-rose|shadow-glow-red|bg-gradient-to-" src/components/kadinlar-2-lig   # yalnız gerçek canlı/hata; Compare/Standings kaybeden → form-loss
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src/components/kadinlar-2-lig src/components/common --glob '!**/__tests__/**'   # sonuç yok
rg -n "bg-pink-500 animate-pulse|animate-pulse" src/components/kadinlar-2-lig/Kadinlar2LigClient.tsx   # dekoratif nabız yok
```
Elle (`/kadinlar-2-ligi`, 5 sekme; 1440/768/390): birincil eylemler/aktif sekme **orkide**; seçili sekme mavi; Altyapı köprüsü turkuaz; hero `from-primary/10`; mobil nav aktif orkide; drawer orkide; Puan durumunda 3–8. sıra işareti mavi.

## Sonraki aşama
→ `08-admin-kalan-testler.md` (admin, kalan dosyalar, test güncellemeleri).
