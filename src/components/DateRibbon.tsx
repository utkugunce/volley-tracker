"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface DateRibbonProps {
  dates: string[];
  selectedDate: string; // "all" or "YYYY-MM-DD"
  onSelectDate: (d: string) => void;
  dateCounts: { [dateStr: string]: number };
  todayStr: string;
  yesterdayStr?: string;
  variant?: "red" | "emerald";
}

export const DateRibbon: React.FC<DateRibbonProps> = ({
  dates,
  selectedDate,
  onSelectDate,
  dateCounts,
  todayStr,
  yesterdayStr,
  variant = "red",
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const isEmerald = variant === "emerald";

  const handleScroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const offset = direction === "left" ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
    }
  };

  // Seçilen tarih değiştiğinde butonu görünür alana ortala
  React.useEffect(() => {
    if (selectedDate && selectedDate !== "all" && scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector<HTMLElement>('[aria-selected="true"]');
      if (activeEl && typeof activeEl.scrollIntoView === "function") {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [selectedDate]);

  // Eğer takvimden seçilen tarih listede yoksa, geçici olarak listenin başına ekle
  const displayDates = React.useMemo(() => {
    if (selectedDate && selectedDate !== "all" && !dates.includes(selectedDate)) {
      return [selectedDate, ...dates];
    }
    return dates;
  }, [dates, selectedDate]);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") {
      return { top: "FİKSTÜR", bottom: "Tarihsiz", isToday: false, isYesterday: false };
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return { top: "FİKSTÜR", bottom: dateStr, isToday: false, isYesterday: false };
    }
    const dayNum = d.getDate();
    const month = d.toLocaleDateString("tr-TR", { month: "short" });
    const weekday = d.toLocaleDateString("tr-TR", { weekday: "short" });

    if (dateStr === todayStr) {
      return { top: "BUGÜN", bottom: `${dayNum} ${month}`, isToday: true, isYesterday: false };
    }
    if (yesterdayStr && dateStr === yesterdayStr) {
      return { top: "DÜN", bottom: `${dayNum} ${month}`, isToday: false, isYesterday: true };
    }

    return { top: weekday.toUpperCase(), bottom: `${dayNum} ${month}`, isToday: false, isYesterday: false };
  };

  return (
    <div
      className="glass-panel text-white rounded-2xl p-2 shadow-card flex items-center gap-1.5 mb-4 no-print border border-slate-800/80"
      role="region"
      aria-label="Tarih seçim şeridi"
    >
      {/* Sol Ok */}
      <button
        type="button"
        onClick={() => handleScroll("left")}
        aria-label="Önceki günler"
        className={`p-2 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-all shrink-0 focus:outline-none cursor-pointer active:scale-90 ${
          isEmerald ? "focus-visible:ring-2 focus-visible:ring-emerald-400" : "focus-visible:ring-2 focus-visible:ring-primary"
        }`}
        title="Önceki Günler"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* "TÜMÜ" Butonu */}
      <button
        type="button"
        role="tab"
        aria-selected={selectedDate === "all"}
        aria-label="Tüm tarihleri göster"
        onClick={() => onSelectDate("all")}
        className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 ${
          selectedDate === "all"
            ? isEmerald
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald font-bold ring-2 ring-emerald-500/30"
              : "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold ring-2 ring-red-500/30"
            : isEmerald
            ? "glass-panel text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800 focus-visible:ring-emerald-400"
            : "glass-panel text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800 focus-visible:ring-primary"
        }`}
      >
        TÜMÜ
      </button>

      {/* Takvimden Seç Butonu (Calendar Date Picker) */}
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label="Takvimden tarih seç"
          onClick={() => {
            try {
              dateInputRef.current?.showPicker();
            } catch {
              dateInputRef.current?.focus();
            }
          }}
          className={`px-2.5 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all duration-150 cursor-pointer flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 ${
            selectedDate !== "all" && !dates.includes(selectedDate)
              ? isEmerald
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-glow-emerald font-bold ring-2 ring-emerald-500/30"
                : "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red font-bold ring-2 ring-red-500/30"
              : isEmerald
              ? "glass-panel text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800 focus-visible:ring-emerald-400"
              : "glass-panel text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800 focus-visible:ring-primary"
          }`}
          title="Takvimden Tarih Seç"
        >
          <Calendar size={14} aria-hidden="true" className={isEmerald ? "text-emerald-400" : "text-rose-400"} />
          <span className="hidden sm:inline">Takvim</span>
        </button>
        <input
          ref={dateInputRef}
          type="date"
          aria-label="Tarih seçici"
          value={selectedDate !== "all" ? selectedDate : ""}
          onChange={(e) => {
            if (e.target.value) {
              onSelectDate(e.target.value);
            }
          }}
          className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
          tabIndex={-1}
        />
      </div>

      {/* Yatay Tarih Şeridi */}
      <div
        ref={scrollContainerRef}
        role="tablist"
        aria-label="Tarih sekmeleri"
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {displayDates.map((dStr) => {
          const isSelected = selectedDate === dStr;
          const { top, bottom, isToday, isYesterday } = formatDateLabel(dStr);
          const count = dateCounts[dStr] || 0;

          return (
            <button
              key={dStr}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-label={`${top} ${bottom}${count > 0 ? `, ${count} maç` : ""}`}
              onClick={() => onSelectDate(dStr)}
              className={`flex flex-col items-center justify-center min-w-[74px] px-3 py-1.5 rounded-xl transition-all duration-150 shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 ${
                isEmerald ? "focus-visible:ring-emerald-400" : "focus-visible:ring-primary"
              } ${
                isSelected
                  ? isEmerald
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-glow-emerald ring-2 ring-emerald-500/30"
                    : "bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-glow-red ring-2 ring-red-500/30"
                  : isToday
                  ? "bg-amber-500/10 text-amber-300 font-bold border border-amber-500/40 hover:bg-amber-500/20"
                  : isYesterday
                  ? isEmerald
                    ? "bg-teal-500/15 text-teal-300 font-bold border border-teal-500/40 hover:bg-teal-500/25"
                    : "bg-sky-500/10 text-sky-300 font-bold border border-sky-500/40 hover:bg-sky-500/20"
                  : "glass-panel text-slate-300 hover:bg-slate-800/70 hover:text-white border-slate-800/80"
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
        type="button"
        onClick={() => handleScroll("right")}
        aria-label="Sonraki günler"
        className={`p-2 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-white transition-all shrink-0 focus:outline-none cursor-pointer active:scale-90 ${
          isEmerald ? "focus-visible:ring-2 focus-visible:ring-emerald-400" : "focus-visible:ring-2 focus-visible:ring-primary"
        }`}
        title="Sonraki Günler"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
};
