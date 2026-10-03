import type { Config } from "tailwindcss";

import { PALETTES, SHADES, cssColor, paletteVar, semanticVar } from "./src/theme/palettes";

const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const paletteColors = () =>
  Object.fromEntries(
    Object.keys(PALETTES).map((name) => [
      name,
      Object.fromEntries(SHADES.map((shade) => [shade, cssColor(paletteVar(name, shade))])),
    ]),
  );

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ---- Anlamsal token'lar (CSS değişkenleri; karanlık/açık tema src/theme/theme-vars.css içinde) ----
        canvas: cssColor(semanticVar("canvas")),
        background: cssColor(semanticVar("canvas")),
        surface: {
          DEFAULT: cssColor(semanticVar("surface")),
          muted: cssColor(semanticVar("surface-muted")),
          raised: cssColor(semanticVar("surface-raised")),
        },
        panel: cssColor(semanticVar("surface")),
        "panel-inset": cssColor(semanticVar("surface-muted")),
        line: cssColor(semanticVar("line")),
        border: cssColor(semanticVar("line")),
        "border-dark": cssColor(semanticVar("border-dark")),
        ink: { DEFAULT: cssColor(semanticVar("ink")), 2: cssColor(semanticVar("ink-2")), 3: cssColor(semanticVar("ink-3")) },
        primary: {
          DEFAULT: withAlpha("--primary-rgb"),
          hover: withAlpha("--primary-hover-rgb"),
          fg: withAlpha("--primary-fg-rgb"),
          light: cssColor(semanticVar("primary-light")),
        },
        live: cssColor(semanticVar("live")),
        "live-fg": cssColor(semanticVar("live-fg")),
        orchid: cssColor(semanticVar("orchid")),
        "form-loss": cssColor(semanticVar("form-loss")),
        done: cssColor(semanticVar("done")),
        "done-fg": cssColor(semanticVar("done-fg")),
        warn: cssColor(semanticVar("warn")),
        selected: {
          DEFAULT: cssColor(semanticVar("selected")),
          strong: cssColor(semanticVar("selected-strong")),
          text: cssColor(semanticVar("selected-text")),
        },
        "rank-mid": withAlpha("--rank-mid-rgb"),
        navy: {
          DEFAULT: cssColor(semanticVar("navy")),
          light: cssColor(semanticVar("navy-light")),
          muted: cssColor(semanticVar("navy-muted")),
        },

        // ---- Varsayılan paletlerin yeniden bağlanması (§4.4): tonlar CSS değişkenlerinden gelir ----
        ...paletteColors(),
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
