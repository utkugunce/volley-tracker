"use client";

import React from "react";
import { trLower } from "@/utils/turkishLocale";

interface TeamBadgeProps {
  name: string;
  logoUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 sm:w-7 sm:h-7 text-[10px]",
  md: "w-8 h-8 sm:w-9 sm:h-9 text-xs",
  lg: "w-11 h-11 sm:w-12 sm:h-12 text-sm",
  xl: "w-16 h-16 sm:w-20 sm:h-20 text-xl font-black",
};

// Takım kimliği: Fileönü yüzeyi (koyu, düz) + marka renginde ince halka.
// Metin HER ZAMAN `text-ink` (#EAF6FA) ve zemin koyu yüzey tonudur (≥ 10:1);
// marka rengi yalnız metin DIŞI bir öğede (halka) kullanılır → okunurluk markadan bağımsız.
export interface TeamPalette {
  bg: string;
  border: string;
  text: string;
  /** Logo görseli için kontrastlı açık plaka (koyu/kırmızı logolar koyu yüzeyde kaybolmasın). */
  plate: boolean;
}

export function getTeamColor(name: string = ""): TeamPalette {
  const safeName = name || "";
  const lower = trLower(safeName);

  if (lower.includes("fenerbahçe") || lower.includes("fenerbahce")) {
    return { bg: "bg-blue-950", border: "border-yellow-400", text: "text-ink", plate: true };
  }
  if (lower.includes("vakıfbank") || lower.includes("vakifbank")) {
    return { bg: "bg-surface-raised", border: "border-yellow-400", text: "text-ink", plate: true };
  }
  if (lower.includes("eczacıbaşı") || lower.includes("eczacibasi")) {
    return { bg: "bg-surface-raised", border: "border-orange-400", text: "text-ink", plate: true };
  }
  if (lower.includes("galatasaray")) {
    return { bg: "bg-surface-raised", border: "border-red-400", text: "text-ink", plate: true };
  }
  if (lower.includes("beşiktaş") || lower.includes("besiktas")) {
    return { bg: "bg-surface-raised", border: "border-slate-200", text: "text-ink", plate: true };
  }
  if (lower.includes("thy") || lower.includes("türk hava yolları")) {
    return { bg: "bg-surface-raised", border: "border-red-400", text: "text-ink", plate: true };
  }

  // Genel takımlar: nötr/serin halkalar (kırmızı = CANLI, kehribar = favori/uyarı anlamına ayrıldı)
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
 * Spor kulübü rozet arması: Kulüp renkleri ve baş harfleriyle vektörel,
 * sıfır ağ yükü, sıfır CLS ve ultra hızlı render.
 */
export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  size = "md",
  className = "",
}) => {
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const palette = getTeamColor(name);
  const initials = getInitials(name);

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full font-black tracking-tight select-none border-2 shadow-md ${palette.bg} ${palette.border} ${palette.text} ${sizeClass} ${className}`}
      title={name}
      aria-label={`${name} rozeti`}
    >
      <span className="drop-shadow-xs">{initials}</span>
      {/* İnce iç parıltı çemberi */}
      <div className="absolute inset-0 rounded-full border border-ink/10 pointer-events-none" />
    </div>
  );
};
