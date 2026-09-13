"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateRibbonProps {
  dates: string[];
  selectedDate: string; // "all" or "YYYY-MM-DD"
  onSelectDate: (d: string) => void;
  dateCounts: { [dateStr: string]: number };
  todayStr: string;
}

export const DateRibbon: React.FC<DateRibbonProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  dateCounts,
  todayStr,
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") {
      return { top: "FİKSTÜR", bottom: "Tarihsiz", isToday: false };
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { top: "FİKSTÜR", bottom: dateStr, isToday: false };
    }
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("tr-TR", { month: "short" });
    const weekday = d.toLocaleDateString("tr-TR", { weekday: "short" });

    if (dateStr === todayStr) {
      return { top: "BUGÜN", bottom: `${dayNum} ${month}`, isToday: true };
    }

    return { top: weekday.toUpperCase(), bottom: `${dayNum} ${month}`, isToday: false };
  };

  return (
    <div className="bg-[#0e1526] text-white rounded-lg p-1.5 shadow-md flex items-center gap-1.5 mb-4 no-print border border-slate-800">
      {/* Sol Ok */}
      <button
        onClick={() => handleScroll("left")}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        title="Önceki Günler"
      >
        <ChevronLeft size={16} />
      </button>

      {/* "TÜMÜ" Butonu */}
      <button
        onClick={() => onSelectDate("all")}
        className={`px-3 py-1.5 rounded text-xs font-bold shrink-0 transition-all ${
          selectedDate === "all"
            ? "bg-primary text-white shadow-sm"
            : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
        }`}
      >
        TÜMÜ
      </button>

      {/* Yatay Tarih Şeridi */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {dates.map((dStr) => {
          const isSelected = selectedDate === dStr;
          const { top, bottom, isToday } = formatDateLabel(dStr);
          const count = dateCounts[dStr] || 0;

          return (
            <button
              key={dStr}
              onClick={() => onSelectDate(dStr)}
              className={`flex flex-col items-center justify-center min-w-[72px] px-2.5 py-1 rounded transition-all shrink-0 ${
                isSelected
                  ? "bg-primary text-white font-bold shadow-sm"
                  : isToday
                  ? "bg-slate-800 text-amber-300 font-semibold hover:bg-slate-700"
                  : "bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-1">
                <span className="text-[10px] tracking-wider leading-tight">{top}</span>
                {count > 0 && (
                  <span
                    className={`text-[9px] px-1 rounded-full font-mono ${
                      isSelected ? "bg-black/30 text-white" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold leading-tight mt-0.5">{bottom}</span>
            </button>
          );
        })}
      </div>

      {/* Sağ Ok */}
      <button
        onClick={() => handleScroll("right")}
        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
        title="Sonraki Günler"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
