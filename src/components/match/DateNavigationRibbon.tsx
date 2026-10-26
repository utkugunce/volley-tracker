"use client";

import React, { useMemo } from "react";
import { Calendar } from "lucide-react";

export type StatusFilterType = "all" | "live" | "finished" | "upcoming";

interface DateNavigationRibbonProps {
  selectedDate: string; // YYYY-MM-DD or "all"
  onSelectDate: (date: string) => void;
  todayStr: string; // YYYY-MM-DD
  statusFilter: StatusFilterType;
  onSelectStatusFilter: (status: StatusFilterType) => void;
  availableDates?: string[];
  showStatusFilters?: boolean;
  dateMatchCounts?: Record<string, number>;
  counts: {
    all: number;
    live: number;
    finished: number;
    upcoming: number;
  };
}

export const DateNavigationRibbon: React.FC<DateNavigationRibbonProps> = ({
  selectedDate,
  onSelectDate,
  todayStr,
  statusFilter,
  onSelectStatusFilter,
  counts,
  availableDates,
  showStatusFilters = true,
  dateMatchCounts,
}) => {
  const daysCarousel = useMemo(() => {
    const base = todayStr ? new Date(todayStr + "T00:00:00") : new Date();
    if (availableDates?.length) {
      const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

      const dateSet = new Set<string>();
      if (todayStr) {
        dateSet.add(todayStr);
        const yDate = new Date(`${todayStr}T00:00:00`);
        yDate.setDate(yDate.getDate() - 1);
        const yStr = `${yDate.getFullYear()}-${String(yDate.getMonth() + 1).padStart(2, "0")}-${String(yDate.getDate()).padStart(2, "0")}`;
        dateSet.add(yStr);
      }
      availableDates.forEach((d) => dateSet.add(d));
      const sortedAvailable = Array.from(dateSet).sort().reverse();

      return sortedAvailable.slice(0, 5).map((dateStr) => {
        const date = new Date(`${dateStr}T00:00:00`);
        const dayOffset = Math.round((date.getTime() - base.getTime()) / 86400000);
        const label =
          dayOffset === 0
            ? "BUGÜN"
            : dayOffset === -1
            ? "DÜN"
            : `${String(date.getDate()).padStart(2, "0")} ${dayNames[date.getDay()]}`;
        return {
          dateStr,
          label,
          shortDay: `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`,
          isToday: dayOffset === 0,
        };
      });
    }

    const offsets = [-2, -1, 0, 1, 2];
    const dayNames = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

    return offsets.map((offset) => {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      let label = "";
      if (offset === 0) label = "BUGÜN";
      else if (offset === -1) label = "DÜN";
      else if (offset === 1) label = "YARIN";
      else label = `${dd} ${dayNames[d.getDay()]}`;

      const shortDay = offset === 0 || offset === -1 || offset === 1 ? `${dd}.${mm}` : "";

      return {
        dateStr,
        label,
        shortDay,
        isToday: offset === 0,
      };
    });
  }, [todayStr, availableDates]);

  return (
    <div className="sticky top-0 z-20 bg-surface/95 backdrop-blur-md border border-line/70 rounded-xl p-2 space-y-2 mb-3">
      {/* 1. Tarih Şeridi: [-2, Dün, Bugün, Yarın, +2] + DatePicker */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* Tümü Butonu */}
        <button
          type="button"
          onClick={() => onSelectDate("all")}
          className={`px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer shrink-0 ${
            selectedDate === "all"
              ? "bg-primary text-primary-fg font-semibold"
              : "bg-surface-muted/70 text-ink-2 hover:text-white border border-line/60 font-medium"
          }`}
        >
          TÜMÜ
        </button>

        {/* Günler Bandı */}
        <div className="flex-1 flex items-center justify-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {daysCarousel.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            const dayMatchCount = dateMatchCounts?.[item.dateStr] ?? 0;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => onSelectDate(item.dateStr)}
                className={`relative flex flex-col items-center justify-center px-2 sm:px-3 py-1 rounded-lg text-xs transition-colors cursor-pointer min-w-[54px] ${
                  isSelected
                    ? "bg-primary text-primary-fg font-semibold"
                    : item.isToday
                    ? "bg-surface-muted text-primary border border-primary/40 font-semibold"
                    : "bg-surface-muted/60 text-ink-2 hover:text-white border border-line/60 font-medium"
                }`}
              >
                <span className="text-[11px] leading-tight">{item.label}</span>
                {item.shortDay && (
                  <span className="text-[9px] font-mono tabular-nums leading-none mt-0.5 opacity-80">
                    {item.shortDay}
                  </span>
                )}
                {dayMatchCount > 0 && (
                  <span
                    className={`w-1 h-1 rounded-full mt-0.5 ${
                      isSelected ? "bg-primary-fg" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Takvim İkonu ve Date Picker */}
        <label className="relative p-2 rounded-lg bg-surface-muted/70 border border-line/60 hover:border-line text-ink-2 hover:text-white transition-colors cursor-pointer shrink-0">
          <Calendar size={15} />
          <input
            type="date"
            value={selectedDate === "all" ? "" : selectedDate}
            onChange={(e) => {
              if (e.target.value) onSelectDate(e.target.value);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Tarih Seç"
            aria-label="Tarih Seç"
          />
        </label>
      </div>

      {/* 2. Durum Filtre Hapları */}
      {showStatusFilters && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1.5 border-t border-line/50 text-[11px]">
          <button
            type="button"
            onClick={() => onSelectStatusFilter("all")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === "all"
                ? "bg-primary text-primary-fg font-semibold"
                : "bg-surface-muted/60 text-ink-2 hover:text-white border border-line/60 font-medium"
            }`}
          >
            <span>Tümü</span>
            <span className="font-mono tabular-nums text-[10px] opacity-80">({counts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatusFilter("live")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === "live"
                ? "bg-live text-live-fg font-semibold"
                : "bg-surface-muted/60 text-live hover:bg-surface-muted border border-line/60 font-medium"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-live shrink-0" />
            <span>Canlı</span>
            <span className="font-mono tabular-nums text-[10px]">({counts.live})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatusFilter("finished")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === "finished"
                ? "bg-done text-done-fg font-semibold"
                : "bg-surface-muted/60 text-done hover:bg-surface-muted border border-line/60 font-medium"
            }`}
          >
            <span>Biten</span>
            <span className="font-mono tabular-nums text-[10px]">({counts.finished})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatusFilter("upcoming")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === "upcoming"
                ? "bg-surface-muted text-white font-semibold border border-line"
                : "bg-surface-muted/60 text-ink-2 hover:text-white border border-line/60 font-medium"
            }`}
          >
            <span>Program</span>
            <span className="font-mono tabular-nums text-[10px]">({counts.upcoming})</span>
          </button>
        </div>
      )}
    </div>
  );
};
