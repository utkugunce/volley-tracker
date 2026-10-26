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
    <header className="sticky top-0 z-40 bg-canvas border-b border-line px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            prefetch={false}
            href={league.citySlug ? `/${league.citySlug}` : "/"}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-2 hover:text-ink bg-surface hover:bg-surface-raised border border-line px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Geri dön"
          >
            <ChevronLeft size={15} />
            <span className="hidden sm:inline">Geri</span>
          </Link>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-ink-3 truncate">
            <Link prefetch={false} href="/" className="hover:text-ink transition-colors">
              Anasayfa
            </Link>
            <span>/</span>
            <Link
              prefetch={false}
              href={league.citySlug ? `/${league.citySlug}` : "/"}
              className="hover:text-ink text-ink-2 font-semibold transition-colors"
            >
              {league.city}
            </Link>
            <span>/</span>
            <span className="text-ink font-bold truncate">{league.category}</span>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-line text-ink-2 hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Ara (Ctrl+K)"
          >
            <Search size={13} className="text-ink-3" />
            <span className="hidden sm:inline">Ara</span>
            <kbd className="hidden md:inline-block text-[10px] bg-surface-muted border border-line px-1.5 py-0.5 rounded text-ink-3">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={handleCopyLink}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-surface hover:bg-surface-raised border border-line text-ink-2 hover:text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Bağlantıyı kopyala"
          >
            {copiedLink ? <Check size={13} className="text-done" /> : <Share2 size={13} />}
            <span className="hidden sm:inline">{copiedLink ? "Kopyalandı!" : "Paylaş"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
