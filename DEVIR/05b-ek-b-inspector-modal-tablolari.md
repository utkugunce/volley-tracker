# 05b — Ek B/Ek A: inspector, drawer, modal dosyaları

> Bu dosya `05-inspector-lazy-modallar.md` aşamasının **ek eşleme tablosudur** (özgün raporun Ek B + Ek A satırları, birebir). Önce ana aşama dosyasını oku. Tablolarda "Adet" = o dosyada o sınıf değişiminin sayısı. Aynı eski sınıf bağlama göre farklı yeni değere gidebilir (§6 kuralı). `#64748B → text-ink-3` satırları güncel tabanda `text-[#94A3B8]` olmuş olabilir; o durumda `text-[#94A3B8] → text-ink-2` uygula.

### `src/components/MatchCenterDrawer.tsx`
Ek A sayımı: satır 403, hex 4, kırmızı/pembe 18, zümrüt 7, kehribar 19, mavi 0, mor 0, slate 50, primary 2, gradyan 3.

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

### `src/components/SpotlightSearchModal.tsx`
Ek A sayımı: satır 301, hex 1, kırmızı/pembe 3, zümrüt 0, kehribar 3, mavi 3, mor 0, slate 18, primary 1, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#080c14]` | `bg-canvas` | 1 |
| `bg-red-500/15` | `bg-primary/15` | 1 |
| `text-red-400` | `text-primary` | 1 |
| `border-red-500/30` | `border-primary/30` | 1 |

### `src/components/SocialStoryModal.tsx`
Ek A sayımı: satır 321, hex 20, kırmızı/pembe 4, zümrüt 3, kehribar 1, mavi 0, mor 0, slate 12, primary 0, gradyan 1.

_(yapısal yeniden yazım — bkz. §9 ve ilgili bölüm)_

### `src/components/MobileMatchDrawer.tsx`
Ek A sayımı: satır 116, hex 2, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 2, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-[#1E222D]` | `bg-panel` | 1 |
| `border-[#2A2E3D]` | `border-line` | 1 |

### `src/components/match/MatchInspectorPanel.tsx`
Ek A sayımı: satır 804, hex 103, kırmızı/pembe 17, zümrüt 17, kehribar 10, mavi 23, mor 0, slate 5, primary 0, gradyan 1.

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

### `src/components/match/SetScoreMatrix.tsx`
Ek A sayımı: satır 194, hex 19, kırmızı/pembe 0, zümrüt 4, kehribar 2, mavi 4, mor 0, slate 2, primary 0, gradyan 0.

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

### `src/components/TeamInspectorPanel.tsx`
Ek A sayımı: satır 151, hex 15, kırmızı/pembe 1, zümrüt 4, kehribar 4, mavi 3, mor 0, slate 10, primary 0, gradyan 0.

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

### `src/components/FormBadge.tsx`
Ek A sayımı: satır 57, hex 0, kırmızı/pembe 3, zümrüt 3, kehribar 0, mavi 0, mor 0, slate 1, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-glow-emerald` | `bg-transparent text-done border-done` | 1 |
| `bg-rose-500/25` | `bg-transparent` | 1 |
| `text-rose-300` | `text-form-loss` | 1 |
| `border-rose-500/50` | `border-form-loss` | 1 |

---
Ana aşama dosyasına dön: `05-inspector-lazy-modallar.md`
