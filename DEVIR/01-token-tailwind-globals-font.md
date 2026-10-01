# 01 — Token'lar, Tailwind config, globals.css, font, tek zemin kaynağı

> Önce `00-OKU-BENI.md` oku. Taban `dea2414`, Node 22, push yok. Bu aşama **temeldir**: sonraki tüm aşamalar buradaki token/ölçeklere dayanır. Bu aşamadan sonra site, sınıf adları değişmeden büyük ölçüde yeni renklere geçer (palet yeniden bağlama).

## Kısa palet (tekrar)
| Token | Hex | Rol |
|---|---|---|
| `canvas` / `background` | `#07131F` | sayfa zemini, manifest/theme-color |
| `surface` / `panel` | `#0E2033` | kart/panel/yan çubuk |
| `surface-muted` / `panel-inset` | `#0A1A2B` | çukur alan, input (eski `#181A20/#0b1325`) |
| `surface-raised` | `#13293F` | hover, açık satır, sekme zemini |
| `line` / `border` | `#1B3550` | çizgi (metin değil); `border-dark` `#16293F` |
| `ink` / `ink-2` / `ink-3` | `#EAF6FA` / `#A9C3D1` / `#8CA8B8` | metin (ink-3 en sönük izin verilen; `#64748B` **yasak**, 3.47:1) |
| `primary` | `#2DD4C0` (hover `#5EEAD4`, fg `#032320`) | marka/ana eylem |
| `live` / `live-fg` | `#FF6E82` / `#2B0A10` | **yalnız** CANLI/hata (koyu dolgu `#C42D49`+beyaz 5.50) |
| `done` / `done-fg` | `#9BE15D` / `#0B2A05` | bitti/galibiyet |
| `selected` / `strong` / `text` | `#5B9DFF` / `#2A63BD` / `#7FB4FF` | seçili çizgi / **dolu zemin** (beyaz 5.80) / metin |
| `warn` `#FFC24D` (fg `#2B1D00`), `rank-mid` `#B79BFF`, `form-loss` `#FF8FA0`, `orchid` `#D98BFF` | | uyarı/favori, 3–8. sıra, form "M", Kadınlar 2. Lig |

Kontrast (WCAG 2.x): ink/canvas 16.99, ink-2/surface 8.97, ink-3/surface 6.60, primary/surface 8.87, live/surface 6.13, done/surface 10.46, selected-text/surface 7.76, warn/surface 10.27; dolgu üstü: primary-fg/primary 8.92, live-fg/live 6.77, done-fg/done 9.89, beyaz/selected-strong 5.80. ⚠ `selected-strong` dolgusunda `ink-2` kullanma (3.15 ✗).
RGB kanalları: `--primary-rgb: 45 212 192`, `--primary-hover-rgb: 94 234 212`, `--primary-fg-rgb: 3 35 32`, `--rank-mid-rgb: 183 155 255`.

## Yapılacaklar
1. `tailwind.config.ts` (aşağıda tam).
2. `src/app/globals.css`.
3. `src/app/layout.tsx` (font + viewport; OG/Twitter bloklarını KORU).
4. `src/components/layout/ThemeTokens.ts` (tek zemin kaynağı).
5. `public/fonts/museo-*` kullanımını kaldır (dosyalar silinebilir; en son 09'da doğrula).
Bu aşamada `AppShell.tsx` içeriğine dokunma (02'de).

## 1.1 `tailwind.config.ts`
Mevcut dosyada **korunacak** diğer `extend` anahtarlarını (animation/keyframes, screens…) silme; aşağıdaki `colors/boxShadow/fontFamily` bloklarını **birleştir**. Ölçekler, her birinin **600** tonu beyaz yazıyla ≥4.5:1 olacak şekilde hesaplandı.
```ts
import type { Config } from "tailwindcss";

const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;
const scale = (a: string[]) =>
  Object.fromEntries(["50","100","200","300","400","500","600","700","800","900","950"].map((k, i) => [k, a[i]]));

const coral   = scale(["#FFF0F2","#FFDBE0","#FFB6C0","#FF92A1","#FF6E82","#DB5F70","#C42D49","#9D243A","#4C2C3B","#342331","#201C29"]);
const green   = scale(["#F5FCEF","#E6F8D6","#CDF0AE","#B4E886","#9BE15D","#85C250","#557C33","#446329","#304D30","#22382A","#162825"]);
const amber   = scale(["#FFF9ED","#FFF0D2","#FFE0A6","#FFD17A","#FFC24D","#DBA742","#8C6B2A","#705622","#4C442C","#343327","#202424"]);
const blue    = scale(["#F2F8FF","#DFECFF","#BFDAFF","#9FC7FF","#7FB4FF","#5B9DFF","#2A63BD","#224F97","#29405E","#1D3047","#132335"]);
const purple  = scale(["#F8F5FF","#EDE6FF","#DBCDFF","#C9B4FF","#B79BFF","#9D85DB","#7B68AB","#625389","#38395E","#272B47","#192135"]);
const teal    = scale(["#EAFBF9","#CAF4EF","#96EAE0","#62DFD0","#2DD4C0","#27B6A5","#1B8175","#16675E","#12494C","#0E363C","#0B262F"]);
const slate   = scale(["#F2FAFC","#DCEBF2","#C7DAE4","#B8CFDC","#A9C3D1","#8CA8B8","#6F8EA3","#2A4560","#1B3550","#0E2033","#07131F"]);
const fuchsia = scale(["#FBF3FF","#F6E2FF","#ECC5FF","#E2A8FF","#D98BFF","#BB78DB","#9333B8","#762993","#42355E","#2D2947","#1C1F35"]);

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Anlamsal token'lar ----
        canvas: "#07131F",
        background: "#07131F",
        surface: { DEFAULT: "#0E2033", muted: "#0A1A2B", raised: "#13293F" },
        panel: "#0E2033",
        "panel-inset": "#0A1A2B",
        line: "#1B3550",
        border: "#1B3550",
        "border-dark": "#16293F",
        ink: { DEFAULT: "#EAF6FA", 2: "#A9C3D1", 3: "#8CA8B8" },
        primary: {
          DEFAULT: withAlpha("--primary-rgb"),
          hover: withAlpha("--primary-hover-rgb"),
          fg: withAlpha("--primary-fg-rgb"),
          light: "#CAF4EF",
        },
        live: "#FF6E82",
        "live-fg": "#2B0A10",
        orchid: "#D98BFF",
        "form-loss": "#FF8FA0",
        done: "#9BE15D",
        "done-fg": "#0B2A05",
        warn: "#FFC24D",
        selected: { DEFAULT: "#5B9DFF", strong: "#2A63BD", text: "#7FB4FF" },
        "rank-mid": withAlpha("--rank-mid-rgb"),
        navy: { DEFAULT: "#EAF6FA", light: "#C7DAE4", muted: "#A9C3D1" },

        // ---- Varsayılan paletlerin yeniden bağlanması (sınıf adları değişmez!) ----
        slate,
        red: coral, rose: coral, pink: coral,
        emerald: green, green, lime: green,
        amber, yellow: amber, orange: amber,
        blue, sky: blue, cyan: blue, indigo: blue,
        teal,
        purple, violet: purple,
        fuchsia,
      },
      boxShadow: {
        "glow-red": "0 0 20px -3px rgba(255, 110, 130, 0.40)",
        "glow-amber": "0 0 20px -3px rgba(255, 194, 77, 0.40)",
        "glow-emerald": "0 0 20px -3px rgba(155, 225, 93, 0.35)",
        "glow-sky": "0 0 20px -3px rgba(91, 157, 255, 0.40)",
        "glow-primary": "0 0 20px -3px rgb(var(--primary-rgb) / 0.40)",
        "glow-selected": "0 0 18px -4px rgba(91, 157, 255, 0.45)",
        card: "0 8px 30px -4px rgba(0, 0, 0, 0.4)",
        "card-hover": "0 14px 36px -4px rgba(0, 0, 0, 0.6)",
      },
      fontFamily: {
        sans: ["var(--font-manrope)", "Manrope", "system-ui", "-apple-system", "'Segoe UI'", "Roboto", "sans-serif"],
        display: ["var(--font-space-grotesk)", "'Space Grotesk'", "var(--font-manrope)", "system-ui", "sans-serif"],
        mono: ["var(--font-space-grotesk)", "'Space Grotesk'", "var(--font-manrope)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
```
Notlar:
- **Sonuç örnekleri:** `text-rose-400`=`#FF6E82` (canlı), `bg-emerald-500`=`#85C250`, `border-slate-800`=`#1B3550`, `bg-slate-900`=`#0E2033`, `bg-slate-950`=`#07131F`, `text-slate-400`=`#A9C3D1`(=ink-2), `text-slate-500`=`#8CA8B8`(=ink-3), `text-slate-600`=`#6F8EA3` (yalnız büyük/ikon).
- ⚠ **`rose/red/pink` artık CANLI rengidir.** Dekoratif kullanımlar sonraki aşamalarda token'a taşınır (aksi halde "her şey canlı" görünür).
- `text-primary-fg` için `colors.primary.fg` yeterli; `.text-primary-fg` CSS yardımcı sınıfı opsiyonel yedek.
- Bu aşamada testlerin dayandığı palet adları (`border-primary`, `bg-amber-950/30`, `text-slate-500`, `text-blue-300`, `text-emerald-400`) çalışmaya devam eder (ölçekler bağlı).

## 1.2 `src/app/globals.css`
```css
@tailwind base; @tailwind components; @tailwind utilities;

:root {
  --canvas: #07131f; --surface: #0e2033; --surface-muted: #0a1a2b; --surface-raised: #13293f; --line: #1b3550;
  --ink: #eaf6fa; --ink-2: #a9c3d1; --ink-3: #8ca8b8;
  --live: #ff6e82; --done: #9be15d; --selected: #5b9dff; --selected-strong: #2a63bd; --selected-text: #7fb4ff; --warn: #ffc24d;
  --primary: #2dd4c0; --primary-rgb: 45 212 192; --primary-hover-rgb: 94 234 212; --primary-fg-rgb: 3 35 32;
  --primary-soft: rgb(45 212 192 / 0.14);
  --rank-mid-rgb: 183 155 255;
  /* geri uyumluluk */
  --background: var(--canvas); --border: var(--line); --text-main: var(--ink); --text-muted: var(--ink-2);
  --font-body: var(--font-manrope), "Manrope", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --font-display: var(--font-space-grotesk), "Space Grotesk", var(--font-manrope), system-ui, sans-serif;
}
/* Kadınlar 2. Lig kapsamı: orkide vurgu (ayrıntı + AppShell prop'u 07'de) */
[data-section="kadinlar-2-lig"] {
  --primary: #d98bff;
  --primary-rgb: 217 139 255;
  --primary-hover-rgb: 232 177 255;
  --primary-fg-rgb: 42 11 58;          /* #2A0B3A */
  --primary-soft: rgb(217 139 255 / 0.14);
  --rank-mid-rgb: 127 180 255;         /* #7FB4FF */
}

html, body, button, input, select, textarea { font-family: var(--font-body); }
h1, h2, h3, .font-display { font-family: var(--font-display); letter-spacing: -0.01em; }
.tabular, .font-mono, .font-scoreboard { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }

body { background-color: var(--canvas); color: var(--ink); -webkit-font-smoothing: antialiased; }
/* ESKİ: body'deki background-image: radial-gradient(… rgba(225,29,72,.08) …) ve background-attachment: fixed → SİL */

@layer utilities {
  .glass-panel { background: rgb(14 32 51 / .78); backdrop-filter: blur(16px); border: 1px solid rgba(255,255,255,.08); }
  .glass-card  { background: rgb(14 32 51 / .62); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,.07); transition: all .2s cubic-bezier(.4,0,.2,1); }
  .glass-card:hover { background: rgb(19 41 63 / .88); border-color: rgb(var(--primary-rgb) / .35); box-shadow: 0 10px 25px -5px rgba(0,0,0,.45); }
  .match-strip { background: rgb(14 32 51 / .62); border: 1px solid rgba(255,255,255,.06); transition: all .15s ease-out; }
  .match-strip:hover { background: rgb(19 41 63 / .88); border-color: rgb(var(--primary-rgb) / .40); }
  .card-clean { background: rgb(14 32 51 / .68); border: 1px solid rgba(255,255,255,.07); border-radius: 1rem; }
  .text-glow-red   { text-shadow: 0 0 12px rgba(255,110,130,.50); }
  .text-glow-amber { text-shadow: 0 0 12px rgba(255,194,77,.50); }
  .text-glow-emerald { text-shadow: 0 0 12px rgba(155,225,93,.45); }
  /* Güncel tabanda .font-scoreboard monospace; Space Grotesk'e çevir */
  .font-scoreboard { font-family: var(--font-display); letter-spacing: -0.02em; }
  .text-primary-fg { color: rgb(var(--primary-fg-rgb)); }
  .bg-primary-soft { background: var(--primary-soft); }
  .bg-selected-fill { background: var(--selected-strong); color: #fff; }
  .focus-ring:focus-visible { outline: 2px solid rgb(var(--primary-rgb)); outline-offset: 2px; }
  .ambient-glow-red { box-shadow: 0 0 35px -8px rgba(255,110,130,.30); }
  .ambient-glow-emerald { box-shadow: 0 0 35px -8px rgba(155,225,93,.30); }
  .custom-scrollbar { scrollbar-width: thin; scrollbar-color: var(--line) transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--line); }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--selected); }
}
::-webkit-scrollbar-track { background: var(--canvas); }
::-webkit-scrollbar-thumb { background: var(--line); }
/* Museo Sans @font-face blokları → SİL. Print stilleri (@media print) → DOKUNMA (beyaz çıktı). */
```
Dikkat: dosyadaki **mevcut** diğer kuralları (print, animasyonlar, scrollbar ayrıntıları) silme; yukarıdakileri eski eşdeğerlerinin yerine koy. `.font-scoreboard` Space Grotesk'e bağlanınca `ScoreboardTypography.test.tsx` bozulmaz (yalnız sınıf adını arar). Kolon genişlikleri değişebilir → `min-w-*` kontrol et (09'da).

## 1.3 `src/app/layout.tsx`
```tsx
import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

const manrope = Manrope({
  subsets: ["latin", "latin-ext"],          // latin-ext = Türkçe ğ ş ı İ ö ü ç (ZORUNLU)
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#07131F", width: "device-width", initialScale: 1, viewportFit: "cover" };

export const metadata: Metadata = {
  /* … title/description/metadataBase/manifest/openGraph/twitter AYNEN KORU … */
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Altyapı Voleybol" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${spaceGrotesk.variable}`}>
      {/* <head> içindeki 3 adet museo-sans <link rel="preload"> SİLİNDİ */}
      <body className="min-h-screen bg-canvas text-ink font-sans antialiased selection:bg-selected-strong selection:text-white">
        {children}
        {/* Script/Analytics/ServiceWorkerRegister aynen */}
      </body>
    </html>
  );
}
```
Eski → yeni: `statusBarStyle:"default"` → `"black-translucent"`; `<body>` `bg-[#121212] text-[#F1F5F9] … selection:bg-blue-600` → `bg-canvas text-ink … selection:bg-selected-strong`. Mevcut `viewport`/`metadata` alanlarını (title, OG, twitter, canonical, JSON-LD vb.) olduğu gibi tut; yalnız yukarıdakini değiştir.
CSP: `font-src 'self' data:` yeterli (`next/font/google` self-host eder; ek CSP değişikliği gerekmez). Build sonrası ağda `fonts.gstatic.com` isteği olmadığını doğrula (09).
Font kuralları: `font-black` (900) Manrope'ta 800'e, Space Grotesk'te 700'e düşer (sorun değil). Ağırlık sayısını artırma (mobil performans: skor 64, LCP 5.2 s bozulmasın).

## 1.4 `src/components/layout/ThemeTokens.ts` — tek zemin kaynağı
```ts
// src/components/layout/ThemeTokens.ts
export const ThemeTokens = { background: "#07131F", panel: "#0E2033", border: "#1B3550" } as const;
```
Eski: `#121212 → #07131F`, `#1E222D → #0E2033`, `#2A2E3D → #1B3550`. `AppShell` bu üç değeri `--portal-background/panel/border` olarak CSS değişkenine yazar (02'de). Zemin **tek kaynak**: `tailwind.config.ts` `canvas` + `globals.css` `--canvas` + `ThemeTokens.background` aynı `#07131F` olmalı.

## 1.5 Dosya bazlı Ek B satırları
`01c-ek-b-cekirdek-tablolari.md` (globals.css, layout.tsx, ThemeTokens.ts, tailwind.config.ts: özgün Ek B'de bunlar "yapısal yeniden yazım" olarak işaretli; Ek A sayımları dahil).

## Bu aşamanın doğrulaması
```bash
node -v                 # v22.x
npx tsc --noEmit        # temiz
npx eslint src          # temiz
npx vitest run          # 63 dosya / 416 test geçmeli (palet adları korunduğu için)
npm run build           # (opsiyonel bu aşamada) latin-ext woff2 preload'ları çıktıda olmalı
rg -n "Museo|museo" src/app/layout.tsx src/app/globals.css   # sonuç yok
```
Elle: `rg -n "radial-gradient" src/app/globals.css` → eski kırmızı gradyan (`rgba(225,29,72`) kalmamalı. Tarayıcıda ana sayfa: zemin lacivert-petrol, Türkçe karakterler doğru, skor hücreleri Space Grotesk.

## Sonraki aşama
→ `02-kabuk-appshell-header-nav-pwa.md` (AppShell `section` prop'u + `--app-header-h`, Header, sidebar'lar, CityTabBar, mobil nav, PWA/ikonlar).
