"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { PAGE_SIZE } from "@/utils/fixtureTable";

interface FixtureLoadMoreProps {
  remainingCount: number;
  totalCount: number;
  setVisibleLimit: React.Dispatch<React.SetStateAction<number>>;
}

/** Sayfalama / Daha Fazla Göster (DOM yükünü hafifletir) */
export function FixtureLoadMore({ remainingCount, totalCount, setVisibleLimit }: FixtureLoadMoreProps) {
  return (
    <div className="p-3 text-center no-print border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => setVisibleLimit((prev) => prev + PAGE_SIZE)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <span>Daha Fazla Maç Göster ({remainingCount} maç kaldı)</span>
        <ChevronDown size={14} className="text-slate-400" />
      </button>
      <button
        type="button"
        onClick={() => setVisibleLimit(totalCount)}
        className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline cursor-pointer"
      >
        Tümünü Göster ({totalCount})
      </button>
    </div>
  );
}
