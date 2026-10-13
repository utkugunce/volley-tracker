"use client";

import React, { useSyncExternalStore } from "react";
import { trLower } from "@/utils/turkishLocale";
import { slugify } from "@/utils/slugify";
import teamPaletteData from "@/data/team-palette.json";

interface TeamPaletteSchema {
  p: [string, string, string][]; // [borderHex, borderClass, bgClass]
}

const colorsDb = teamPaletteData as unknown as TeamPaletteSchema;

// Takım kimliği: Fileönü yüzeyi (koyu, düz) + marka renginde ince halka.
// Metin HER ZAMAN `text-ink` (#EAF6FA) ve zemin koyu yüzey tonudur (≥ 10:1);
// marka rengi yalnız metin DIŞI bir öğede (halka) kullanılır → okunurluk markadan bağımsız.
export interface TeamPalette {
  bg: string;
  border: string;
  borderColor?: string;
  text: string;
  /** Logo görseli için kontrastlı açık plaka (koyu/kırmızı logolar koyu yüzeyde kaybolmasın). */
  plate: boolean;
}

interface TeamBadgeProps {
  name: string;
  logoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  colorIdx?: number;
  color?: string;
  palette?: TeamPalette;
}

const SIZE_MAP = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 sm:w-7 sm:h-7 text-[10px]",
  md: "w-8 h-8 sm:w-9 sm:h-9 text-xs",
  lg: "w-11 h-11 sm:w-12 sm:h-12 text-sm",
  xl: "w-16 h-16 sm:w-20 sm:h-20 text-xl font-black",
};

// Global durum ve lazy indeks haritası
let colorIndexMap: Record<string, number> | null = null;
let importPromise: Promise<Record<string, number>> | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeColorIndex(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getColorIndexSnapshot(): boolean {
  return colorIndexMap !== null;
}

const getServerSnapshot = (): boolean => false;

/** İstemcide renk indeksinin yüklendiğini dinleyen kanca */
export function useTeamColorIndexLoaded(): boolean {
  return useSyncExternalStore(subscribeColorIndex, getColorIndexSnapshot, getServerSnapshot);
}

// Test ortamında (Vitest / Node) haritayı senkron başlat
if (typeof window === "undefined" || process.env.NODE_ENV === "test") {
  try {
    colorIndexMap = require("../data/team-color-index.json");
  } catch {
    // derleme anında sessizce devam eder
  }
}

/** Tembel indeks yükleyicisi */
export function ensureColorIndexLoaded(): void {
  if (colorIndexMap !== null || importPromise !== null) return;

  if (typeof window !== "undefined") {
    importPromise = import("@/data/team-color-index.json")
      .then((mod) => {
        colorIndexMap = (mod.default || mod) as Record<string, number>;
        notify();
        return colorIndexMap;
      })
      .catch(() => {
        colorIndexMap = {};
        return colorIndexMap;
      });
  }
}

// Tarayıcıda boşta kalma anında (requestIdleCallback) arka planda yüklemeyi tetikle
if (typeof window !== "undefined") {
  if ("requestIdleCallback" in window) {
    (window as Window & { requestIdleCallback: (cb: () => void) => number }).requestIdleCallback(() => {
      ensureColorIndexLoaded();
    });
  } else {
    setTimeout(ensureColorIndexLoaded, 10);
  }
}

export function getTeamColor(name: string = ""): TeamPalette {
  const safeName = name || "";
  const lower = trLower(safeName);

  if (lower.includes("fenerbahçe") || lower.includes("fenerbahce")) {
    return { bg: "bg-blue-950", border: "border-yellow-400", borderColor: "#fbee00", text: "text-ink", plate: true };
  }
  if (lower.includes("vakıfbank") || lower.includes("vakifbank")) {
    return { bg: "bg-surface-raised", border: "border-yellow-400", borderColor: "#f9b800", text: "text-ink", plate: true };
  }
  if (lower.includes("eczacıbaşı") || lower.includes("eczacibasi")) {
    return { bg: "bg-surface-raised", border: "border-orange-400", borderColor: "#ec8c04", text: "text-ink", plate: true };
  }
  if (lower.includes("galatasaray")) {
    return { bg: "bg-surface-raised", border: "border-red-400", borderColor: "#a90432", text: "text-ink", plate: true };
  }
  if (lower.includes("beşiktaş") || lower.includes("besiktas")) {
    return { bg: "bg-surface-raised", border: "border-slate-200", borderColor: "#e2e8f0", text: "text-ink", plate: true };
  }
  if (lower.includes("thy") || lower.includes("türk hava yolları")) {
    return { bg: "bg-surface-raised", border: "border-red-400", borderColor: "#c61132", text: "text-ink", plate: true };
  }
  if (lower.includes("zeren spor") || lower.includes("zeren")) {
    return { bg: "bg-purple-950", border: "border-purple-400", borderColor: "#a855f7", text: "text-ink", plate: true };
  }

  // 1. Taranan logo renk veritabanından eşleşme ara
  ensureColorIndexLoaded();
  if (colorIndexMap && colorsDb?.p) {
    const s1 = slugify(safeName);
    const s2 = lower;
    const clean = lower
      .replace(/\b(sk|gsk|spor kulübü|spor kulubu|gençlik ve spor|genclik ve spor|voleybol|belediyesi|belediye|bld|koleji|akademi|ortaokulu)\b/gi, "")
      .trim();
    const s3 = slugify(clean);

    const idx = colorIndexMap[s1] ?? colorIndexMap[s2] ?? colorIndexMap[s3];
    if (idx !== undefined && colorsDb.p[idx]) {
      const [borderColor, borderClass, bgClass] = colorsDb.p[idx];
      return {
        bg: bgClass,
        border: borderClass,
        borderColor,
        text: "text-ink",
        plate: false,
      };
    }
  }

  // 2. Genel eşleşmeyen takımlar: nötr/serin halkalar (kırmızı = CANLI, kehribar = favori/uyarı anlamına ayrıldı)
  const PALETTES: TeamPalette[] = [
    { bg: "bg-blue-950", border: "border-blue-400", text: "text-ink", plate: false },
    { bg: "bg-teal-950", border: "border-teal-400", text: "text-ink", plate: false },
    { bg: "bg-purple-950", border: "border-purple-400", text: "text-ink", plate: false },
    { bg: "bg-surface-raised", border: "border-slate-300", text: "text-ink", plate: false },
    { bg: "bg-teal-950", border: "border-teal-600", text: "text-ink", plate: false },
    { bg: "bg-blue-950", border: "border-slate-400", text: "text-ink", plate: false },
  ];

  let hash = 0;
  for (let i = 0; i < safeName.length; i++) {
    hash = (hash << 5) - hash + safeName.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

// İsimden kısa spor kulübü kısaltması (2-3 harf) üret
function getInitials(name: string = ""): string {
  const safe = name || "";
  const clean = safe
    .replace(/\b(sk|gsk|belediyesi|belediye|bld|spor|kulübü|kulubu|ortaokulu|koleji|akademi)\b/gi, "")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return safe.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Spor kulübü rozet arması: Kulüp logolarından taranmış gerçek renkler
 * ve baş harfleriyle vektörel, sıfır ağ yükü, sıfır CLS ve ultra hızlı render.
 */
export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  size = "md",
  className = "",
  colorIdx,
  color,
  palette: propPalette,
}) => {
  // İstemcide lazy index yüklendiğinde yeniden render tetikle
  useTeamColorIndexLoaded();

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;

  let palette: TeamPalette;
  if (propPalette) {
    palette = propPalette;
  } else if (colorIdx !== undefined && colorsDb?.p[colorIdx]) {
    const [borderColor, borderClass, bgClass] = colorsDb.p[colorIdx];
    palette = {
      bg: bgClass,
      border: borderClass,
      borderColor,
      text: "text-ink",
      plate: false,
    };
  } else if (color) {
    palette = {
      bg: "bg-surface-raised",
      border: "border-slate-300",
      borderColor: color,
      text: "text-ink",
      plate: false,
    };
  } else {
    palette = getTeamColor(name);
  }

  const initials = getInitials(name);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full font-black tracking-tight select-none border-2 shadow-md ${palette.bg} ${palette.border} ${palette.text} ${sizeClass} ${className}`}
      style={palette.borderColor ? { borderColor: palette.borderColor } : undefined}
      title={name}
      aria-label={`${name} rozeti`}
    >
      <span className="drop-shadow-xs">{initials}</span>
      {/* İnce iç parıltı çemberi */}
      <div className="absolute inset-0 rounded-full border border-ink/10 pointer-events-none" />
    </div>
  );
};
