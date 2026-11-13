"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCopy,
  Database,
  ExternalLink,
  ListChecks,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";
import type { Match, StandingItem } from "@/types/fixture";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import {
  buildVolleyboxWorkbenchData,
  formatMatchForVolleyboxCopy,
  formatSetScoresForVolleybox,
  getResolvedVolleyboxTeamName,
  type VolleyboxQueueTab,
} from "@/utils/volleyboxWorkbench";

interface VolleyboxWorkbenchPanelProps {
  matches: Match[];
  standings?: Record<string, StandingItem[]>;
  city?: string;
  isPartialData?: boolean;
  onEnsureFullData?: () => void;
  onSelectMatch?: (match: Match) => void;
}

const DEFAULT_PAGE_SIZE = 15;

export const VolleyboxWorkbenchPanel: React.FC<VolleyboxWorkbenchPanelProps> = ({
  matches,
  standings,
  city,
  isPartialData = false,
  onEnsureFullData,
  onSelectMatch,
}) => {
  const workbench = useMemo(
    () => buildVolleyboxWorkbenchData(matches, standings, city),
    [matches, standings, city]
  );

  // Pick a meaningful default active tab with actionable items if missing_scores is empty
  const [activeTab, setActiveTab] = useState<VolleyboxQueueTab>(() => {
    if (workbench.counts.missingScores > 0) return "missing_scores";
    if (workbench.counts.discrepancies > 0) return "discrepancies";
    if (workbench.counts.unsynced > 0) return "unsynced";
    if (workbench.counts.unmappedTeams > 0) return "unmapped_teams";
    return "missing_scores";
  });

  const [cityFilter, setCityFilter] = useState<string>("all");
  const [visibleLimit, setVisibleLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const handleCopy = (key: string, text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!text) return;
    try {
      void navigator.clipboard?.writeText(text);
    } catch {
      // Clipboard API may be unavailable in restricted contexts
    }
    setCopiedKey(key);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleTabChange = (tab: VolleyboxQueueTab) => {
    setActiveTab(tab);
    setVisibleLimit(DEFAULT_PAGE_SIZE);
    setCityFilter("all");
    if (isPartialData) {
      onEnsureFullData?.();
    }
  };

  const tabs: Array<{
    id: VolleyboxQueueTab;
    label: string;
    count: number;
    icon: React.ReactNode;
    accentClass: string;
  }> = [
    {
      id: "missing_scores",
      label: "Skoru Girilecekler",
      count: workbench.counts.missingScores,
      icon: <CheckCircle2 size={13} className="text-rose-400" />,
      accentClass: "border-rose-500/40 text-rose-300 bg-rose-500/15",
    },
    {
      id: "discrepancies",
      label: "Bilgisi Değişenler",
      count: workbench.counts.discrepancies,
      icon: <AlertTriangle size={13} className="text-amber-400" />,
      accentClass: "border-amber-500/40 text-amber-300 bg-amber-500/15",
    },
    {
      id: "unsynced",
      label: "VB'ye Girilmeyenler",
      count: workbench.counts.unsynced,
      icon: <ListChecks size={13} className="text-sky-400" />,
      accentClass: "border-sky-500/40 text-sky-300 bg-sky-500/15",
    },
    {
      id: "unmapped_teams",
      label: "Eşleşmeyen Takımlar",
      count: workbench.counts.unmappedTeams,
      icon: <Users size={13} className="text-purple-400" />,
      accentClass: "border-purple-500/40 text-purple-300 bg-purple-500/15",
    },
    {
      id: "standings_anomalies",
      label: "Puan & Hükmen",
      count: workbench.counts.standingsAnomalies,
      icon: <ShieldAlert size={13} className="text-amber-400" />,
      accentClass: "border-amber-500/40 text-amber-300 bg-amber-500/15",
    },
  ];

  // Collect available city options for the currently active tab
  const availableCitiesForTab = useMemo(() => {
    const set = new Set<string>();
    const addCity = (c?: string) => {
      const val = (c || "").trim();
      if (val && val !== "Tüm İller") set.add(val);
    };
    if (activeTab === "missing_scores") {
      workbench.missingScores.forEach((m) => addCity(m.city || city));
    } else if (activeTab === "discrepancies") {
      workbench.discrepancies.forEach((m) => addCity(m.city || city));
    } else if (activeTab === "unsynced") {
      workbench.unsynced.forEach((m) => addCity(m.city || city));
    } else if (activeTab === "unmapped_teams") {
      workbench.unmappedTeams.forEach((u) => addCity(u.city));
    } else if (activeTab === "standings_anomalies") {
      workbench.standingsAnomalies.forEach((a) => addCity(a.city));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
  }, [activeTab, workbench, city]);

  const renderCopyButton = (key: string, value: string, label: string) => {
    const isCopied = copiedKey === key;
    return (
      <button
        type="button"
        onClick={(e) => handleCopy(key, value, e)}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
          isCopied
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            : "bg-surface-raised hover:bg-surface-muted text-ink border-line hover:border-primary/40"
        }`}
        title={`${label} panoya kopyala`}
      >
        {isCopied ? <Check size={11} className="text-emerald-400" /> : <ClipboardCopy size={11} />}
        <span>{isCopied ? "Kopyalandı ✓" : label}</span>
      </button>
    );
  };

  const activeItems = useMemo(() => {
    const byCity = <T,>(items: T[], getCity: (item: T) => string | undefined): T[] => {
      if (cityFilter === "all") return items;
      return items.filter((item) => (getCity(item) || city) === cityFilter);
    };
    if (activeTab === "missing_scores") return byCity(workbench.missingScores, (m) => m.city);
    if (activeTab === "discrepancies") return byCity(workbench.discrepancies, (m) => m.city);
    if (activeTab === "unsynced") return byCity(workbench.unsynced, (m) => m.city);
    if (activeTab === "unmapped_teams") return byCity(workbench.unmappedTeams, (u) => u.city);
    return byCity(workbench.standingsAnomalies, (a) => a.city);
  }, [activeTab, workbench, cityFilter, city]);

  const visibleCount = Math.min(activeItems.length, visibleLimit);
  const hasMore = activeItems.length > visibleLimit;

  return (
    <section
      aria-label="Volleybox Operatör İş Kuyruğu"
      className="rounded-2xl bg-surface border border-line/80 shadow-card overflow-hidden"
    >
      {/* Header Bar */}
      <div className="px-3.5 sm:px-4 py-3 bg-surface-raised/60 border-b border-line/70 flex flex-wrap items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
            <h2 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              Volleybox Operatör İş Kuyruğu
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-scoreboard tabular-nums font-bold bg-primary/15 text-primary border border-primary/30">
              %{workbench.counts.syncPercent} VB Senkron ({workbench.counts.syncedMatches}/
              {workbench.counts.totalValidMatches})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPartialData && onEnsureFullData && (
            <button
              type="button"
              onClick={onEnsureFullData}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-fg hover:bg-primary-hover text-[11px] font-bold transition-colors cursor-pointer"
            >
              <Database size={12} />
              <span>81 İl Tam Veriyi Yükle</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Queue Tabs */}
      <div className="px-3.5 sm:px-4 py-2.5 border-b border-line/60 bg-canvas/40 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="tablist" aria-label="Volleybox iş kuyruğu sekmeleri">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 border cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-fg border-primary font-bold"
                    : "bg-surface text-ink-2 border-line/70 hover:text-white hover:bg-surface-raised"
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-scoreboard tabular-nums font-bold border ${
                    isSelected ? "bg-black/25 text-white border-white/20" : tab.accentClass
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {availableCitiesForTab.length > 1 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <label htmlFor="vb-queue-city-filter" className="text-[11px] text-ink-2 font-medium">
              İl:
            </label>
            <select
              id="vb-queue-city-filter"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setVisibleLimit(DEFAULT_PAGE_SIZE);
              }}
              className="px-2 py-1 rounded-lg bg-surface-raised border border-line text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Tüm İller ({activeItems.length})</option>
              {availableCitiesForTab.map((cName) => (
                <option key={cName} value={cName}>
                  {cName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Queue Body */}
      <div className="p-3.5 sm:p-4 space-y-2">
        {activeItems.length === 0 ? (
          <div className="text-center py-6 bg-surface-raised/40 rounded-xl border border-line/50 text-xs text-ink-2">
            Bu kuyrukta bekleyen operatör işlemi bulunmuyor.
            {isPartialData && onEnsureFullData && (
              <span className="block mt-2">
                <button
                  type="button"
                  onClick={onEnsureFullData}
                  className="text-primary font-semibold underline cursor-pointer"
                >
                  Tüm 81 ili taramak için tam veriyi yükleyin
                </button>
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {activeTab === "missing_scores" &&
              (activeItems.slice(0, visibleCount) as Match[]).map((m) => {
                const effCity = m.city || city || "";
                const vbHome = getResolvedVolleyboxTeamName(m.home_team, m.category, effCity);
                const vbAway = getResolvedVolleyboxTeamName(m.away_team, m.category, effCity);
                const setsText = formatSetScoresForVolleybox(m.set_scores);
                const fullMatchText = formatMatchForVolleyboxCopy(m, effCity);
                const vbUrl =
                  m.volleybox?.url ||
                  (m.volleybox?.match_id ? `https://women.volleybox.net/m${m.volleybox.match_id}` : null);

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(m)}
                    className="p-2.5 sm:p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-line/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold uppercase text-[10px]">
                          {effCity || "Genel"}
                        </span>
                        <span className="font-scoreboard tabular-nums text-ink-2 font-semibold">
                          {m.date} {m.time}
                        </span>
                        <span className="text-ink-2 truncate">{m.category}</span>
                      </div>
                      <div className="text-xs sm:text-[13px] font-bold text-white flex items-center gap-2 flex-wrap">
                        <span className="truncate">{vbHome}</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-scoreboard tabular-nums">
                          {m.home_score} - {m.away_score}
                        </span>
                        <span className="truncate">{vbAway}</span>
                      </div>
                      {setsText && (
                        <div className="text-[11px] font-scoreboard tabular-nums text-ink-2">
                          Setler: <span className="text-ink font-semibold">{setsText}</span>
                        </div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 flex-wrap shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {setsText && renderCopyButton(`sets-${m.id}`, setsText, "Setleri Kopyala")}
                      {renderCopyButton(`match-${m.id}`, fullMatchText, "Maçı Kopyala")}
                      {vbUrl && (
                        <a
                          href={vbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                        >
                          <span>VB Maç Sayfası</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === "discrepancies" &&
              (activeItems.slice(0, visibleCount) as Match[]).map((m) => {
                const effCity = m.city || city || "";
                const vbHome = getResolvedVolleyboxTeamName(m.home_team, m.category, effCity);
                const vbAway = getResolvedVolleyboxTeamName(m.away_team, m.category, effCity);
                const disc = m.volleybox?.discrepancy;
                const vbUrl =
                  m.volleybox?.url ||
                  (m.volleybox?.match_id ? `https://women.volleybox.net/m${m.volleybox.match_id}` : null);

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(m)}
                    className="p-2.5 sm:p-3 rounded-xl bg-amber-950/20 hover:bg-amber-950/35 border border-amber-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold uppercase text-[10px]">
                          {effCity || "Genel"}
                        </span>
                        <span className="text-ink-2 truncate">{m.category}</span>
                      </div>
                      <div className="text-xs sm:text-[13px] font-bold text-white">
                        {vbHome} — {vbAway}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-scoreboard tabular-nums">
                        {disc?.date_diff && (
                          <span className="px-2 py-0.5 rounded bg-surface border border-amber-500/40 text-amber-200">
                            Tarih: {disc.vb_date || "?"} → <strong>{m.date}</strong>
                          </span>
                        )}
                        {disc?.time_diff && (
                          <span className="px-2 py-0.5 rounded bg-surface border border-amber-500/40 text-amber-200">
                            Saat: {disc.vb_time || "?"} → <strong>{m.time}</strong>
                          </span>
                        )}
                        {disc?.hall_diff && (
                          <span className="px-2 py-0.5 rounded bg-surface border border-amber-500/40 text-amber-200 font-sans">
                            Salon: {disc.vb_hall || "?"} → <strong>{m.hall}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1.5 flex-wrap shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderCopyButton(`disc-date-${m.id}`, `${m.date} ${m.time}`.trim(), "Tarih/Saat")}
                      {m.hall && m.hall !== "TBD" && renderCopyButton(`disc-hall-${m.id}`, m.hall, "Salonu Kopyala")}
                      {vbUrl && (
                        <a
                          href={vbUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[11px] font-bold transition-colors"
                        >
                          <span>VB&apos;de Düzenle</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === "unsynced" &&
              (activeItems.slice(0, visibleCount) as Match[]).map((m) => {
                const effCity = m.city || city || "";
                const vbHome = getResolvedVolleyboxTeamName(m.home_team, m.category, effCity);
                const vbAway = getResolvedVolleyboxTeamName(m.away_team, m.category, effCity);
                const leagueUrl = getVolleyboxLeagueMapping(m.category, effCity)?.volleybox_url;
                const setsText = formatSetScoresForVolleybox(m.set_scores);

                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectMatch?.(m)}
                    className="p-2.5 sm:p-3 rounded-xl bg-surface-raised/60 hover:bg-surface-raised border border-line/70 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold uppercase text-[10px]">
                          {effCity || "Genel"}
                        </span>
                        <span className="font-scoreboard tabular-nums text-ink font-semibold">
                          {m.date} {m.time}
                        </span>
                        <span className="text-ink-2 truncate">
                          {m.category}
                          {m.group ? ` · ${m.group}` : ""}
                        </span>
                      </div>
                      <div className="text-xs sm:text-[13px] font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{vbHome}</span>
                        <span className="text-ink-2 font-normal">-</span>
                        <span>{vbAway}</span>
                        {setsText && (
                          <span className="text-[11px] font-scoreboard tabular-nums text-emerald-300 font-semibold">
                            ({m.home_score}-{m.away_score}: {setsText})
                          </span>
                        )}
                      </div>
                      {m.hall && m.hall !== "TBD" && (
                        <div className="text-[11px] text-ink-2 truncate">Salon: {m.hall}</div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-1.5 flex-wrap shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {renderCopyButton(`u-date-${m.id}`, m.date, m.date)}
                      {renderCopyButton(`u-home-${m.id}`, vbHome, "Ev Sahibi")}
                      {renderCopyButton(`u-away-${m.id}`, vbAway, "Deplasman")}
                      {setsText && renderCopyButton(`u-sets-${m.id}`, setsText, "Setler")}
                      {leagueUrl && (
                        <a
                          href={leagueUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-[11px] font-bold transition-colors"
                        >
                          <span>VB Turnuvası</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}

            {activeTab === "unmapped_teams" &&
              (activeItems.slice(0, visibleCount) as typeof workbench.unmappedTeams).map((item) => (
                <div
                  key={item.key}
                  className="p-2.5 sm:p-3 rounded-xl bg-surface-raised/60 border border-line/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 font-bold uppercase text-[10px]">
                        {item.city}
                      </span>
                      <span className="text-ink-2 truncate">{item.category}</span>
                      <span className="font-scoreboard tabular-nums text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-ink">
                        {item.matchCount} maç
                      </span>
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold text-white truncate">
                      {item.teamName}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {renderCopyButton(`unmap-${item.key}`, item.teamName, "Adı Kopyala")}
                    <a
                      href={item.volleyboxSearchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-[11px] font-bold transition-colors"
                    >
                      <Search size={11} />
                      <span>Volleybox&apos;ta Ara</span>
                      <ExternalLink size={11} />
                    </a>
                    {item.leagueVolleyboxUrl && (
                      <a
                        href={item.leagueVolleyboxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-surface hover:bg-surface-muted text-ink border border-line text-[11px] font-semibold transition-colors"
                      >
                        <span>Turnuva</span>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </div>
              ))}

            {activeTab === "standings_anomalies" &&
              (activeItems.slice(0, visibleCount) as typeof workbench.standingsAnomalies).map((item) => (
                <div
                  key={item.groupKey}
                  className="p-2.5 sm:p-3 rounded-xl bg-amber-950/15 border border-amber-500/35 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-white">{item.groupKey}</div>
                    <div className="flex items-center gap-1.5 text-[10px] font-scoreboard tabular-nums">
                      {item.forfeitMatchCount > 0 && (
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/40 font-bold">
                          {item.forfeitMatchCount} Hükmen (25-0)
                        </span>
                      )}
                      {item.discrepancyTeams.length > 0 && (
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-200 border border-rose-500/40 font-bold">
                          {item.discrepancyTeams.length} Takımda Fark
                        </span>
                      )}
                    </div>
                  </div>
                  {item.discrepancyTeams.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {item.discrepancyTeams.slice(0, 6).map((diff) => (
                        <div
                          key={diff.team}
                          className="px-2 py-1 rounded-lg bg-surface border border-line/60 flex items-center justify-between gap-2"
                        >
                          <span className="text-ink truncate font-medium">{diff.team}</span>
                          <span className="font-scoreboard tabular-nums text-amber-300 shrink-0">
                            TVF: {diff.tvfPlayed}O/{diff.tvfWon}G · Maç: {diff.calcPlayed}O/{diff.calcWon}G
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            {hasMore && (
              <button
                type="button"
                onClick={() => setVisibleLimit((prev) => prev + DEFAULT_PAGE_SIZE)}
                className="w-full py-2 rounded-xl bg-surface-raised hover:bg-surface-muted border border-line text-xs font-semibold text-primary transition-colors cursor-pointer"
              >
                Daha Fazla Göster ({activeItems.length - visibleCount} kayıt daha)
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
