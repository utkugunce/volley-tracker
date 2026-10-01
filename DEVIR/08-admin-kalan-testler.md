# 08 — Admin, kalan dosyalar, testlerin güncellenmesi

> Önce 00–07. Taban `dea2414`, Node 22, push yok. Kapsam: `src/app/admin/page.tsx` (1920 satır, auth gerekir), `realtime/LiveScoreIndicator.tsx`, `realtime/RealtimeErrorHandler.tsx`, `PrintScheduleButton.tsx` ve **tüm test paketinin son durumu**.

## Kısa palet/kural özeti
canvas `#07131F` · panel `#0E2033` · raised `#13293F` · line `#1B3550` · ink-2 `#A9C3D1` · primary `#2DD4C0` (fg `#032320`) · live `#FF6E82` (hata/CANLI) · done `#9BE15D` (fg `#0B2A05`) · selected-strong `#2A63BD` · warn `#FFC24D`.
Kurallar: sekme seçili = `bg-selected-strong font-bold shadow-glow-selected`; birincil `bg-primary text-primary-fg font-bold shadow-glow-primary`; başarı `bg-done`; **hata kutusu = `live`** (yerel uygulamada hata kutuları yanlışlıkla `primary`'ye kaymıştı; doğrusu `bg-live/10 border-live/40 text-live`).

## 8.1 Admin (`src/app/admin/page.tsx`)
Hedef: sekmeler seçili `bg-selected-strong`; birincil `bg-primary text-primary-fg`; başarı `bg-done`; hata `bg-live/10 border-live/40 text-live`. Auth gerektirir → **görsel test edilemedi** (09'da risk). Özet eşlemeler (tam 21 satır `08b-ek-b-kalan-tablolar.md`'de):
`bg-primary shadow-sm → bg-selected-strong font-bold shadow-glow-selected` ×4; `hover:bg-primary/90 text-white → text-primary-fg font-bold shadow-glow-primary` ×4; `text-white → text-done-fg` ×3 (yeşil dolgu üstünde); `text-primary → text-ink-2` ×3; `text-red-400 → text-ink-2` ×3 / `→ text-primary` ×2; `bg-red-500/20 → bg-primary/20` ×3; `bg-emerald-500 → bg-done` ×2; `hover:bg-emerald-500 → hover:bg-done`; `hover:bg-red-950/80 → hover:bg-primary/10`; `hover:text-red-400 → hover:text-ink`; `focus-visible:ring-red-400 → focus-visible:ring-primary/40`; `bg-rose-950/90`/`bg-red-950 → bg-surface-raised`, `border-rose-800`/`border-red-800 → border-line`, `text-rose-300 → text-ink-2`; `bg-gradient-to-br from-primary/20 to-primary/10 → bg-primary/15`; `bg-red-950/80 → bg-primary/10`, `border-red-800 → border-primary/40`, `text-red-300 → text-primary`.
**Öneri:** gerçek hata/silme uyarısı olan kutularda (`bg-rose-950/90`, `bg-red-950/80` vb.) yerel eşleme yerine `live` kullan (`bg-live/10 border-live/40 text-live`); `rose/red` ölçeği zaten `live` olduğu için dokunmadan bırakmak da kabul edilebilir.

## 8.2 Gerçek zamanlı bileşenler
| Dosya | Eşleme |
|---|---|
| `realtime/LiveScoreIndicator.tsx` | bağlantı koptu: `bg-red-950/80 text-red-400 border-red-800 → bg-warn/10 text-warn border-warn/40` |
| `realtime/RealtimeErrorHandler.tsx` | yerel: `bg-red-950/90 border-red-800 text-red-300/400 → bg-primary/10 border-primary/40 text-primary/ink-2`. **Öneri (tercih et):** hata için `bg-live/10 border-live/40 text-live` (`bg-red-900/50`, `hover:bg-red-900/70` → `bg-live/10`, `hover:bg-live/20`). |
| `realtime/LiveMatchScore.tsx` | 03'te: canlı kırmızı kalır. |
| `PrintScheduleButton.tsx`, `LeagueVolleyboxLink.tsx`, `ServiceWorkerRegister` | ölçek bağlamasıyla otomatik; Ek B'de tablo yok. |

## 8.3 Kalan sabit hex / kırmızı taraması
```bash
# Betik (02c) çalıştırıldıysa sabit hex kalmamalı; kalanı elle düzelt:
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src --glob '!**/__tests__/**'
rg -n "(red|rose|pink)-[0-9]+|from-red|to-rose|shadow-glow-red|bg-gradient-to-" src --glob '!**/__tests__/**'
```
Her eşleşmede: "bu öğe gerçekten CANLI/HATA mı?" evet → `live` (rose/red ölçeği olduğu gibi kalabilir); hayır → `primary`/`ink-2`/`selected`. **Elle kalan hex'ler (betik yapmaz):** `groupStatus.ts` (DOKUNMA), `TeamBadge.tsx` (DOKUNMA), SVG/canvas hex'leri (BrandLogo/icon.svg → 02; SocialStoryModal → 05; CompareClient/TeamDetailClient grafik stroke'ları → 06; VolleyballCourtView → 06).

## 8.4 Testler (tam liste; güncel taban 63 dosya / 416 test)
| Test dosyası | Beklenen değişiklik |
|---|---|
| `src/components/__tests__/MobileBottomNav.test.tsx` (~97) | `"fixed bottom-0 left-0 right-0 z-50 bg-[#1E222D] border-t border-[#2A2E3D]"` → `"… z-50 bg-panel border-t border-line"` (02'de yapıldı) |
| `src/components/layout/__tests__/MainLayout.test.tsx` (~116–131) | test adı; `--portal-background #121212→#07131F`, `--portal-panel #1E222D→#0E2033`, `--portal-border #2A2E3D→#1B3550`; `toContain("text-[#F1F5F9]")→toContain("text-ink")` (02'de yapıldı) |
| `src/components/__tests__/ScoreboardTypography.test.tsx` (yeni, Antigravity) | Değişmez; StandingsTable sıra `<span>`, O/G/M, Puan `font-scoreboard tabular-nums` taşımalı (04); `CompactMatchRow`/`SetScoreMatrix` sınıfları silinmemeli |
| `Header.test.tsx` | Değişmez (`border-primary text-white`) |
| `match/__tests__/CompactMatchRow.test.tsx` | Değişmez (`bg-amber-950/30`) |
| `match/__tests__/SetScoreMatrix.test.tsx` | Değişmez (`text-slate-500`, `text-blue-300`, `text-emerald-400`) |
| `StandingsTable.test.tsx`, `StandingsTableCsv.test.tsx`, `results-and-city-header.test.tsx` | Değişmemeli (butonlar `B Grubu`, `Genç (U18)`, `… takımını incele`, `h2`) |
| `groupStatus.test.ts` | Değişmez (resmi hex) |
| `kadinlar-2-lig/__tests__/Kadinlar2LigSidebar.test.tsx` (yeni) | yalnız metin/href/click |
| `common/__tests__/SkeletonLoaders.test.tsx` (yeni) | iskelet kök sınıfında `animate-pulse` kalmalı |
| `MatchCenterDrawer.test.tsx` | `await findByText` (dinamik); bozma |
| `utils/__tests__/getInitialFixtures.test.ts` | tema ile ilgisiz |

**Eklenmesi önerilen yeni testler:** (a) `StandingsTable` satıra tıkla → `data-detail-for`, `aria-expanded=true`; (b) `summarizeTeam` 5 maçlık W/L + `standings`/`none` dalları; (c) `AppShell` `section` → `data-section`; (d) tema sözleşmesi: `tailwind.config.ts` `canvas === "#07131F"` + kontrast ≥ 4.5 hesaplayıcı (kontrast fonksiyonu: `02c-araclar-hexmap-kontrast.md` C.2); (e) `globals.css` içinde `[data-section="kadinlar-2-lig"]` bloğu var.
**Hedef:** 63 dosya / 416 test + yeni eklenenler, hepsi geçer. Test kırılırsa testi değil kodu düzelt (yukarıdaki iki sabit-hex testi dışında).

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run         # 63 dosya / 416 test + yeni testler, hepsi yeşil
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9|0f172a|0b1325)\]" src --glob '!**/__tests__/**'   # sonuç yok
rg -n "from-red-600|to-rose-600|shadow-glow-red" src   # yalnız gerçek canlı bağlamlar
```

## Sonraki aşama
→ `09-son-dogrulama-risk.md` (son doğrulama, görsel kontrol listesi, riskler).
