"use client";

import React from "react";

export interface FormMatchItem {
  id?: string;
  result: "win" | "loss" | "W" | "L";
  score?: string;
  opponent?: string;
  date?: string;
}

interface FormBadgeProps {
  matches: FormMatchItem[];
  maxCount?: number;
  className?: string;
}

export const FormBadge: React.FC<FormBadgeProps> = ({
  matches = [],
  maxCount = 5,
  className = "",
}) => {
  // Son N maçı al (kronolojik olarak en son oynananlar)
  const recent = matches.slice(0, maxCount);

  if (recent.length === 0) {
    return <span className="text-xs text-slate-500">Henüz maç yok</span>;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {recent.map((m, idx) => {
        const isWin = m.result === "win" || m.result === "W";
        const label = isWin ? "G" : "M";
        const tooltip = m.opponent
          ? `${isWin ? "Galibiyet" : "Mağlubiyet"} vs ${m.opponent} (${m.score || "-"}) ${m.date ? `• ${m.date}` : ""}`
          : `${isWin ? "Galibiyet" : "Mağlubiyet"} (${m.score || "-"})`;

        return (
          <span
            key={m.id || idx}
            title={tooltip}
            className={`w-6 h-6 rounded-lg text-xs font-black font-mono flex items-center justify-center transition-transform hover:scale-115 cursor-help shadow-xs ${
              isWin
                ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-glow-emerald"
                : "bg-rose-500/25 text-rose-300 border border-rose-500/50"
            }`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
};
