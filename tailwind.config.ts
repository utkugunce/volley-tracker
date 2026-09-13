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
        background: "#F8FAFC",
        surface: "#FFFFFF",
        "surface-muted": "#F1F5F9",
        border: "#E2E8F0",
        "border-dark": "#CBD5E1",
        primary: {
          DEFAULT: "#DC2626", // TVF Kırmızı
          hover: "#B91C1C",
          light: "#FEE2E2",
        },
        navy: {
          DEFAULT: "#0F172A",
          light: "#1E293B",
          muted: "#475569",
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
