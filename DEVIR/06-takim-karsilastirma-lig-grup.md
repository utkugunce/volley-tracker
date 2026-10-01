# 06 — Takım detay, karşılaştırma, lig hub, grup durumu

> Önce 00–05. Taban `dea2414`, Node 22, push yok. Kapsam: `TeamDetailClient.tsx`, `TeamRosterView.tsx`, `VolleyballCourtView.tsx`, `TeamVolleyboxLink.tsx`, `app/takim/[slug]/page.tsx`, `app/karsilastir/CompareClient.tsx` (+`page.tsx`), `league/LeagueHubClient.tsx`, `GroupStatusView.tsx`, `utils/groupStatus.ts` (DOKUNMA), `TeamBadge.tsx` (DOKUNMA), `LeagueVolleyboxLink.tsx`.

## Kısa palet/kural özeti
canvas `#07131F` · panel `#0E2033` · surface-muted `#0A1A2B` · raised `#13293F` · line `#1B3550` · ink `#EAF6FA` · ink-2 `#A9C3D1` · primary `#2DD4C0` (fg `#032320`) · selected `#5B9DFF`/strong `#2A63BD`/text `#7FB4FF` · done `#9BE15D` (fg `#0B2A05`) · warn `#FFC24D` · form-loss `#FF8FA0` · live `#FF6E82` · orchid/fuchsia `#D98BFF`.
Kurallar: **sekme seçili = `bg-selected-strong font-bold shadow-glow-selected`** (eskiden `bg-primary` hem seçili hem ana eylemdi; şimdi ayrı); ana eylem `bg-primary text-primary-fg shadow-glow-primary`; `hover:bg-primary/90`+`text-white` → `text-primary-fg`; form rozetleri halka; renkli sayı hapı yok.

## ⛔ Dokunma
- `src/utils/groupStatus.ts`: 21 sabit hex = **resmi TVF/Volleybox durum renkleri**; `groupStatus.test.ts` hex'e bağlı. Bilinçli istisna. (Risk: `#ff0000` vb. "kırmızı=canlı" anlam kuralıyla çakışabilir; ayrı karar gerekir — 09.)
- `TeamBadge.tsx`: takım marka gradyanları (takım kimliği).

## 6.1 Sayfa hedefleri
| Sayfa | Hedef |
|---|---|
| **Takım detayı** `/takim/[slug]` | Başlık gradyanı `from-primary/10 to-canvas/60`; sekmeler seçili mavi; form rozetleri halka; kort `#0E2F4D, #0A2038, #07131F`, libero `warn`, seçili oyuncu mavi; grafik stroke `#1B3550`, `#9BE15D`. Kadınlar 2. Lig rozeti fuchsia (= orkide). |
| **Karşılaştır** `/karsilastir` | Gradyan `from-canvas via-surface-muted to-panel`; grafik: A takımı `#2DD4C0`, B takımı `#7FB4FF`, eksen `#A9C3D1`, ızgara `#1B3550`/`#2A4560`; kaybeden `text-form-loss`. |
| **Lig Hub** `/lig/[...slug]` (1060 satır; `dynamic` MatchCenterDrawer + SpotlightSearchModal) | Kök `bg-canvas`, hero `from-surface-muted via-canvas to-canvas`; sekmeler seçili `bg-selected-strong font-bold shadow-glow-selected`; `selection:bg-primary/30`; "tamamlandı" yeşil `bg-done text-done-fg`. |
| **Grup Durumu** `/grup-durumu` | `<h1>` korunur. Resmi durum renkleri **aynen**; `#1f497d` → `selected-strong`; il sayacı sade metin; birincil düğme `bg-primary text-primary-fg`. |
Yapı değişmez (hepsi yalnız renk). Rota dosyası: `/lig/[...slug]` → `src/app/lig/[...slug]/page.tsx` (`LeagueHubClient`; sayfa dosyasında renk yok, dokunma).

## 6.2 Dosya eşlemeleri (özet; tam tablolar `06b-ek-b-takim-lig-grup-tablolari.md`)
| Dosya | Önemli eşlemeler |
|---|---|
| `TeamDetailClient.tsx` (26 satır Ek B) | Başlık gradyanı `from-red-950/50 to-[#1e1b4b]/60 → from-primary/10 to-canvas/60`; birincil `hover:bg-primary/90 text-white shadow-sm → text-primary-fg shadow-glow-primary`; sekme `bg-primary shadow-xs → bg-selected-strong font-bold shadow-glow-selected` ×3; grafik `#334155 → #1B3550`, `#10b981 → #9BE15D`; kaybeden `text-rose-400 → text-form-loss`. |
| `TeamRosterView.tsx` | `border-[#162342\|#1b2b52\|#1b2a4d\|#172547] → border-panel`, `bg-[#0c1630] → bg-surface-muted`, `bg-[#0a1226\|#080f24] → bg-canvas`, `bg-red-600 → bg-primary` + `text-white → text-primary-fg`, `*-pink-500 → *-primary`. |
| `VolleyballCourtView.tsx` | kort `from-[#0b3b60] via-[#072640] to-[#041525] → from-[#0E2F4D] via-[#0A2038] to-[#07131F]`, `bg-[#072640] → bg-[#0A2038]`, `border-[#38bdf8]/40 → border-blue-400/40`; seçili oyuncu `bg-red-600/30 border-red-400 shadow-glow-red → bg-selected/20 border-selected shadow-glow-selected`; yer tutucu gradyan → `bg-surface-raised border border-line`. |
| `TeamVolleyboxLink.tsx` | `hover:text-primary → hover:text-ink`. (`LeagueVolleyboxLink` ölçek bağlamasıyla otomatik.) |
| `app/takim/[slug]/page.tsx` | `hover:bg-primary/90 text-white shadow-md → text-primary-fg shadow-glow-primary`. |
| `app/karsilastir/CompareClient.tsx` | stroke `#38bdf8 → #2DD4C0`, `#818cf8 → #7FB4FF`, `#94a3b8 → #A9C3D1`, `#334155 → #1B3550`, `#475569 → #2A4560`; `text-rose-400 → text-form-loss` ×2; gradyan `from-[#0f172a] via-[#0b1325] to-[#1e293b] → from-canvas via-surface-muted to-panel`. |
| `league/LeagueHubClient.tsx` | `bg-primary shadow-glow-red → bg-selected-strong font-bold shadow-glow-selected` ×5; `bg-[#070b14] → bg-canvas` (+/90), `from-[#0b1325] → from-surface-muted`, `bg-rose-500 / text-white → bg-primary / text-primary-fg`, `bg-emerald-500 text-white → bg-done text-done-fg`, `font-mono → font-display` (1×). `dynamic()` blokları **kalır**. |
| `GroupStatusView.tsx` | `text-primary → text-ink-2` ×2, `via-[#0d1628] → via-surface-muted`, `bg-[#0f172a]/95 → bg-canvas/95`, il sayacı hapı `font-mono font-bold bg-slate-900/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 → font-display font-semibold tabular-nums text-ink-2`, birincil `text-white → text-primary-fg`, `hover:bg-primary/90 → font-bold`, `shadow-md → shadow-glow-primary`; **`bg-[#1f497d]/20 → bg-selected-strong/20`, `hover:bg-[#1f497d]/40 → hover:bg-selected-strong/40`, `border-[#1f497d]/40 → border-selected-strong/40`** (betik yapmaz; elle). |
Ek notlar: `#1f497d` dışında `groupStatus.ts`'e ait hex'ler GroupStatusView'da satır içi kullanılıyorsa **dokunma**.

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run         # 63 dosya / 416 test; groupStatus.test.ts DEĞİŞMEDEN geçmeli
git diff --stat src/utils/groupStatus.ts src/components/TeamBadge.tsx   # boş olmalı
rg -n "from-red-600|to-rose-600|shadow-glow-red" src/components/{TeamDetailClient,TeamRosterView,VolleyballCourtView,GroupStatusView}.tsx src/components/league src/app/karsilastir src/app/takim   # sonuç yok
rg -n "1f497d" src/components/GroupStatusView.tsx   # sonuç yok
```
Elle: takım sayfası sekmeleri mavi, kort renkleri, grafik stroke'ları; karşılaştırma A turkuaz / B mavi; Lig Hub sekmeleri mavi + "tamamlandı" yeşil; Grup Durumu resmi renkler aynen.

## Sonraki aşama
→ `07-kadinlar-2-lig.md` (orkide vurgu, `data-section` kapsamı, `Kadinlar2LigSidebar`, `SkeletonLoaders`).
