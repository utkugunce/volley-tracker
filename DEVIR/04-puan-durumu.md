# 04 — Puan Durumu (Sofascore tarzı yeniden tasarım)

> Önce 00–03. Taban `dea2414`, Node 22, push yok. **Yapısal olarak yenilenen tek sayfa**: `/puan-durumu[/city]` (`StandingsTable.tsx` + `DashboardClient.tsx` "standings" sekmesi). Referans uygulama (yerel, eski taban): `/workspace/volley-tracker/src/components/StandingsTable.tsx` (902 satır, yeniden yazıldı) — yoksa aşağıdaki spesifikasyondan yaz.

## Kısa palet/kural özeti
canvas `#07131F` · surface `#0E2033` · raised `#13293F` · line `#1B3550` · ink `#EAF6FA` · ink-2 `#A9C3D1` · ink-3 `#8CA8B8` · primary `#2DD4C0` (fg `#032320`) · selected `#5B9DFF` / selected-text `#7FB4FF` · done `#9BE15D` · form-loss `#FF8FA0` (yalnız form "M" ve mağlubiyet vurgusu; canlı değil) · rank-mid `#B79BFF` (Kadınlar 2. Lig'de otomatik mavi `#7FB4FF`) · warn `#FFC24D`.
Kurallar: renkli hap yok; sayılar `font-display font-scoreboard tabular-nums`; kırmızı yalnız CANLI.

## 4.1 Sayfa başlığı (`DashboardClient`)
Puan durumu sekmesinin üstünde `<h1>`: `"{Şehir} Puan Durumu · Genç & Yıldız Kızlar Süper Lig"` (şehir yoksa `"Puan Durumu · Genç & Yıldız Kızlar Süper Lig"`). Sınıf: `font-display text-lg sm:text-xl font-bold text-ink`.
`DashboardClient` değişiklikleri: puan durumunda `rightSidebar` **undefined** (tam genişlik); `TeamInspectorPanel` dynamic import'u ve `selectedStandingTeam` state'i **silinir** (bileşen dosyası kalır, kullanılmaz); `StandingsTable`'a `matches={data?.matches || []}` verilir. Güncel taban: `StandingsTable` ilk açılışta `loading` → `TabViewSkeleton`'dan sonra gelir; kısmi veri (yalnız ana sayfa) form türetimini bozmaz; `/puan-durumu` tam veriyle gelir.

## 4.2 Filtre çubuğu (kart: `rounded-2xl border border-line bg-surface p-3 sm:p-4`)
1. **İl seçici** (açılır liste korunur): MapPin `text-ink-2`, seçili il noktası `bg-primary`, seçili satır `bg-primary/20 text-primary border-primary/40`.
2. **Kategori = segmented kontrol:** kapsayıcı `inline-flex rounded-xl border border-line bg-canvas p-0.5`; düğmeler `rounded-[10px] px-3 py-1.5 text-xs font-semibold`; **seçili `bg-primary text-primary-fg font-bold shadow-glow-primary`**, pasif `text-ink-2 hover:text-ink`; `aria-pressed`.
3. **Lig segmenti** (birden çok lig varsa): aynı kapsayıcı, seçili `bg-surface-raised text-ink`.
4. **Grup sekmeleri:** `role="tablist"`; kapsayıcı `border-b border-line`; sekme `-mb-px border-b-2 px-3 py-2 text-xs font-semibold`; seçili `border-selected text-selected-text` (mavi), pasif `border-transparent text-ink-2 hover:text-ink`; `aria-current`.

## 4.3 Tablo kartı (`rounded-2xl border border-line bg-surface shadow-card`)
- **Başlık şeridi:** Trophy `text-warn`; `<h2>` `"{İL} • {LİG} • {GRUP} - PUAN DURUMU"` (**testler h2 metnine bağlı: koru**); sağda `CSV İndir` (`border-line bg-surface-raised text-ink-2`) ve `"{n} Takım"`.
- `<table table-fixed>` kolonlar: **# | Takım | O | G | M | Set (yalnız `sm:`+) | Puan | Form**; `<caption class="sr-only">`; **sticky `<th>`:** `sticky top-[var(--app-header-h,0px)] z-20 bg-surface shadow-[0_1px_0_var(--line)]` (`--app-header-h` 02'de AppShell'in yayınladığı değişken).
- **Satır:** `border-t border-line/70`, `py-2.5`, hover `bg-surface-raised/70`, açıkken `bg-surface-raised`; tıklanabilir (`cursor-pointer`; bağlantılara tıklama satırı açmaz).
- **Sıra işareti:** sol kenarda 3 px dikey çubuk + sıra no. 1–2: `bg-primary`/`text-primary` ("Final Etabı"); 3–8: `bg-rank-mid`/`text-rank-mid` ("Klasman"); 9+: şeffaf/`text-ink-2`.
- **Takım:** logo + `TeamVolleyboxLink` (ilk 4 `font-bold`); sağda `ChevronRight` düğmesi (`aria-expanded`, `aria-label="{takım} takımını incele"`, açıkken 90° döner).
- **Sayılar** `font-display font-scoreboard tabular-nums` (O `text-ink-2`, G/M `text-ink`, Set `text-ink-2`, **Puan `text-sm font-bold text-ink`**).
- **Form (`FormDots`):** 5 halka (18 px); G: `border-done text-done` ("G"); M: `border-form-loss text-form-loss` ("M"); oynanmamış `border border-dashed border-line`; `role="img"` + `aria-label="Son N maç: G M …"`.
- **Satır içi detay** (tıklayınca altında `<tr data-detail-for>`; `bg-surface-raised`, solda 3 px `bg-primary` çubuk): Set oranı, Sayı oranı, Set (aldığı-verdiği), Sayı (aldığı-verdiği), **Son maç**, **Sıradaki maç**. `onSelectTeam` açılırken çağrılır (geri uyum).
- **Alt açıklama:** sol: `▌1-2: Final Etabı (Play-Off)` (primary çubuk), `▌3-8: Klasman Etabı` (rank-mid çubuk), `9+: Normal Sezon`; sağ: `Form: (G) (M) (kesik) oynanmadı`; veri eksikse `text-ink-3` not.
- Eski ▲▼ "trend" metni ve gradyan/emerald-amber legend kutuları **kalkar**.

## 4.4 Veri: `summarizeTeam` ve `FormDots` iskeleti
Yeni opsiyonel prop `matches?: Match[]`. Form **maç verisinden** (son 5 `finished` + skorlu) türetilir; eşleşme yoksa TVF puan tablosundaki `form` alanına (repo verisinde 0–2 maçlık: `data/fixtures.json` 128 satırda uzunluk 0→48, 1→39, 2→41) düşer; o da boşsa kesik halka + açıklama notu.
```tsx
export type FormResult = "W" | "L";
interface TeamMatchSummary { form: FormResult[]; formSource: "matches"|"standings"|"none"; last: Match|null; next: Match|null; }

export function summarizeTeam(row: StandingItem, ctx: {city:string; leagueName:string; groupName:string}|null, matches?: Match[]): TeamMatchSummary {
  const fallback = (row.form || []).slice(-5);
  const empty = { form: fallback, formSource: fallback.length ? "standings" : "none", last: null, next: null } as TeamMatchSummary;
  if (!matches?.length) return empty;
  const name = trLower(row.team.trim());
  const mine = matches.filter(m => /* takım adı (home/away) + şehir + lig + grup eşleşmesi: trLower/trIncludes/formatGroupName */);
  if (!mine.length) return empty;
  const key = (m: Match) => `${m.date} ${m.time || ""}`;
  const finished = mine.filter(m => m.status === "finished" && hasScore(m)).sort((a,b)=>key(a).localeCompare(key(b)));
  const upcoming = mine.filter(m => m.status === "upcoming" || m.status === "live").sort((a,b)=>key(a).localeCompare(key(b)));
  const form = finished.slice(-5).map(m => { /* isHome → ben-onlar skoru */ return mine > theirs ? "W" : "L"; });
  return { form: form.length ? form : fallback, formSource: form.length ? "matches" : fallback.length ? "standings" : "none",
           last: finished.at(-1) ?? null, next: upcoming[0] ?? null };
}

export const FormDots = ({ form, source }: { form: FormResult[]; source?: TeamMatchSummary["formSource"] }) => {
  const padded: (FormResult|null)[] = [...form.slice(-5)]; while (padded.length < 5) padded.push(null);
  return (
    <div className="flex items-center justify-center gap-1" role="img"
         aria-label={form.length ? `Son ${form.length} maç: ${form.map(f => f==="W"?"G":"M").join(" ")}` : "Form verisi yok"}
         title={source === "standings" ? "Form: TVF puan tablosundan (yalnız oynanan maçlar)" : undefined}>
      {padded.map((f,i)=> f===null
        ? <span key={i} className="h-[18px] w-[18px] rounded-full border border-dashed border-line" aria-hidden="true" />
        : <span key={i} aria-hidden="true"
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] font-display text-[9px] font-bold leading-none ${f==="W" ? "border-done text-done" : "border-form-loss text-form-loss"}`}>
            {f==="W" ? "G" : "M"}
          </span>)}
    </div>
  );
};
```
Mevcut dosyadaki mantığı (`trLower`, `trIncludes`, `formatGroupName`, CSV, il/kategori/lig/grup seçimi, `TeamVolleyboxLink`) **koru**; yalnız görünümü bu spesifikasyona taşı. Ek B'de bu dosya "yapısal yeniden yazım" etiketlidir (tablo yok); sayımlar: kırmızı/pembe 24, zümrüt 13, kehribar 11, mavi 3, slate 95, gradyan 7, hex 6 (Ek A, 902 satır) — hepsi yeni tasarımda token'dır.

## 4.5 ScoreboardTypography uyumu (ÖNEMLİ — test kırılır)
`ScoreboardTypography.test.tsx` StandingsTable için `getAllByText("1")` ile **tüm** "1" metinlerinin `font-scoreboard` + `tabular-nums` sınıflarını ve puan hücresinin aynısını bekler:
- **Sıra numarası `<span>`'ı, `row.played`, `row.won`, `row.lost`, `row.points` hücreleri** `font-scoreboard tabular-nums` taşımalı (yalnız `font-display tabular-nums` yetmez).
- `Set` sütunu `"{sets_won}-{sets_lost}"` **birleşik tek metin** olmalı; ayrı `<span>` ile "1" üretme (test çakışır).
- Bu eklemelerle yeni tabanda 3/3 test geçti (63/63 dosya, 416/416).
Diğer değişmemesi gereken testler: `StandingsTable.test.tsx`, `StandingsTableCsv.test.tsx`, `results-and-city-header.test.tsx` (butonlar `B Grubu`, `Genç (U18)`, `… takımını incele`, `h2` başlığı).

## 4.6 Eklenmesi önerilen testler
(a) satıra tıkla → `data-detail-for` açılır, `aria-expanded=true`; (b) `summarizeTeam`: 5 maçlık W/L, eşleşme yoksa `standings` ve `none` dalları.

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run src/components/__tests__/ScoreboardTypography.test.tsx src/components/__tests__/StandingsTable.test.tsx   # yolları rg --files ile doğrula
npx vitest run         # 63 dosya / 416 test (+4.6 yeni testler)
rg -n "animate-pulse|bg-gradient-to" src/components/StandingsTable.tsx   # sonuç yok
rg -n "TeamInspectorPanel|selectedStandingTeam" src/components/DashboardClient.tsx   # sonuç yok
```
Elle (1440/768/390): `/puan-durumu` → h1; segmented kategori; alt çizgili grup sekmesi (mavi); 1–2 turkuaz / 3–8 mor çubuk; G/M halkaları (çoğu takımda 3–5 kesik halka veri sınırıdır, hata değil); satır açılır (Son/Sıradaki maç); sticky `th` kaydırınca header altında; **sağ panel yok**; ana sayfadan "Puan Durumu" sekmesine geçişte temalı `TabViewSkeleton` → tablo.

## Sonraki aşama
→ `05-inspector-lazy-modallar.md` (MatchInspectorPanel, SetScoreMatrix, TeamInspectorPanel, FormBadge; lazy-load MatchCenterDrawer/SpotlightSearchModal/SocialStoryModal).
