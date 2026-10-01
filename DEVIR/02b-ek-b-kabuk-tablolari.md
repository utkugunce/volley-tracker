# 02b — Ek B/Ek A: kabuk, gezinme, PWA dosyaları

> Bu dosya `02-kabuk-appshell-header-nav-pwa.md` aşamasının **ek eşleme tablosudur** (özgün raporun Ek B + Ek A satırları, birebir). Önce ana aşama dosyasını oku. Tablolarda "Adet" = o dosyada o sınıf değişiminin sayısı. Aynı eski sınıf bağlama göre farklı yeni değere gidebilir (§6 kuralı). `#64748B → text-ink-3` satırları güncel tabanda `text-[#94A3B8]` olmuş olabilir; o durumda `text-[#94A3B8] → text-ink-2` uygula.

### `public/icon.svg`

| Eski | Yeni | Adet |
|---|---|---|
| `#dc2626` | `#2DD4C0` | 1 |
| `#dc2626` | `#07131F` | 1 |

### `public/sw.js`

_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### `src/app/apple-icon.svg`
Ek A sayımı: satır 8, hex 3, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 0, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `#dc2626` | `#2DD4C0` | 1 |
| `#dc2626` | `#07131F` | 1 |

### `src/app/icon.svg`
Ek A sayımı: satır 52, hex 18, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 0, primary 0, gradyan 0.

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

### `src/components/BrandLogo.tsx`
Ek A sayımı: satır 141, hex 16, kırmızı/pembe 2, zümrüt 0, kehribar 1, mavi 0, mor 0, slate 1, primary 0, gradyan 1.

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

### `src/components/CitySelector.tsx`
Ek A sayımı: satır 197, hex 3, kırmızı/pembe 0, zümrüt 5, kehribar 1, mavi 0, mor 0, slate 22, primary 4, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `text-primary` | `text-ink-2` | 2 |
| `bg-[#0b1325]` | `bg-surface-muted` | 2 |
| `bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono font-bold` | `font-display font-semibold tabular-nums text-ink-2` | 1 |
| `bg-[#0f172a]` | `bg-canvas` | 1 |
| `text-white` | `text-primary-fg` | 1 |

### `src/components/CityTabBar.tsx`
Ek A sayımı: satır 260, hex 3, kırmızı/pembe 4, zümrüt 4, kehribar 0, mavi 0, mor 0, slate 29, primary 7, gradyan 1.

_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### `src/components/Header.tsx`
Ek A sayımı: satır 303, hex 1, kırmızı/pembe 8, zümrüt 7, kehribar 6, mavi 0, mor 0, slate 71, primary 10, gradyan 7.

| Eski | Yeni | Adet |
|---|---|---|
| `from-red-950/30` | `from-primary/10` | 6 |
| `bg-[#080c14]/90` | `bg-canvas/90` | 1 |
| `bg-rose-700 text-white px-1.5 py-0.5 rounded-full font-mono font-bold shadow-xs` | `text-ink-2 font-display font-semibold normal-case tracking-normal` | 1 |
| `bg-emerald-500` | `bg-done` | 1 |
| `text-white` | `text-done-fg` | 1 |
| `text-[9px] sm:text-[10px] bg-red-700 text-white px-1.5 py-0.5 rounded-full font-mono font-bold shadow-xs` | `text-[10px] sm:text-[11px] text-ink-2 font-display font-semibold normal-case tracking-normal tabular-nums` | 1 |
| `text-[9px] sm:text-[10px] bg-slate-800/80 text-slate-300 px-1.5 py-0.2 rounded-full font-normal border border-slate-700/50` | `text-[10px] font-display font-semibold tabular-nums text-ink-2` | 1 |

### `src/components/MobileBottomNav.tsx`
Ek A sayımı: satır 137, hex 5, kırmızı/pembe 6, zümrüt 0, kehribar 0, mavi 5, mor 0, slate 0, primary 0, gradyan 0.

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

### `src/components/NotificationBanner.tsx`
Ek A sayımı: satır 133, hex 0, kırmızı/pembe 0, zümrüt 4, kehribar 0, mavi 9, mor 0, slate 5, primary 2, gradyan 1.

| Eski | Yeni | Adet |
|---|---|---|
| `hover:bg-primary/90 text-white` | `text-primary-fg font-bold shadow-glow-primary` | 1 |

### `src/components/PwaInstallPrompt.tsx`
Ek A sayımı: satır 179, hex 0, kırmızı/pembe 5, zümrüt 0, kehribar 6, mavi 1, mor 0, slate 9, primary 5, gradyan 1.

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

### `src/components/layout/AppShell.tsx`
Ek A sayımı: satır 105, hex 1, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 1, mor 0, slate 0, primary 0, gradyan 0.

_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### `src/components/layout/LeftSidebarPlaceholder.tsx`
Ek A sayımı: satır 198, hex 40, kırmızı/pembe 1, zümrüt 0, kehribar 6, mavi 18, mor 5, slate 0, primary 0, gradyan 0.

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

### `src/components/layout/RightSidebarPlaceholder.tsx`
Ek A sayımı: satır 270, hex 50, kırmızı/pembe 4, zümrüt 4, kehribar 4, mavi 16, mor 0, slate 0, primary 0, gradyan 0.

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

### `src/components/layout/SidebarNavigation.tsx`
Ek A sayımı: satır 313, hex 36, kırmızı/pembe 1, zümrüt 0, kehribar 5, mavi 17, mor 5, slate 0, primary 0, gradyan 0.

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

### `src/components/__tests__/MobileBottomNav.test.tsx`

| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |

### `src/components/layout/__tests__/MainLayout.test.tsx`

| Eski | Yeni | Adet |
|---|---|---|
| `Sofascore koyu renk s flar (bg-[#121212], border-[#2A2E3D], bg-[#1E222D])` | `File token lar (canvas #07131F, panel #0E2033, line #1B3550)` | 1 |
| `#121212` | `#07131F` | 1 |
| `text-[#F1F5F9]` | `text-ink` | 1 |
| `#1E222D` | `#0E2033` | 1 |
| `#2A2E3D` | `#1B3550` | 1 |

---
Ana aşama dosyasına dön: `02-kabuk-appshell-header-nav-pwa.md`
