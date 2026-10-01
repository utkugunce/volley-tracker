# 08b — Ek B/Ek A: admin ve kalan dosyalar

> Bu dosya `08-admin-kalan-testler.md` aşamasının **ek eşleme tablosudur** (özgün raporun Ek B + Ek A satırları, birebir). Önce ana aşama dosyasını oku. Tablolarda "Adet" = o dosyada o sınıf değişiminin sayısı. Aynı eski sınıf bağlama göre farklı yeni değere gidebilir (§6 kuralı). `#64748B → text-ink-3` satırları güncel tabanda `text-[#94A3B8]` olmuş olabilir; o durumda `text-[#94A3B8] → text-ink-2` uygula.

### `src/app/admin/page.tsx`
Ek A sayımı: satır 1920, hex 0, kırmızı/pembe 36, zümrüt 30, kehribar 11, mavi 18, mor 1, slate 210, primary 52, gradyan 1.

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

### `src/components/realtime/LiveScoreIndicator.tsx`
Ek A sayımı: satır 63, hex 0, kırmızı/pembe 3, zümrüt 3, kehribar 0, mavi 0, mor 0, slate 4, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-red-950/80` | `bg-warn/10` | 1 |
| `text-red-400` | `text-warn` | 1 |
| `border-red-800` | `border-warn/40` | 1 |

### `src/components/realtime/RealtimeErrorHandler.tsx`
Ek A sayımı: satır 77, hex 0, kırmızı/pembe 8, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 0, primary 0, gradyan 0.

| Eski | Yeni | Adet |
|---|---|---|
| `bg-red-950/90` | `bg-primary/10` | 1 |
| `border-red-800` | `border-primary/40` | 1 |
| `bg-red-900/50` | `bg-primary/10` | 1 |
| `hover:bg-red-900/70` | `hover:bg-primary/10` | 1 |
| `text-red-300` | `text-primary` | 1 |
| `text-red-400` | `text-ink-2` | 1 |

### `src/components/PrintScheduleButton.tsx`
Ek A sayımı: satır 33, hex 0, kırmızı/pembe 0, zümrüt 0, kehribar 0, mavi 0, mor 0, slate 6, primary 0, gradyan 0.

_Ek B'de eşleme tablosu yok (dosya Ek A/§11'de geçer; kural için aşamanın ana dosyasına bak)._

---
Ana aşama dosyasına dön: `08-admin-kalan-testler.md`
