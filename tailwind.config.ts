import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0F172A",
        surface: "#1E293B",
        "surface-muted": "#0B1325",
        border: "#334155",
        "border-dark": "#1E293B",
        primary: {
          DEFAULT: "#DC2626", // TVF Kırmızı
          hover: "#B91C1C",
          light: "#FEE2E2",
        },
        navy: {
          DEFAULT: "#F8FAFC",
          light: "#E2E8F0",
          muted: "#94A3B8",
        },
      },
      fontFamily: {
        sans: ["'Museo Sans'", "'MuseoSans'", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        mono: ["monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
