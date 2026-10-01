# 03 — Ana sayfa, Fikstür, Günün Maçları, Sonuçlar (yapı korunur; yalnız renk/tip/rozet)

> Önce 00, 01, 02. Taban `dea2414`, Node 22, push yok.

## Kısa palet/kural özeti
canvas `#07131F` · surface/panel `#0E2033` · surface-muted `#0A1A2B` · raised `#13293F` · line `#1B3550` · ink/ink-2/ink-3 `#EAF6FA/#A9C3D1/#8CA8B8` · primary `#2DD4C0` (fg `#032320`) · live `#FF6E82` (yalnız CANLI/hata) · done `#9BE15D` (fg `#0B2A05`) · selected-strong `#2A63BD` (beyaz yazı 5.80) · selected-text `#7FB4FF` · warn `#FFC24D`.
Anlam: kırmızı yalnız CANLI; ana eylem = `bg-primary text-primary-fg font-bold shadow-glow-primary`; **seçili gezinti/sekme/tarih = `bg-selected-strong text-white font-bold shadow-glow-selected` (mavi, turkuaz DEĞİL)**; kazanan skor sade `text-done font-black` (dolgu yok); sayı rozeti hap yok → `font-display font-semibold tabular-nums text-ink-2`; gradyan düğme yok; dekoratif `animate-pulse` yok.

## ⛔ Kapsam kısıtı (§8.1) — Fikstür ve Günün Maçları
- **Yalnız renk/tipografi.** DOM yapısı, kolonlar, filtre çubukları, sağ `MatchInspectorPanel`, kart/tablo anahtarı, `TodayMatchesView`/`FixtureTable`/`DateRibbon`/`FilterBar`/`CompactMatchFeed` düzeni **aynen kalır**.
- **İzin:** sınıf adı eşleme, kırmızı/pembe dolgu → token, sayı rozeti → sade metin, kazanan skor dolgusu → sade `text-done`, tarih şeridi BUGÜN → `bg-selected-strong`.
- **Yasak:** kolon ekleme/silme, sağ paneli kaldırma, sıralama/filtre mantığı değiştirme, yeni `<h1>`/başlık ekleme (`TodayMatchesView` `<h1>` "Günün Maçları & Canlı Skor Takibi" + altında tarih `<p>` Antigravity tarafından eklendi → **olduğu gibi**).
- `font-mono font-scoreboard tabular-nums` skor hücre sınıflarını **SİLME**: `ScoreboardTypography.test.tsx` bunu zorunlu kılar (`CompactMatchRow`, `SetScoreMatrix` dahil). `min-w-[36px]`, `min-h-[36/38px]` da kalır.
- `DashboardClient.tsx`: `ensureFullData()`, `initialDataPartial`, `TabViewSkeleton`/`loading`, `next/dynamic` blokları, 20 sabit hex'i (token'a) dışında **yapı değişmez**. **Puan Durumu bölümü (h1, `rightSidebar`, `TeamInspectorPanel`) 04'te** yapılır; bu aşamada DashboardClient'ta yalnız renk sınıflarını düzelt.

## 3.0 Rota → dosya haritası (bu aşamanın sayfaları)
| Rota | Dosya | Not |
|---|---|---|
| `/` | `src/app/page.tsx` | `DashboardClient initialTab="home"`; `?city` yoksa `getInitialHomeFixtures()` (`src/utils/getInitialFixtures.ts`) ile **kısmi** veri. Renk yok; **dokunma** |
| `/[city]` | `src/app/[city]/page.tsx` | `DashboardClient` |
| `/fikstur[/city]`, `/gunun-maclari[/city]`, `/sonuclar[/city]` | `src/app/fikstur/…`, `src/app/gunun-maclari/…`, `src/app/sonuclar/…` | `DashboardClient` (fixtures/today/results); sayfa dosyalarında renk yok |

## 3.1 Sayfa hedefleri
| Sayfa | Hedef görünüm |
|---|---|
| **Ana sayfa** `/`, `/[city]` | `<h1>` "Canlı Maç Merkezi & TVF Altyapı Bülteni": nokta `bg-done` (eski `bg-emerald-500 animate-pulse`; nabız yalnız gerçekten canlı maç varken), sayaç `text-ink-2 font-display tabular-nums`. Filtre hapları: seçili "Tümü/Bugün" `bg-selected-strong text-white`, "Bitenler" `bg-done text-done-fg`, "Fikstür" `bg-selected-strong`; pasif `bg-surface-raised text-ink-2`. Şehir hızlı seçim seçili `bg-primary/20 text-primary border-primary/40`. Hero `bg-surface-raised border-line`, canlı rozet `live`, "Maç Merkezi" `bg-primary text-primary-fg shadow-glow-primary`. Alt iki kolon widget (Grup Liderleri `warn` kupa). Ana sayfada standings yalnız liderleri içerir (`getInitialHomeFixtures`) → Grup Liderleri widget'ı tam tablo değildir, dokunma. |
| **Sonuçlar** `/sonuclar` | Tarih şeridi seçili `bg-selected-strong shadow-glow-selected`; "TÜMÜ" pasif `glass-panel text-ink-2`; yeşil (emerald) şerit `done` ile kalabilir. Kazanan skor `text-done font-black` (dolgu yok). |
| **Günün Maçları** | Kart/Tablo anahtarı seçili `bg-selected-strong`; BUGÜN düğmesi `bg-selected-strong` (**mavi**). CANLI rozeti `bg-live/15 text-live border-live/50` (+nabız). Kazanan skor `text-done`. Saat rozeti (sky ölçeği) sınıf aynı. Sağ panel kalır. |
| **Fikstür** | `FilterBar` durum sekmeleri `bg-selected-strong font-bold shadow-glow-selected`; birincil "Filtreleri Sıfırla" `bg-primary text-primary-fg`. Saat/salon farkı `warn` kalır. Favori yıldız `warn`. |
Not: `gercek-gunun-maclari.png` (eski tabana ait) BUGÜN'ü turkuaz gösteriyordu; yeni uygulamada **mavi** olmalı (DateRibbon `bg-selected-strong`).

## 3.2 Dosya eşlemeleri (özet; tam tablolar `03b-ek-b-sayfa-tablolari.md`)
| Dosya | Önemli eşlemeler |
|---|---|
| `FilterBar.tsx` | birincil gradyan + `ring-2 ring-red-500/30` → `bg-primary text-primary-fg shadow-glow-primary`; durum sekmesi gradyanı → `bg-selected-strong shadow-glow-selected`; sayı rozeti `min-w-5 h-5 … bg-primary text-white` → `text-[11px] font-display tabular-nums text-primary`; `focus:border-red-500 → focus:border-primary/40`. |
| `DateRibbon.tsx` | seçili gün ×3 gradyan → `bg-selected-strong text-white font-bold shadow-glow-selected`; `text-rose-400 → text-ink-2`. |
| `FeaturedMatchHero.tsx` | `border-red-500/25 → border-primary/25`, `via-[#0b1220]/95 → via-canvas/95`, canlı stroke `#ef4444 → #FF6E82`; ikon kapsülü → `bg-surface-raised border-line`; "Detay" → `bg-primary text-primary-fg shadow-glow-primary`; `font-mono font-scoreboard tabular-nums` **kalır**. |
| `FixtureTable.tsx` | kazanan skor rozeti (kırmızı gradyan, 3×) → `text-done font-black`; salon rozeti `bg-red-950/40 text-red-200 border-red-800/50` → `bg-surface-raised text-ink-2 border-line`; ev seti `bg-rose-950/50 text-rose-200 border-rose-800/60` → `bg-surface-raised text-ink-2 border-line`; `bg-red-600 text-white → bg-primary text-primary-fg` ×2; `hover:text-primary → hover:text-ink`; `font-scoreboard tabular-nums` ve `min-w-[36px]` **kalır**. |
| `TodayMatchesView.tsx` | Kart/Tablo anahtarı seçili gradyan ×2 → `bg-selected-strong shadow-glow-selected`; kazanan skor gradyan ×2 → `text-done`; `bg-red-600 text-white → bg-primary text-primary-fg` ×2; `group-hover/hall:decoration-red-400 → decoration-primary`; `bg-black/40 text-amber-300 px-1 rounded-full font-mono → text-warn font-display tabular-nums`; `<h1>`+`<p>` **kalır**. |
| `HomePortalView.tsx` | filtre hapı seçili `bg-rose-600 text-white shadow-sm` ×2 → `bg-selected-strong text-white font-bold shadow-glow-selected`; Bitenler `bg-emerald-600` → `bg-done text-done-fg`; Fikstür `bg-sky-600` → `bg-selected-strong`; şehir hızlı seçim `bg-rose-500/20 text-rose-300 border-rose-500/40` → `bg-primary/20 text-primary border-primary/40`; sayaç rozetleri (`px-1.5 py-0.2 rounded-full bg-black/30 font-mono`) → `font-display font-semibold tabular-nums text-ink-2 opacity-90`; `text-rose-400` ×7 → `text-ink-2`; `to-[#0e1627] → to-surface-muted`; `bg-[#0f172a]/70 → bg-canvas/70`; `hover:bg-[#18233c] → hover:bg-panel`; yeni `<h1>` noktası `bg-emerald-500 animate-pulse → bg-done`. |
| `PrimaryTeamWidget.tsx` | `bg-[#0f172a]/60 → bg-canvas/60`, `bg-[#0b1325] → bg-surface-muted`, `text-rose-400 → text-ink-2`, `hover:text-rose-* → hover:text-ink`, `focus:border-rose-500 → focus:border-primary/40`. |
| `DashboardClient.tsx` | Özgün Ek B'de tablo yok ("yapısal yeniden yazım"): 20 sabit hex → token (Ek C betiği); kırmızı/pembe (10) → §11.1 sözlüğü; Puan Durumu kısmı **04'te**. |
| `match/CompactMatchRow.tsx` | `text-[#F1F5F9] → text-ink` ×3, `border-[#2A2E3D]/40 → border-line/40` ×2, `bg-[#181A20] → bg-surface-muted`, `text-[#EF4444] → text-live`; `font-scoreboard tabular-nums` **kalır** (test); `bg-amber-950/30` **kalır** (test). |
| `match/CompactMatchFeed.tsx` | `border-[#2A2E3D] → border-line` ×2, `bg-[#181A20] → bg-surface-muted`, `bg-[#1E222D] → bg-panel`, `text-[#94A3B8] → text-ink-2`. |
| `match/DateNavigationRibbon.tsx` | `bg-[#181A20] → bg-surface-muted` ×8, `border-[#2A2E3D] → border-line` ×6, `bg-[#EF4444] text-white → bg-live text-live-fg` ×2 (bugün işareti canlı değilse **`bg-selected-strong text-white` tercih et**), `text-[#EF4444] → text-live`. |
| `match/LeagueSection.tsx` | `text-[#94A3B8] → text-ink-2` ×3, `border-[#2A2E3D] → border-line` ×2, `hover:bg-[#121212] → hover:bg-canvas`, `divide-[#2A2E3D]/40 → divide-line/40`. |
| `realtime/LiveMatchScore.tsx` | canlı kırmızı **kalır** (rose/red ölçeği = `live`). Ek B'de tablo yok. |

Ortak sözlük (§11.1, her dosyada aynı): `bg-[#121212|#0f172a|#080c14|#070b14|#020617] → bg-canvas`; `bg-[#181A20|#0b1325|#0d1424] → bg-surface-muted`; `bg-[#1E222D|#1e293b] → bg-panel`; `border-[#2A2E3D]`/`border-slate-700/800` → `border-line`; `text-[#94A3B8] → text-ink-2`; `text-[#64748B] → text-ink-3`; `text-[#F1F5F9] → text-ink`; `text-[#CBD5E1] → text-slate-200`; `text-rose/red-300/400` & `text-pink-400` dekoratif → `text-ink-2` (etiket/ikon) veya `text-primary` (vurgu); `bg-rose-500/10..20`, `border-rose-500/30..40`, `bg-red-950/*` dekoratif → `bg-primary/10..20`, `border-primary/30..40` veya `bg-surface-raised border-line`; `bg-emerald-600 text-white → bg-done text-done-fg`; `shadow-glow-red` yalnız canlıda; `selection:bg-red-600/30 → selection:bg-primary/30`; `hover:bg-primary/90 + text-white → text-primary-fg`.
Yardımcı arama: `rg -n "(red|rose|pink)-[0-9]+|from-red|to-rose|shadow-glow-red|bg-gradient-to-" src/components/{FilterBar,DateRibbon,FeaturedMatchHero,FixtureTable,TodayMatchesView,HomePortalView,PrimaryTeamWidget,DashboardClient}.tsx src/components/match` — her eşleşmede "bu gerçekten CANLI/HATA mı?" sor: evet → `live`; hayır → `primary`/`ink-2`/`selected`.

## 3.3 Testler (bu aşama)
Değişmez/korunmalı: `ScoreboardTypography.test.tsx` (3 test: `CompactMatchRow`, `SetScoreMatrix`, `StandingsTable`; StandingsTable kısmı 04'te sağlanır), `CompactMatchRow.test` (`bg-amber-950/30`), `SetScoreMatrix.test` (`text-slate-500`, `text-blue-300`, `text-emerald-400`), `results-and-city-header.test.tsx`. `utils/__tests__/getInitialFixtures.test.ts` tema ile ilgisiz.

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run         # 63 dosya / 416 test
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src/components/{FilterBar,DateRibbon,FeaturedMatchHero,FixtureTable,TodayMatchesView,HomePortalView,PrimaryTeamWidget,DashboardClient}.tsx src/components/match --glob '!**/__tests__/**'   # sonuç yok
rg -n "from-red-600|to-rose-600" src/components/{FilterBar,DateRibbon,FixtureTable,TodayMatchesView,HomePortalView}.tsx   # sonuç yok
```
Elle (1440/768/390 px): Fikstür ve Günün Maçları **yapı** değişmedi (kolonlar, sağ panel, filtreler); BUGÜN düğmesi mavi; kazanan skor sade yeşil; sayı rozeti hap yok; CANLI rozeti mercan.

## Sonraki aşama
→ `04-puan-durumu.md` (Puan Durumu yeniden tasarımı; `StandingsTable.tsx` + DashboardClient standings sekmesi).
