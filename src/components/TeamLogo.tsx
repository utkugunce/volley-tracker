"use client";

import React from "react";

interface TeamLogoProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}

const CLUB_PALETTES: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  eczacıbaşı: { bg: "from-orange-500 via-orange-600 to-amber-700", text: "text-white", border: "border-orange-400", ring: "ring-orange-500/30" },
  fenerbahçe: { bg: "from-yellow-400 via-amber-500 to-blue-900", text: "text-white", border: "border-yellow-400", ring: "ring-yellow-400/30" },
  galatasaray: { bg: "from-red-600 via-rose-700 to-amber-500", text: "text-white", border: "border-amber-400", ring: "ring-amber-500/30" },
  beşiktaş: { bg: "from-zinc-900 via-zinc-800 to-zinc-950", text: "text-white", border: "border-zinc-400", ring: "ring-white/20" },
  vakıfbank: { bg: "from-amber-300 via-yellow-400 to-amber-600", text: "text-zinc-950 font-black", border: "border-yellow-300", ring: "ring-amber-400/30" },
  thy: { bg: "from-red-700 via-red-800 to-rose-950", text: "text-white", border: "border-red-400", ring: "ring-red-500/30" },
  yeşilyurt: { bg: "from-emerald-500 via-emerald-700 to-teal-900", text: "text-white", border: "border-emerald-300", ring: "ring-emerald-500/30" },
  ilbank: { bg: "from-sky-500 via-blue-600 to-indigo-900", text: "text-white", border: "border-sky-300", ring: "ring-sky-400/30" },
  karayolları: { bg: "from-orange-600 via-zinc-800 to-zinc-950", text: "text-white", border: "border-orange-400", ring: "ring-orange-500/30" },
  halkbank: { bg: "from-red-600 via-blue-700 to-blue-950", text: "text-white", border: "border-red-400", ring: "ring-blue-500/30" },
  dsi: { bg: "from-blue-600 via-cyan-600 to-blue-900", text: "text-white", border: "border-cyan-300", ring: "ring-cyan-500/30" },
  ted: { bg: "from-blue-700 via-indigo-800 to-red-600", text: "text-white", border: "border-blue-400", ring: "ring-blue-500/30" },
  ibb: { bg: "from-blue-600 via-amber-500 to-red-600", text: "text-white", border: "border-blue-300", ring: "ring-amber-400/30" },
  milan: { bg: "from-red-700 via-black to-zinc-900", text: "text-white", border: "border-red-500", ring: "ring-red-500/30" },
  bahçelievler: { bg: "from-blue-600 via-teal-600 to-emerald-700", text: "text-white", border: "border-teal-300", ring: "ring-teal-400/30" },
  ümraniye: { bg: "from-emerald-600 via-emerald-800 to-green-950", text: "text-white", border: "border-emerald-400", ring: "ring-emerald-500/30" },
  silivri: { bg: "from-blue-700 via-sky-600 to-cyan-800", text: "text-white", border: "border-sky-400", ring: "ring-sky-500/30" },
};

export const TeamLogo: React.FC<TeamLogoProps> = ({ name, size = "md" }) => {
  const cleanName = (name || "").trim().toLowerCase();
  
  let palette = { bg: "from-slate-700 via-slate-800 to-slate-900", text: "text-slate-100", border: "border-slate-500", ring: "ring-slate-500/20" };
  for (const [key, val] of Object.entries(CLUB_PALETTES)) {
    if (cleanName.includes(key)) {
      palette = val;
      break;
    }
  }

  const words = (name || "").split(/\s+/).filter(Boolean);
  let initials = "";
  if (words.length >= 2) {
    initials = (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    initials = words[0].slice(0, 2).toUpperCase();
  } else {
    initials = "VT";
  }

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px] font-black border",
    sm: "w-7 h-7 text-[11px] font-black border",
    md: "w-9 h-9 text-xs font-black border-1.5",
    lg: "w-12 h-12 text-sm font-black border-2",
  }[size];

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${palette.bg} ${palette.text} ${palette.border} ring-2 ${palette.ring} flex items-center justify-center shadow-md shrink-0 tracking-wider select-none relative overflow-hidden transition-transform group-hover:scale-105`}
      title={name}
    >
      <span className="relative z-10">{initials}</span>
      {/* Volleyball textured inner glow */}
      <div className="absolute inset-0 bg-white/10 rounded-full pointer-events-none" />
    </div>
  );
};
