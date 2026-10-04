"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, MapPin, Tv } from "lucide-react";
import { TeamBadge } from "@/components/TeamBadge";
import {
  GUN_PARAM,
  TR_WEEKDAYS_SHORT,
  buildMonthGrid,
  groupMatchesByDate,
  isPlayed,
  isValidDate,
  istanbulToday,
  longDateLabel,
  monthKey,
  monthLabel,
  pickDefaultDate,
  shiftMonth,
  type CalendarMatch,
} from "@/utils/takvim";

interface TakvimCalendarProps {
  matches: CalendarMatch[];
  /** TVF fikstürü alınamadıysa true: ızgara boş gösterilir ve uyarı çıkar. */
  loadError?: boolean;
  /** Testler için: "bugün" değerini sabitler (YYYY-MM-DD). */
  todayOverride?: string;
  /** Testler için: başlangıçta URL yerine bu günü seçer. */
  initialDateOverride?: string;
}

function matchCountLabel(count: number): string {
  return count === 1 ? "1 maç" : `${count} maç`;
}

export const TakvimCalendar: React.FC<TakvimCalendarProps> = ({
  matches,
  loadError = false,
  todayOverride,
  initialDateOverride,
}) => {
  const byDate = useMemo(() => groupMatchesByDate(matches), [matches]);

  // "Bugün" ve URL'deki ?gun değeri yalnızca tarayıcıda bilinir (sayfa ISR ile önceden üretilir);
  // bu yüzden ilk render'da ızgara yerine iskelet gösterilir, hidrasyondan sonra doldurulur.
  const [today, setToday] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    const now = todayOverride ?? istanbulToday();
    const fromUrl = initialDateOverride ?? new URLSearchParams(window.location.search).get(GUN_PARAM);
    const start = isValidDate(fromUrl) ? fromUrl : pickDefaultDate(byDate, now);
    setToday(now);
    setSelected(start);
    setMonth(monthKey(start));
    // Yalnızca ilk yüklemede çalışır.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncUrl = useCallback((date: string) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set(GUN_PARAM, date);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const selectDate = useCallback(
    (date: string) => {
      setSelected(date);
      setMonth(monthKey(date));
      syncUrl(date);
    },
    [syncUrl],
  );

  const goToday = () => {
    if (today) selectDate(today);
  };

  const days = useMemo(() => (month ? buildMonthGrid(month) : []), [month]);
  const selectedMatches = byDate[selected] ?? [];
  const monthMatchCount = useMemo(
    () => days.filter((d) => d.inMonth).reduce((sum, d) => sum + (byDate[d.date]?.length ?? 0), 0),
    [days, byDate],
  );

  if (!today || !month) {
    return (
      <div aria-hidden="true" data-testid="takvim-skeleton" className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4">
        <div className="h-[34rem] rounded-2xl border border-line bg-panel animate-pulse" />
        <div className="h-64 rounded-2xl border border-line bg-panel animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {loadError && (
        <div role="alert" className="p-3 rounded-xl border border-warn/50 bg-warn/10 text-ink text-xs font-semibold">
          TVF fikstürü şu an alınamadı; maçlar listelenemiyor. Biraz sonra tekrar deneyin.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4 items-start">
        {/* ==================== AY IZGARASI ==================== */}
        <section aria-label="Sultanlar Ligi takvimi" className="rounded-2xl border border-line bg-panel shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-line bg-surface-muted">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays size={16} aria-hidden="true" className="text-primary shrink-0" />
              <h2 className="font-display font-bold text-ink text-base sm:text-lg truncate" aria-live="polite">
                {monthLabel(month)}
              </h2>
              <span className="text-[11px] text-ink-2 font-semibold whitespace-nowrap">{matchCountLabel(monthMatchCount)}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={goToday}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-line bg-panel text-ink hover:bg-surface-raised transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Bugün
              </button>
              <button
                type="button"
                onClick={() => setMonth((m) => shiftMonth(m, -1))}
                aria-label="Önceki ay"
                className="p-1.5 rounded-lg border border-line bg-panel text-ink hover:bg-surface-raised transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setMonth((m) => shiftMonth(m, 1))}
                aria-label="Sonraki ay"
                className="p-1.5 rounded-lg border border-line bg-panel text-ink hover:bg-surface-raised transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
              {TR_WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="text-center text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-ink-2 py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1" role="group" aria-label={monthLabel(month)}>
              {days.map((day) => {
                const count = byDate[day.date]?.length ?? 0;
                const isSelected = day.date === selected;
                const isToday = day.date === today;
                const dayNumber = Number(day.date.slice(8, 10));
                return (
                  <button
                    key={day.date}
                    type="button"
                    data-date={day.date}
                    data-has-matches={count > 0 ? "true" : "false"}
                    aria-pressed={isSelected}
                    aria-current={isToday ? "date" : undefined}
                    aria-label={`${longDateLabel(day.date)}${count > 0 ? `, ${matchCountLabel(count)}` : ", maç yok"}`}
                    onClick={() => selectDate(day.date)}
                    className={`relative flex flex-col items-center justify-start gap-1 min-h-[3.5rem] sm:min-h-[4.5rem] rounded-xl border px-1 pt-1.5 pb-1 text-sm transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? "bg-primary/15 border-primary text-ink shadow-glow-primary"
                        : isToday
                          ? "bg-surface-muted border-selected text-ink hover:bg-surface-raised"
                          : "bg-surface-muted/60 border-line hover:bg-surface-raised hover:border-primary/60"
                    } ${day.inMonth ? "text-ink" : "text-ink-3 opacity-60"}`}
                  >
                    <span className={`font-display font-semibold tabular-nums leading-none ${isToday ? "text-selected-text font-bold" : ""}`}>
                      {dayNumber}
                    </span>
                    {count > 0 && (
                      <span
                        data-testid="match-badge"
                        className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-fg px-1.5 py-0.5 text-[10px] font-display font-bold tabular-nums leading-none"
                      >
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-primary-fg/80" />
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ==================== SEÇİLİ GÜNÜN MAÇLARI ==================== */}
        <section
          aria-label="Seçili günün maçları"
          className="rounded-2xl border border-line bg-panel shadow-card overflow-hidden lg:sticky lg:top-[calc(var(--app-header-h,64px)+12px)]"
        >
          <div className="px-4 py-3 border-b border-line bg-surface-muted">
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-2">Seçili gün</p>
            <h2 className="font-display font-bold text-ink text-base" data-testid="selected-day-label">
              {longDateLabel(selected)}
            </h2>
            <p className="text-[11px] text-ink-2 font-semibold">{selectedMatches.length > 0 ? matchCountLabel(selectedMatches.length) : "Maç yok"}</p>
          </div>

          {selectedMatches.length === 0 ? (
            <div data-testid="empty-state" className="flex flex-col items-center text-center gap-2 px-6 py-10 text-ink-2">
              <CalendarX2 size={28} aria-hidden="true" className="text-ink-3" />
              <p className="text-sm font-semibold text-ink">Bu günde Sultanlar Ligi maçı yok</p>
              <p className="text-xs">Maç olan günler takvimde sayı rozetiyle işaretlidir.</p>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {selectedMatches.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

const MatchRow: React.FC<{ match: CalendarMatch }> = ({ match }) => {
  const played = isPlayed(match);
  const place = [match.venue, match.city].filter(Boolean).join(" · ");
  return (
    <li data-testid="match-row" className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-ink-2">
        <span className="font-display tabular-nums text-ink text-sm font-bold">{match.time || "Saat açıklanmadı"}</span>
        <span className="flex items-center gap-2">
          {match.week && <span>{match.week}. hafta</span>}
          {played && <span className="px-1.5 py-0.5 rounded-full bg-done text-done-fg text-[10px] font-bold">Bitti</span>}
        </span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge name={match.home} size="xs" />
          <span className="text-sm font-semibold text-ink truncate" title={match.home}>
            {match.home}
          </span>
        </div>
        <span data-testid="home-score" className="font-display font-bold text-ink tabular-nums text-base text-right">
          {played ? match.homeSets : ""}
        </span>
        <div className="flex items-center gap-2 min-w-0">
          <TeamBadge name={match.away} size="xs" />
          <span className="text-sm font-semibold text-ink truncate" title={match.away}>
            {match.away}
          </span>
        </div>
        <span data-testid="away-score" className="font-display font-bold text-ink tabular-nums text-base text-right">
          {played ? match.awaySets : ""}
        </span>
      </div>

      {played && match.setScores && (
        <p data-testid="set-scores" className="text-[11px] text-ink-2 font-display tabular-nums">
          {match.setScores}
        </p>
      )}

      <div className="space-y-1 text-[11px] text-ink-2">
        {place && (
          <p className="flex items-start gap-1.5">
            <MapPin size={12} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
            <span>{place}</span>
          </p>
        )}
        {match.broadcaster && (
          <p className="flex items-start gap-1.5">
            <Tv size={12} aria-hidden="true" className="mt-0.5 shrink-0 text-ink-3" />
            <span>{match.broadcaster}</span>
          </p>
        )}
      </div>
    </li>
  );
};
