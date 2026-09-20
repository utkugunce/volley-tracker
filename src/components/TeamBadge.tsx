"use client";

import React, { useState } from "react";
import Image from "next/image";
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

const PIXEL_MAP = {
  xs: 20,
  sm: 28,
  md: 36,
  lg: 48,
  xl: 80,
};

// Takım adına göre tutarlı renk paleti (Deterministic Color Hashing)
function getTeamColor(name: string): { bg: string; border: string; text: string } {
  const lower = trLower(name);

  if (lower.includes("fenerbahçe")) {
    return {
      bg: "bg-gradient-to-br from-yellow-400 via-blue-900 to-blue-950",
      border: "border-yellow-400/70",
      text: "text-yellow-300",
    };
  }
  if (lower.includes("vakıfbank") || lower.includes("vakifbank")) {
    return {
      bg: "bg-gradient-to-br from-yellow-500 via-amber-700 to-slate-950",
      border: "border-yellow-500/80",
      text: "text-amber-200",
    };
  }
  if (lower.includes("eczacıbaşı") || lower.includes("eczacibasi")) {
    return {
      bg: "bg-gradient-to-br from-orange-500 via-red-700 to-slate-950",
      border: "border-orange-500/80",
      text: "text-orange-200",
    };
  }
  if (lower.includes("galatasaray")) {
    return {
      bg: "bg-gradient-to-br from-amber-500 via-red-800 to-red-950",
      border: "border-red-500/80",
      text: "text-amber-200",
    };
  }
  if (lower.includes("beşiktaş") || lower.includes("besiktas")) {
    return {
      bg: "bg-gradient-to-br from-slate-200 via-slate-800 to-black",
      border: "border-slate-300/80",
      text: "text-white",
    };
  }
  if (lower.includes("thy") || lower.includes("türk hava yolları")) {
    return {
      bg: "bg-gradient-to-br from-red-600 via-rose-900 to-slate-950",
      border: "border-red-500/70",
      text: "text-white",
    };
  }

  // Genel takımlar için metin hash'i ile estetik spor gradyanları
  const PALETTES = [
    { bg: "bg-gradient-to-br from-red-600 to-rose-950", border: "border-red-500/50", text: "text-red-100" },
    { bg: "bg-gradient-to-br from-sky-500 to-indigo-950", border: "border-sky-500/50", text: "text-sky-100" },
    { bg: "bg-gradient-to-br from-emerald-500 to-teal-950", border: "border-emerald-500/50", text: "text-emerald-100" },
    { bg: "bg-gradient-to-br from-purple-500 to-indigo-950", border: "border-purple-500/50", text: "text-purple-100" },
    { bg: "bg-gradient-to-br from-amber-500 to-orange-950", border: "border-amber-500/50", text: "text-amber-100" },
    { bg: "bg-gradient-to-br from-teal-500 to-slate-950", border: "border-teal-500/50", text: "text-teal-100" },
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

// İsimden kısa spor kulübü kısaltması (2-3 harf) üret
function getInitials(name: string): string {
  const clean = name
    .replace(/\b(sk|gsk|belediyesi|belediye|bld|spor|kulübü|kulubu|ortaokulu|koleji|akademi)\b/gi, "")
    .trim();

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export const TeamBadge: React.FC<TeamBadgeProps> = ({
  name,
  logoUrl,
  size = "md",
  className = "",
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const pxSize = PIXEL_MAP[size] || 36;
  const palette = getTeamColor(name);
  const initials = getInitials(name);

  if (logoUrl && !imgFailed) {
    return (
      <div
        className={`relative shrink-0 flex items-center justify-center rounded-full overflow-hidden ${sizeClass} ${className}`}
      >
        <Image
          src={logoUrl}
          alt={`${name} logosu`}
          width={pxSize}
          height={pxSize}
          className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] transition-transform duration-200 hover:scale-110"
          unoptimized={logoUrl.startsWith("http")}
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  // Şık spor rozet/arması fallback'i
  return (
    <div
      className={`relative shrink-0 flex items-center justify-center rounded-full font-black tracking-tight select-none border shadow-md ${palette.bg} ${palette.border} ${palette.text} ${sizeClass} ${className}`}
      title={name}
      aria-label={`${name} rozeti`}
    >
      <span className="drop-shadow-xs">{initials}</span>
      {/* İnce iç parıltı çemberi */}
      <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
    </div>
  );
};
