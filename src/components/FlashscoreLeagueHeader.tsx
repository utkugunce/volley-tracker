"use client";

import React from "react";
import { Trophy } from "lucide-react";

interface FlashscoreLeagueHeaderProps {
  title: string;
  subTitle?: string;
  count: number;
}

export const FlashscoreLeagueHeader: React.FC<FlashscoreLeagueHeaderProps> = ({
  title,
  subTitle,
  count,
}) => {
  return (
    <div className="bg-[#1b2438] text-white px-3 py-2 flex items-center justify-between text-xs font-semibold rounded-t-lg select-none border-b border-slate-700">
      <div className="flex items-center gap-2 truncate">
        <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
          <Trophy size={11} className="text-amber-400" />
        </div>
        <span className="text-amber-300 font-bold uppercase tracking-wider text-[11px]">
          TÜRKİYE:
        </span>
        <span className="truncate text-white font-bold">{title}</span>
        {subTitle && (
          <span className="text-slate-400 font-normal hidden sm:inline">
            - {subTitle}
          </span>
        )}
      </div>

      {/* Sağ Taraf: Flashscore Voleybol Sütun Başlıkları (1 2 3 4 5 T) */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pr-1">
          <span className="w-6 text-center">1</span>
          <span className="w-6 text-center">2</span>
          <span className="w-6 text-center">3</span>
          <span className="w-6 text-center">4</span>
          <span className="w-6 text-center">5</span>
        </div>
        <span className="text-[11px] font-bold text-slate-300 w-8 text-center bg-slate-800 px-1.5 py-0.5 rounded">
          T
        </span>
      </div>
    </div>
  );
};
