# 02 — Paylaşılan kabuk: AppShell, Header, sidebar'lar, CityTabBar, mobil nav, PWA

> Önce `00-OKU-BENI.md`, ardından 01 uygulanmış olmalı (token/ölçekler hazır). Taban `dea2414`, Node 22, push yok.

## Kısa palet/kural özeti
canvas `#07131F`, surface/panel `#0E2033`, surface-muted `#0A1A2B`, raised `#13293F`, line `#1B3550`; ink `#EAF6FA` / ink-2 `#A9C3D1` / ink-3 `#8CA8B8`; primary `#2DD4C0` (üstünde `text-primary-fg` `#032320`); live `#FF6E82` yalnız CANLI/hata; done `#9BE15D` (üstünde `text-done-fg`); selected-strong `#2A63BD` (beyaz yazı); warn `#FFC24D`.
- **Renkli sayı rozeti (hap) YASAK** → `font-display font-semibold tabular-nums text-ink-2`.
- **Gradyan düğme yok:** `bg-gradient-to-r from-red-600 to-rose-600 …` → `bg-primary text-primary-fg shadow-glow-primary`.
- **Nabız (`animate-pulse`) yalnız canlı** içindir; dekoratif nabız kaldır.
- Açık dolguda beyaz yazı yasak: `bg-primary text-white`→`text-primary-fg`; `bg-emerald-500 text-white`→`bg-done text-done-fg`; `bg-live text-white`→`text-live-fg`.
- `Header.test.tsx` aktif sekme `border-primary text-white` bekler → **bu sınıflar KALIR**.

## 2.1 `ThemeTokens` + `AppShell.tsx`
Güncel tabandaki `headerHeight` state'i ve `sidebarStyle` (yan panel `top`) **korunur**; üstüne (a) `section` prop → `data-section` (kapsam 07'de kullanılır), (b) aynı `ResizeObserver` içinde `--app-header-h` yayını (Puan Durumu sticky `<th>` için, 04), (c) kök sınıfları tokenlaştır.
```tsx
export interface AppShellProps { /* … mevcut … */ section?: "altyapi" | "kadinlar-2-lig"; }

export const AppShell: React.FC<AppShellProps> = ({ header, leftSidebar, children, rightSidebar, footer, className = "", section = "altyapi" }) => {
  const [headerHeight, setHeaderHeight] = React.useState(64);
  const headerRef = React.useRef<HTMLDivElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = headerRef.current, root = rootRef.current;
    if (!el) return;
    const apply = () => {
      setHeaderHeight(el.offsetHeight);
      root?.style.setProperty("--app-header-h", `${el.offsetHeight}px`);   // sticky <th> için
    };
    apply();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(apply); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      data-section={section}
      className={`min-h-screen flex flex-col bg-[var(--portal-background)] text-ink font-sans antialiased selection:bg-selected-strong selection:text-white ${className}`}
      style={{ "--portal-background": ThemeTokens.background, "--portal-panel": ThemeTokens.panel, "--portal-border": ThemeTokens.border } as React.CSSProperties}
    >
      {/* header / grid / aside'lar güncel tabandaki gibi (aside style={sidebarStyle});
          aside sınıfları bg-[var(--portal-panel)] border-[var(--portal-border)] KALIR */}
    </div>
  );
};
```
Eşleme: `text-[#F1F5F9] → text-ink`, `selection:bg-blue-600 → selection:bg-selected-strong`. `Kadinlar2LigClient` `section="kadinlar-2-lig"` verir (07'de). Not: `data-section` yalnız `AppShell` kökünde; `createPortal(document.body)` ile çıkan öğeler değişkenleri görmez.
`section` varsayılanı `"altyapi"`; `data-section="altyapi"` bir CSS kuralı tetiklemez.

## 2.2 Kabuk dosyaları — özet eşlemeler
| Dosya | Eşleme (ayrıntı `02b-…`) |
|---|---|
| `Header.tsx` | `from-red-950/30 → from-primary/10` ×6, `bg-[#080c14]/90 → bg-canvas/90`; sayaç rozetleri (`bg-rose-700/bg-red-700 text-white … font-mono`) → `font-display font-semibold tabular-nums text-ink-2` (+`normal-case tracking-normal`); "Bugün" `bg-emerald-500 text-white → bg-done text-done-fg`. Aktif sekme `border-primary text-white` **KALIR**. |
| `CityTabBar.tsx` | seçili şehir: kırmızı gradyan → `bg-primary text-primary-fg font-bold shadow-glow-primary`; sayı rozeti → sade metin. (Özgün Ek B'de "yapısal yeniden yazım" etiketli; tablo yok, kural budur.) |
| `CitySelector.tsx` | `bg-[#0b1325] → bg-surface-muted`, `bg-[#0f172a] → bg-canvas`, `text-primary → text-ink-2`, `bg-emerald-600 … rounded-full` sayaç → sade; seçili satır `text-white → text-primary-fg`. |
| `MobileBottomNav.tsx` | kök `bg-[#1E222D] border-t border-[#2A2E3D] → bg-panel border-t border-line` (**test güncellenir, aşağıda**); "Canlı" `text-red-400/bg-red-500 → text-live/bg-live`; aktif sekme `text-blue-400 → text-selected-text`, `fill-blue-400/20 → fill-selected-text/20`; pasif `text-[#94A3B8] → text-ink-2`; sayaç `bg-blue-600 text-white text-[9px] font-mono → text-selected-text text-[10px] font-display`. |
| `PwaInstallPrompt.tsx` | kök `bg-gradient-to-r from-red-600 to-rose-600 shadow-glow-red border-red-400/40 → bg-surface-raised border-line` (nötr; kırmızı yalnız CANLI); ikon `animate-pulse → text-primary`; düğme `text-white hover:from-red-500… → text-ink hover:bg-white/5`; iOS modalı birincil düğme `text-white → text-primary-fg`. |
| `NotificationBanner.tsx` | `hover:bg-primary/90 text-white → text-primary-fg font-bold shadow-glow-primary`. |
| `BrandLogo.tsx` | SVG: `#0f172a → #07131F`, `#f59e0b/#fbbf24 → #2DD4C0`, `#ef4444/#f43f5e → #7FB4FF`, `#3b82f6 → #5B9DFF`, `#d97706 → #1B8175`, `#b91c1c → #2A63BD`, `#1e293b → #13293F`; "ALTYAPI" rozeti kırmızı-amber gradyan → `bg-primary/15 text-primary border-primary/40 font-display font-bold`. |
| `layout/LeftSidebarPlaceholder.tsx` | `border-[#2A2E3D] → border-line` ×9, `text-[#94A3B8] → text-ink-2` ×9, `bg-[#1E222D] → bg-panel` ×4, `bg-[#181A20] → bg-surface-muted` ×3, `hover:bg-[#1E222D] → hover:bg-panel` ×3, `text-[#F1F5F9] → text-ink`; sayaç `font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded → font-display font-semibold tabular-nums text-ink-2`; `bg-pink-500 animate-pulse → bg-fuchsia-400` (nabızsız; Kadınlar 2. Lig noktası = orkide ölçeği). |
| `layout/RightSidebarPlaceholder.tsx` | `border-[#2A2E3D] → border-line` ×12 (+/80 ×2), `text-[#94A3B8] → text-ink-2` ×11, `bg-[#181A20] → bg-surface-muted` ×6, `bg-[#1E222D] → bg-panel` ×6, `text-[#EF4444]/bg-[#EF4444] → text-live/bg-live` (canlı), `hover:bg-[#242936] → hover:bg-panel`. |
| `layout/SidebarNavigation.tsx` | `text-[#94A3B8] → text-ink-2` (güncel tabanda #64748B'den dönmüş ×7 dahil), seçili grup `border-blue-500 bg-blue-500/10 → border-selected bg-selected/10`, `bg-pink-500 animate-pulse → bg-fuchsia-400`. |

Toplu uygulama: önce Ek C hex betiği (bkz. 2.5), sonra yukarıdaki **elle** anlam düzeltmeleri; her dosya için `02b-ek-b-kabuk-tablolari.md` tam tablolar.

## 2.3 PWA ve ikonlar
- `public/manifest.json`: `"background_color": "#07131F"`, `"theme_color": "#07131F"`.
- `public/sw.js`: `CACHE_NAME = "altyapi-voleybol-v4"` (**sürümü artır**; yoksa eski CSS/font önbellekte kalır), önbellek listesinden museo font girişlerini çıkar; `activate`'te eski önbellekleri temizlediğinden emin ol. (Özgün Ek B'de "yapısal yeniden yazım".)
- `public/icon.svg`, `src/app/apple-icon.svg`: zemin `#dc2626 → #2DD4C0` (1×), top çizgileri `#dc2626 → #07131F` (1×).
- `src/app/icon.svg` (kırmızı/amber gradyan → turkuaz/mavi): `#020617 → #07131F` ×4, `#0f172a → #0E2033` ×2, `#f59e0b → #2DD4C0` ×2, `#fbbf24 → #2DD4C0` ×2, `#ef4444 → #7FB4FF`, `#6366f1 → #5B9DFF`, `#f43f5e → #5B9DFF`, `#be123c → #2A63BD`.
- `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`: SVG'den **yeniden üret** (turkuaz zemin; maskable için içerik **%80 güvenli alan** içinde). İkili dosyalar yamayla taşınamaz. Örn. headless Chrome / `sharp` / `rsvg-convert` ile.
- iOS `black-translucent` 01'de `layout.tsx`'te yapıldı.

## 2.4 Test güncellemeleri (bu aşamada)
| Test | Değişiklik |
|---|---|
| `src/components/__tests__/MobileBottomNav.test.tsx` (~satır 97) | `"fixed bottom-0 left-0 right-0 z-50 bg-[#1E222D] border-t border-[#2A2E3D]"` → `"… z-50 bg-panel border-t border-line"` |
| `src/components/layout/__tests__/MainLayout.test.tsx` (~satır 116–131) | Test adı: `Sofascore koyu renk sınıfları (…)` → `Fileönü token'ları (canvas #07131F, panel #0E2033, line #1B3550)`; `--portal-background` `#121212 → #07131F`, `--portal-panel` `#1E222D → #0E2033`, `--portal-border` `#2A2E3D → #1B3550`; `toContain("text-[#F1F5F9]") → toContain("text-ink")` |
| `Header.test.tsx` | Değişmez (`border-primary text-white` korunmalı) |

Önerilen yeni test (AppShell): `section="kadinlar-2-lig"` verilince kökte `data-section="kadinlar-2-lig"`; varsayılan `altyapi`.

## 2.5 Otomatik sabit-hex taşıma (Ek C) — özet
Çalıştırma (repo kökü; `__tests__` hariç): `python3 hexmap.py` (tam kod: `02c-araclar-hexmap-kontrast.md`) → `git diff --stat` (~36–39 dosya beklenir). Eşleme: non-text önek (`bg/border/from/via/to/divide/ring/fill/stroke`) | `text-`:
`#050810 #070b14 #070d19 #080c14 #080f24 #090d16 #0a1226 #0b1220 #121212 #12141a #1e1b4b #0f172a #020617` → `canvas`|`canvas`; `#0b1325 #0c1630 #0d1424 #0d1628 #0d172a #0e1627 #181a20` → `surface-muted`; `#1e222d #1e293b #121f3d #162342 #172547 #18233c #1b2a4d #1b2b52 #242936 #252a38` → `panel`; `#2a2e3d #334155 #374151 #475569` → `line`; `#94a3b8` → `slate-400`|**`ink-2`**; `#64748b` → `slate-600`|**`ink-3`**; `#f1f5f9 #f8fafc` → `ink`; `#cbd5e1 #e2e8f0` → `slate-200`; `#ef4444 #dc2626` → `live`; `#f59e0b #fbbf24` → `warn`; `#3b82f6` → `selected`; `#38bdf8` → `blue-400`; `#1f497d` → `selected-strong` (elle, 06). Opaklık eki (`/30`) korunur. **Betik kapsamı dışı:** `__tests__`, `groupStatus.ts`, satır içi SVG/canvas hex'leri.
Betiği **tüm `src`'ye bir kez** çalıştırmak 03–08'in hex kısmını da halleder; sonraki aşamalar yalnızca **elle** anlam düzeltmelerini anlatır. Çalıştırdıktan sonra bu aşamanın dosyalarında elle düzeltmeleri yap.

## Bu aşamanın doğrulaması
```bash
npx tsc --noEmit
npx eslint src
npx vitest run     # 63 dosya / 416 test (+yeni AppShell testi); MobileBottomNav & MainLayout testleri 2.4'e göre güncellendi
rg -n "\[#(121212|1E222D|181A20|2A2E3D|94A3B8|64748B|F1F5F9)\]" src/components/layout src/components/Header.tsx src/components/CityTabBar.tsx src/components/CitySelector.tsx src/components/MobileBottomNav.tsx --glob '!**/__tests__/**'   # sonuç yok
rg -n "Museo|museo" public/sw.js public/manifest.json   # sonuç yok
```
Elle: üst başlık `bg-canvas/90`; CityTabBar seçili turkuaz (kırmızı değil); PwaInstallPrompt nötr; mobil nav "Canlı" mercan, aktif sekme mavi metin; sayaçlar hap değil; manifest/theme `#07131F`; ikonlar turkuaz.

## Sonraki aşama
→ `03-anasayfa-fikstur-gunun-maclari-sonuclar.md` (yapı korunur; yalnız renk/tip/rozet).
