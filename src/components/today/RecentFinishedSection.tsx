import React from "react";
import { History } from "lucide-react";
import type { Match } from "@/types/fixture";
import { formatDateTurkish } from "@/utils/calendar";
import type { MatchDay } from "@/utils/todayMatches";

interface RecentFinishedSectionProps {
  recentFinishedDay: MatchDay;
  renderMatchCard: (m: Match) => React.ReactNode;
}

/** Akıllı Yedek Görünüm 2: Son Tamamlanan Karşılaşmalar */
export function RecentFinishedSection({ recentFinishedDay, renderMatchCard }: RecentFinishedSectionProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between px-1 border-t border-slate-700/50 pt-4">
        <div className="flex items-center gap-2">
          <History size={14} className="text-slate-500" />
          <h3 className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider">
            Son Tamamlanan Maçlar:{" "}
            <span className="text-white font-extrabold">
              {formatDateTurkish(recentFinishedDay.date)}
            </span>
          </h3>
        </div>
        <span className="text-xs text-slate-500">
          {recentFinishedDay.matches.length} Sonuç
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        {recentFinishedDay.matches.map((m) => renderMatchCard(m))}
      </div>
    </div>
  );
}
