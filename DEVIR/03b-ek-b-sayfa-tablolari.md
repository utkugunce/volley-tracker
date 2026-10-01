# 03b — Ek B/Ek A: ana sayfa, fikstür, günün maçları, sonuçlar dosyaları

> Bu dosya `03-anasayfa-fikstur-gunun-maclari-sonuclar.md` aşamasının **ek eşleme tablosudur** (özgün raporun Ek B + Ek A satırları, birebir). Önce ana aşama dosyasını oku. Tablolarda "Adet" = o dosyada o sınıf değişiminin sayısı. Aynı eski sınıf bağlama göre farklı yeni değere gidebilir (§6 kuralı). `#64748B → text-ink-3` satırları güncel tabanda `text-[#94A3B8]` olmuş olabilir; o durumda `text-[#94A3B8] → text-ink-2` uygula.

### `src/components/DashboardClient.tsx`
Ek A sayımı: satır 1930, hex 20, kırmızı/pembe 10, zümrüt 23, kehribar 37, mavi 35, mor 0, slate 76, primary 6, gradyan 5.

_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### `src/components/DateRibbon.tsx`
Ek A sayımı: satır 237, hex 0, kırmızı/pembe 10, zümrüt 12, kehribar 4, mavi 4, mor 0, slate 22, primary 5, gradyan 6.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red ring-2 ring-red-500/30` | `bg-selected-strong shadow-glow-selected` | 3 |
| `text-rose-400` | `text-ink-2` | 1 |

### `src/components/FeaturedMatchHero.tsx`
Ek A sayımı: satır 343, hex 2, kırmızı/pembe 15, zümrüt 4, kehribar 18, mavi 1, mor 0, slate 36, primary 1, gradyan 3.

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

### `src/components/FilterBar.tsx`
Ek A sayımı: satır 374, hex 0, kırmızı/pembe 10, zümrüt 13, kehribar 15, mavi 0, mor 0, slate 55, primary 7, gradyan 4.

| Eski | Yeni | Adet |
|---|---|---|
| `focus:border-red-500` | `focus:border-primary/40` | 2 |
| `focus-visible:ring-red-500/30` | `focus-visible:ring-primary/30` | 2 |
| `bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red ring-2 ring-red-500/30` | `bg-primary text-primary-fg shadow-glow-primary` | 1 |
| `min-w-5 h-5 px-1 rounded-full bg-primary text-white text-[10px] flex items-center justify-center` | `text-[11px] font-display tabular-nums text-primary` | 1 |
| `bg-gradient-to-r from-red-600 to-rose-600 shadow-xs ring-1 ring-red-500/40` | `bg-selected-strong shadow-glow-selected` | 1 |

### `src/components/FixtureTable.tsx`
Ek A sayımı: satır 926, hex 3, kırmızı/pembe 29, zümrüt 13, kehribar 102, mavi 6, mor 0, slate 126, primary 1, gradyan 8.

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

### `src/components/HomePortalView.tsx`
Ek A sayımı: satır 684, hex 3, kırmızı/pembe 26, zümrüt 13, kehribar 13, mavi 8, mor 0, slate 61, primary 0, gradyan 1.

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

### `src/components/PrimaryTeamWidget.tsx`
Ek A sayımı: satır 253, hex 4, kırmızı/pembe 5, zümrüt 0, kehribar 9, mavi 1, mor 0, slate 24, primary 0, gradyan 1.

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

### `src/components/TodayMatchesView.tsx`
Ek A sayımı: satır 974, hex 0, kırmızı/pembe 29, zümrüt 15, kehribar 52, mavi 29, mor 0, slate 103, primary 8, gradyan 11.

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

### `src/components/match/CompactMatchFeed.tsx`
Ek A sayımı: satır 203, hex 6, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 2, mor 0, slate 0, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `border-[#2A2E3D]` | `border-line` | 2 |
| `bg-[#181A20]` | `bg-surface-muted` | 1 |
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `text-[#64748B]` | `text-ink-3` | 1 |
| `text-[#94A3B8]` | `text-ink-2` | 1 |

### `src/components/match/CompactMatchRow.tsx`
Ek A sayımı: satır 275, hex 16, kırmızı/pembe 2, zümrüt 5, kehribar 25, mavi 6, mor 0, slate 8, primary 0, gradyan 0.

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

### `src/components/match/DateNavigationRibbon.tsx`
Ek A sayımı: satır 209, hex 23, kırmızı/pembe 2, zümrüt 4, kehribar 0, mavi 8, mor 0, slate 2, primary 0, gradyan 0.

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

### `src/components/match/LeagueSection.tsx`
Ek A sayımı: satır 125, hex 12, kırmızı/pembe 0, zümrüt 0, kehribar 2, mavi 1, mor 0, slate 0, primary 0, gradyan 0.

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

### `src/components/realtime/LiveMatchScore.tsx`
Ek A sayımı: satır 98, hex 0, kırmızı/pembe 8, zümrüt 4, kehribar 4, mavi 0, mor 0, slate 6, primary 0, gradyan 0.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

---
Ana aşama dosyasına dön: `03-anasayfa-fikstur-gunun-maclari-sonuclar.md`
