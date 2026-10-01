# 06b — Ek B/Ek A: takım, karşılaştırma, lig hub, grup durumu dosyaları

> Bu dosya `06-takim-karsilastirma-lig-grup.md` aşamasının **ek eşleme tablosudur** (özgün raporun Ek B + Ek A satırları, birebir). Önce ana aşama dosyasını oku. Tablolarda "Adet" = o dosyada o sınıf değişiminin sayısı. Aynı eski sınıf bağlama göre farklı yeni değere gidebilir (§6 kuralı). `#64748B → text-ink-3` satırları güncel tabanda `text-[#94A3B8]` olmuş olabilir; o durumda `text-[#94A3B8] → text-ink-2` uygula.

### `src/components/TeamDetailClient.tsx`
Ek A sayımı: satır 806, hex 8, kırmızı/pembe 19, zümrüt 13, kehribar 46, mavi 16, mor 13, slate 105, primary 17, gradyan 2.

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

### `src/components/TeamRosterView.tsx`
Ek A sayımı: satır 349, hex 20, kırmızı/pembe 5, zümrüt 0, kehribar 0, mavi 1, mor 0, slate 29, primary 0, gradyan 0.

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

### `src/components/VolleyballCourtView.tsx`
Ek A sayımı: satır 208, hex 6, kırmızı/pembe 7, zümrüt 0, kehribar 7, mavi 4, mor 0, slate 17, primary 0, gradyan 4.

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

### `src/components/TeamVolleyboxLink.tsx`
Ek A sayımı: satır 139, hex 0, kırmızı/pembe 0, zümrüt 1, kehribar 4, mavi 0, mor 0, slate 2, primary 1, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `hover:text-primary` | `hover:text-ink` | 1 |

### `src/app/takim/[slug]/page.tsx`
Ek A sayımı: satır 78, hex 0, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 5, primary 2, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `hover:bg-primary/90 text-white shadow-md` | `text-primary-fg shadow-glow-primary` | 1 |

### `src/app/karsilastir/CompareClient.tsx`
Ek A sayımı: satır 843, hex 9, kırmızı/pembe 4, zümrüt 8, kehribar 19, mavi 35, mor 2, slate 123, primary 11, gradyan 10.

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

### `src/app/karsilastir/page.tsx`
Ek A sayımı: satır 58, hex 0, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 1, primary 0, gradyan 0.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

### `src/components/league/LeagueHubClient.tsx`
Ek A sayımı: satır 1060, hex 7, kırmızı/pembe 5, zümrüt 27, kehribar 21, mavi 29, mor 1, slate 135, primary 15, gradyan 5.

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

### `src/components/GroupStatusView.tsx`
Ek A sayımı: satır 539, hex 9, kırmızı/pembe 1, zümrüt 1, kehribar 1, mavi 1, mor 1, slate 73, primary 11, gradyan 2.

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

### `src/utils/groupStatus.ts`
Ek A sayımı: satır 335, hex 21, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 0, primary 0, gradyan 0.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

### `src/components/LeagueVolleyboxLink.tsx`
Ek A sayımı: satır 55, hex 0, kırmızı/pembe 0, zümrüt 1, kehribar 1, mavi 0, mor 0, slate 1, primary 0, gradyan 0.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

### `src/components/TeamBadge.tsx`
Ek A sayımı: satır 153, hex 0, kırmızı/pembe 11, zümrüt 3, kehribar 16, mavi 7, mor 3, slate 7, primary 0, gradyan 12.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

---
Ana aşama dosyasına dön: `06-takim-karsilastirma-lig-grup.md`
