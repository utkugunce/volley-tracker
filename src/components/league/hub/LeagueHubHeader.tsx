"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft, Search, Check, Share2 } from "lucide-react";
import { LeagueData } from "@/utils/leagueData";

export interface LeagueHubHeaderProps {
  copiedLink: boolean;
  handleCopyLink: () => void;
  league: LeagueData;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function LeagueHubHeader({ copiedLink, handleCopyLink, league, setIsSearchOpen }: LeagueHubHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-canvas/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={league.citySlug ? `/${league.citySlug}` : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Geri dön"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Geri</span>
          </Link>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 truncate">
            <Link href="/" className="hover:text-white transition-colors">
              Anasayfa
            </Link>
            <span>/</span>
            <Link
              href={league.citySlug ? `/${league.citySlug}` : "/"}
              className="hover:text-sky-300 text-sky-400 font-medium transition-colors"
            >
              {league.city}
            </Link>
            <span>/</span>
            <span className="text-white font-bold truncate">{league.category}</span>
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ara (Ctrl+K)"
          >
            <Search size={14} className="text-slate-400" />
            <span className="hidden sm:inline">Ara</span>
            <kbd className="hidden md:inline-block text-[10px] bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bağlantıyı kopyala"
          >
            {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{copiedLink ? "Kopyalandı!" : "Paylaş"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
