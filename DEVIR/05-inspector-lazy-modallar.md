# 05 — Inspector panelleri + lazy-load modallar

> Önce 00–04. Taban `dea2414`, Node 22, push yok. Kapsam: `match/MatchInspectorPanel.tsx`, `match/SetScoreMatrix.tsx`, `TeamInspectorPanel.tsx`, `FormBadge.tsx`, `MatchCenterDrawer.tsx`, `SpotlightSearchModal.tsx`, `SocialStoryModal.tsx`, `MobileMatchDrawer.tsx`.

## Kısa palet/kural özeti
canvas `#07131F` · panel `#0E2033` · surface-muted `#0A1A2B` · raised `#13293F` · line `#1B3550` · ink `#EAF6FA` · ink-2 `#A9C3D1` · ink-3 `#8CA8B8` · primary `#2DD4C0` (fg `#032320`) · live `#FF6E82` (fg `#2B0A10`) · done `#9BE15D` · form-loss `#FF8FA0` · warn `#FFC24D` · selected `#5B9DFF`/strong `#2A63BD`/text `#7FB4FF`.
Kurallar: kırmızı yalnız CANLI/hata; form rozetleri **dolu renk yerine halka**: G → `bg-transparent text-done border border-done`; M → `bg-transparent text-form-loss border border-form-loss`; `font-scoreboard tabular-nums` **silinmez** (test); birincil `bg-primary text-primary-fg shadow-glow-primary`.

## 5.1 Lazy-load (next/dynamic) — temadan kaçmama
Hepsi `ssr:false`. **"Ana sayfada görünmüyor" diye dışarıda bırakma**: drawer/spotlight/story etkileşimde açılır ve en çok eski kırmızıyı taşıyanlardır (`MatchCenterDrawer`: `shadow-glow-red`, `bg-red-600`, `bg-red-950/*`).
| Bileşen | Nerede dinamik |
|---|---|
| `MatchCenterDrawer` | `kadinlar-2-lig/Kadinlar2LigClient.tsx`, `league/LeagueHubClient.tsx` |
| `SpotlightSearchModal` | `Kadinlar2LigClient`, `LeagueHubClient`, `DashboardClient` |
| `SocialStoryModal` | `MatchCenterDrawer.tsx` içinde |
| `HomePortalView`, `CompactMatchFeed`, `StandingsTable`, `TeamInspectorPanel`, `GroupStatusView`, `MobileMatchDrawer`, `NotificationBanner` | `DashboardClient` (`loading: TabViewLoading` → `TabViewSkeleton`; iskelet temalı olmalı → 07) |
- **Tailwind JIT** `content` glob'u ile kaynaklardan sınıf toplar; ayrı chunk CSS'i etkilemez. Sınıf adını dinamik üretme (`` `bg-${tone}` ``) → tam dize yaz.
- Global CSS değişkenleri (`:root`, `[data-section]`) ve `next/font` değişkenleri (`<html className>`) tüm chunk'lara/DOM'a miras kalır.
- `loading` verilecekse **temalı** (`bg-surface border-line animate-pulse`) olmalı → renk sıçraması/CLS yok.
- **`data-section` ve modal:** üçü de şu an `fixed inset-0 z-50` olarak React ağacında render edilir (`createPortal` yok). `Kadinlar2LigClient` (AppShell) altında açılınca `[data-section="kadinlar-2-lig"]` değişkenlerini miras alır (drawer birincil düğmesi **orkide** → istenen); `LeagueHubClient`/`DashboardClient` altında turkuaz. İleride `createPortal(document.body)` eklenirse `data-section` sarmalayıcıyla ayrıca verilmeli. canlı/bitti/seçili/uyarı token'ları sabit; bölümden etkilenmez.

## 5.2 Dosya eşlemeleri (özet; tam tablolar `05b-ek-b-inspector-modal-tablolari.md`)
| Dosya | Önemli eşlemeler |
|---|---|
| `MatchCenterDrawer.tsx` | zemin `from-[#0b1220] via-[#080c14] to-[#050810] → from-canvas via-canvas to-canvas`; CANLI rozeti `bg-red-950/90 text-red-300 border-red-500 animate-pulse` → `bg-live/15 text-live border-live/50` (nabız gerekirse yalnız canlı maçta); birincil `bg-red-600 hover:bg-red-500 … shadow-glow-red` → `bg-primary text-primary-fg shadow-glow-primary` ×2; ev seti rozeti `bg-red-950/60 text-red-200 border-red-800/80` → `bg-surface-raised text-ink-2 border-line`; `font-scoreboard tabular-nums` kalır. |
| `SpotlightSearchModal.tsx` | `bg-[#080c14] → bg-canvas`, seçili sonuç `bg-red-500/15 text-red-400 border-red-500/30 → bg-primary/15 text-primary border-primary/30`. |
| `MobileMatchDrawer.tsx` | `bg-[#1E222D] → bg-panel`, `border-[#2A2E3D] → border-line`. |
| `FormBadge.tsx` | G: `bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-glow-emerald → bg-transparent text-done border-done`; M: `bg-rose-500/25 text-rose-300 border-rose-500/50 → bg-transparent text-form-loss border-form-loss`. |
| `TeamInspectorPanel.tsx` | `border-[#2A2E3D] → border-line` ×5, `bg-[#181A20] → bg-surface-muted` ×4, `bg-[#1E222D] → bg-panel`, `bg-[#121212] → bg-canvas`; form hapları halka. (Puan Durumu'nda artık **kullanılmıyor** (04); dosya durur, yine de temala.) |
| `match/MatchInspectorPanel.tsx` | `border-[#2A2E3D] → border-line` ×19, `text-[#94A3B8] → text-ink-2` ×16, `bg-[#181A20] → bg-surface-muted` ×12, `bg-[#1E222D] → bg-panel` ×9, `text-[#CBD5E1] → text-slate-200` ×10; form hapları `bg-emerald-600/30 text-emerald-300 border-emerald-500/40 → bg-transparent text-done border-done`; `bg-rose-600/30 text-rose-300 border-rose-500/40 → bg-transparent text-form-loss border-form-loss`. |
| `match/SetScoreMatrix.tsx` | `border-[#2A2E3D] → border-line` ×3, `text-[#94A3B8] → text-ink-2` ×3, `bg-[#181A20] → bg-surface-muted` ×2, `bg-[#12141A] → bg-canvas`; `text-slate-500`, `text-blue-300`, `text-emerald-400` **kalır** (test); `font-scoreboard tabular-nums` kalır. |
| `SocialStoryModal.tsx` | §5.3 (canvas). Özgün Ek B: "yapısal yeniden yazım" (tablo yok). Ek A: hex 20, kırmızı/pembe 4, zümrüt 3, slate 12. |
Güncel tabanda `#64748B→#94A3B8` yapıldığı için `text-[#64748B] → text-ink-3` satırları (MatchInspectorPanel 10, SetScoreMatrix 1) şimdi `text-[#94A3B8] → text-ink-2` uygulanır (küçük ipucu için `text-ink-3` tercih edilebilir).

## 5.3 `SocialStoryModal` canvas (CSS sınıfı yok: sabit hex + font dizgesi)
- **Font:** `'Museo Sans'` ×8 yer → `next/font` CSS değişkeninden okunan gerçek aile adı:
```ts
const cs = getComputedStyle(document.documentElement);
const FONT_BODY = (cs.getPropertyValue("--font-manrope").trim() || "Manrope") + ", system-ui, sans-serif";
const FONT_NUM  = (cs.getPropertyValue("--font-space-grotesk").trim() || "Space Grotesk") + ", system-ui, sans-serif";
ctx.font = `700 32px ${FONT_BODY}`;   // ağırlık ≤ 800 (Manrope) / ≤ 700 (Space Grotesk); 900 yüklü DEĞİL
```
- **Önerilen (yerelde eklenmedi = bilinen eksik):** çizimden önce `await document.fonts.load("700 32px " + FONT_BODY)` (ve numerik font).
- **Renkler:** zemin gradyanı `#07131F → #0E2033 → #0A1A2B → #07131F`; rozet `#2DD4C0` üstü `#032320`; metinler `#EAF6FA / #A9C3D1 / #8CA8B8`; vurgular `#7FB4FF` ve `#FFC24D`; kırmızı gradyanlar kaldırıldı. Güncel tabandaki filigran `ctx.fillStyle = "#94a3b8"` → `#8CA8B8`.
- DOM kısmı (kapsayıcı, düğmeler) token'lı.
- `MatchCenterDrawer.test.tsx` artık `await screen.findByText("Instagram & WhatsApp Hikaye Kartı")` (dinamik yükleme asenkron) — bozma.

## 5.4 Testler
`MatchCenterDrawer.test.tsx`: `await findByText` korunur. `SetScoreMatrix.test`, `ScoreboardTypography.test`: sınıfları silme. `CompactMatchRow`/`SetScoreMatrix` form halkası değişikliği test sınıflarını etkilemez.

## 5.5 Lazy bileşen kontrol listesi (elle)
1. Kadınlar 2. Lig'te maç aç → drawer birincil düğmesi orkide, CANLI rozeti mercan, set rozetleri token'lı.
2. Altyapı Lig Hub'da aynı drawer → turkuaz.
3. `Ctrl/Cmd+K` Spotlight → seçili öğe `primary/15`.
4. Hikaye Kartı → canvas Manrope/Space Grotesk; PNG indirilebilir; Türkçe harfler doğru.
5. Ağ sekmesi: chunk yüklenirken CSS 404 yok; fontlar self-host.

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run         # 63 dosya / 416 test (+önceki aşamaların yeni testleri)
rg -n "Museo|museo" src/components/SocialStoryModal.tsx   # sonuç yok
rg -n "shadow-glow-red|bg-red-600|bg-red-950" src/components/MatchCenterDrawer.tsx   # sonuç yok
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|CBD5E1)\]" src/components/match src/components/TeamInspectorPanel.tsx src/components/MobileMatchDrawer.tsx --glob '!**/__tests__/**'   # sonuç yok
```

## Sonraki aşama
→ `06-takim-karsilastirma-lig-grup.md` (TeamDetailClient, TeamRosterView, VolleyballCourtView, CompareClient, LeagueHubClient, GroupStatusView).
