import React from "react";

/** Alt Açıklama / Legend (sıralama çizgileri ve form göstergesi). */
export function StandingsLegend() {
  return (
    <div className="border-t border-line px-3 sm:px-4 py-2 sm:py-3 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-ink-3">
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded bg-primary" />
          <span className="font-bold text-ink-2">1-2: Final Etabı (Play-Off)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded bg-rank-mid" />
          <span className="font-bold text-ink-2">3-8: Klasman Etabı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-[3px] h-3 rounded bg-line" />
          <span>9+: Normal Sezon</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-medium">Form:</span>
        <span className="flex items-center gap-1">
          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] border-done text-done text-[8px] font-bold">G</span>
          <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border-[1.5px] border-form-loss text-form-loss text-[8px] font-bold">M</span>
          <span className="h-[14px] w-[14px] rounded-full border border-dashed border-line" />
          <span className="ml-0.5">oynanmadı</span>
        </span>
      </div>
    </div>
  );
}
