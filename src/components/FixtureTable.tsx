"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { Star, MapPin, CalendarPlus, Copy, Check, Trophy, ExternalLink, AlertTriangle, Navigation, LayoutGrid, List, ChevronRight, ChevronDown } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";
import { isMatchPassed, isMatchOverdueForScore } from "@/utils/calendar";
import { generateMatchIcs, generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { getHallNavigationUrl } from "@/utils/halls";
import { PrintScheduleButton } from "./PrintScheduleButton";
import { formatGroupName } from "@/utils/grouping";
import { getMatchForfeitInfo } from "@/utils/forfeit";

interface FixtureTableProps {
  title: string;
  subTitle?: string;
  matches: Match[];
  favorites?: string[];
  onToggleFavorite?: (id: string) => void;
  city?: string;
  showCityBadge?: boolean;
  onSelectMatch?: (match: Match) => void;
}

const PAGE_SIZE = 50;

export const FixtureTable: React.FC<FixtureTableProps> = ({
  title,
  subTitle,
  matches,
  favorites = [],
  onToggleFavorite,
  city = "İstanbul",
  showCityBadge = false,
  onSelectMatch,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  React.useEffect(() => {
    setVisibleLimit(PAGE_SIZE);
  }, [matches]);

  React.useEffect(() => {
    const handleBeforePrint = () => setVisibleLimit(matches.length);
    window.addEventListener("beforeprint", handleBeforePrint);
    return () => window.removeEventListener("beforeprint", handleBeforePrint);
  }, [matches.length]);

  const visibleMatches = matches.length > PAGE_SIZE ? matches.slice(0, visibleLimit) : matches;
  const remainingCount = matches.length - visibleMatches.length;

  const effectiveCity = city && city !== "Tüm İller" ? city : matches[0]?.city;

  // Çoklu grup ayrımı kontrolü (A Grubu, B Grubu vb.)
  const distinctGroups = React.useMemo(() => {
    return Array.from(new Set(matches.map((m) => formatGroupName(m.group)).filter(Boolean)));
  }, [matches]);
  const hasMultipleGroups = distinctGroups.length > 1;

  const formatRowDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") return "Açıklanacak";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  };

  const handleCopy = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const forfeit = getMatchForfeitInfo(match);
    const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
    const forfeitSuffix = forfeit.isForfeit ? " [Hükmen]" : "";
    const scoreText = match.status === "finished" ? `\nSkor: ${match.score} (${(match.set_scores || []).join(", ")})${forfeitSuffix}` : "";
    const cityName = match.city || effectiveCity || city;
    const text = `TVF ${cityName} ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n🗓 ${dateText}\n📍 ${match.hall}${scoreText}\nMaç No: #${match.match_no}`;
    navigator.clipboard.writeText(text);
    setCopiedId(match.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadIcs = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    if (!match.date || match.date === "TBD") {
      alert("Bu maçın tarihi henüz TVF tarafından açıklanmadığı için takvime eklenemez.");
      return;
    }
    const ics = generateMatchIcs(match);
    if (ics) {
      downloadIcsFile(`mac-${match.home_team}-${match.away_team}-${match.date}.ics`, ics);
    }
  };

  const handleDownloadFavoritesIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const favMatches = matches.filter((m) => favorites.includes(m.id) && m.date && m.date !== "TBD");
    if (favMatches.length === 0) {
      alert("Takvime eklenebilecek favori maç bulunamadı.");
      return;
    }
    const ics = generateSeasonIcs(favMatches, "Favori Maçlarım Takvimi");
    downloadIcsFile("favori-maclarim.ics", ics);
  };

  return (
    <div className="glass-panel rounded-2xl shadow-card border-slate-800/80 overflow-hidden mb-4 transition-all duration-200">
      {/* 1. Grup Başlığı */}
      <div className="bg-gradient-to-r from-slate-900/90 via-[#0d1424]/90 to-slate-900/90 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-xs">
            <Trophy size={12} className="text-amber-400" />
          </div>
          <h3 className="font-extrabold text-xs tracking-tight text-white uppercase flex items-center gap-1.5">
            {/* Şehir Başlığı: Tüm İller seçildiğinde görseldeki yere hangi il olduğu yazılır */}
            {showCityBadge && effectiveCity && !title.toLowerCase().startsWith(effectiveCity.toLowerCase()) && (
              <span className="text-sky-400 font-black tracking-wide">
                {effectiveCity.toUpperCase()} •
              </span>
            )}
            <LeagueVolleyboxLink league={title} city={effectiveCity}>
              {title}
            </LeagueVolleyboxLink>
            {subTitle && subTitle.toLowerCase() !== title.toLowerCase() && subTitle !== "Tek Grup" ? ` • ${subTitle}` : ""}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Görünüm Seçici (Liste vs Yayın Kartı) */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 shadow-xs">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Liste Görünümü"
              aria-label="Liste Görünümü"
            >
              <List size={13} />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-red-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Yayın Kartı (Grid) Görünümü"
              aria-label="Yayın Kartı Görünümü"
            >
              <LayoutGrid size={13} />
            </button>
          </div>

          {matches.some((m) => favorites.includes(m.id) && m.date && m.date !== "TBD") && (
            <button
              onClick={handleDownloadFavoritesIcs}
              className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40 hover:bg-amber-500/25 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-xs active:scale-95"
              title="Bu tablodaki favori maçlarınızı .ics olarak takvime ekleyin"
            >
              <CalendarPlus size={11} />
              <span className="hidden sm:inline">Favorileri Takvime Ekle</span>
            </button>
          )}
          <PrintScheduleButton />
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-800">
            {matches.length} Maç
          </span>
        </div>
      </div>

      {/* 2. Resmi TVF / Fikstür Tablosu: Tarih - Yer - Saat - A Takımı - B Takımı - Skor - Set Skorları - Volleybox - İşlem */}
      {viewMode === "table" ? (
        <div className="overflow-x-auto p-2 sm:p-3 bg-slate-950/40">
          <table className="w-full text-left border-separate border-spacing-y-2 text-xs">
          <thead>
            <tr className="text-slate-400 font-bold uppercase text-[10px] tracking-wider select-none">
              <th className="pb-1 px-2 text-center w-8" title="Favorilere Ekle">⭐</th>
              <th className="pb-1 px-2 w-[85px] whitespace-nowrap">Tarih</th>
              <th className="pb-1 px-2 text-center w-14 whitespace-nowrap">Saat</th>
              <th className="pb-1 px-2 min-w-[80px] max-w-[125px] lg:max-w-[150px]">Yer</th>
              <th className="pb-1 px-2 min-w-[140px] max-w-[220px] lg:max-w-[270px] text-right">A Takımı (Ev Sahibi)</th>
              <th className="pb-1 px-1 text-center w-16 whitespace-nowrap">VS / Skor</th>
              <th className="pb-1 px-2 min-w-[140px] max-w-[220px] lg:max-w-[270px] text-left">B Takımı (Deplasman)</th>
              <th className="pb-1 px-2 min-w-[110px] max-w-[145px]">Set Skorları</th>
              <th className="pb-1 px-2 text-center min-w-[80px]" title="Volleybox maç kaydı durumu">Volleybox</th>
              <th className="pb-1 px-2 text-center w-14 no-print">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {visibleMatches.map((match, idx) => {
              const isFav = favorites.includes(match.id);
              const isFinished = match.status === "finished";
              const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
              const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
              const formattedDate = formatRowDate(match.date);
              const isCopied = copiedId === match.id;
              const disc = match.volleybox?.discrepancy;
              const hasDiff = Boolean(disc?.has_diff);
              const forfeitInfo = getMatchForfeitInfo(match);

              const currentGroup = formatGroupName(match.group);
              const prevGroup = idx > 0 ? formatGroupName(matches[idx - 1]?.group) : null;
              const isFirstOfGroup = hasMultipleGroups && currentGroup !== prevGroup;
              const matchesInGroupCount = hasMultipleGroups
                ? matches.filter((m) => formatGroupName(m.group) === currentGroup).length
                : 0;

              const cardBorderClass = hasDiff
                ? "border-amber-500/60 bg-amber-950/25 group-hover:bg-amber-950/45 group-hover:border-amber-500/80"
                : isFav
                ? "border-amber-500/40 bg-amber-500/10 group-hover:bg-amber-500/20 group-hover:border-amber-400/60"
                : "border-slate-800/80 bg-slate-900/65 group-hover:bg-slate-850/90 group-hover:border-slate-700/80";

              return (
                <React.Fragment key={match.id}>
                  {isFirstOfGroup && (
                    <tr className="select-none">
                      <td colSpan={10} className="py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#0b1325]/90 to-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-glow-amber"></span>
                            <span className="text-amber-300 font-black tracking-wide">{currentGroup}</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-200/80 font-bold bg-slate-950/80 px-2.5 py-0.5 rounded-md border border-amber-500/30">
                            {matchesInGroupCount} Maç
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => onSelectMatch?.(match)}
                    className={`group transition-all duration-200 ${
                      onSelectMatch ? "cursor-pointer" : ""
                    } hover:shadow-card hover:-translate-y-0.5`}
                  >
                  {/* ⭐ Favori */}
                  <td className={`py-2.5 px-2 text-center w-8 rounded-l-xl border-l border-y ${cardBorderClass} ${hasDiff ? "border-l-4 border-l-amber-500" : isFav ? "border-l-3 border-l-amber-400" : ""}`}>
                    <button
                      onClick={() => onToggleFavorite?.(match.id)}
                      className="p-1 min-w-[28px] min-h-[28px] inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-all active:scale-90"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                      aria-label={isFav ? `${match.home_team} - ${match.away_team} maçını favorilerden çıkar` : `${match.home_team} - ${match.away_team} maçını favorilere ekle`}
                    >
                      <Star
                        size={13}
                        className={isFav ? "fill-amber-400 text-amber-400 drop-shadow-xs" : ""}
                      />
                    </button>
                  </td>

                  {/* 1. Tarih */}
                  <td className={`py-2.5 px-2 whitespace-nowrap w-[85px] border-y ${cardBorderClass}`}>
                    <div className="inline-flex flex-col">
                      <span className={`inline-flex items-center font-mono font-bold text-[11px] px-2 py-0.5 rounded-md whitespace-nowrap shadow-xs ${
                        disc?.date_diff
                          ? "bg-amber-900/70 text-amber-200 border border-amber-600/80 font-black"
                          : "bg-slate-800/80 text-slate-200 border border-slate-700/60"
                      }`}>
                        {formattedDate}
                      </span>
                      {disc?.date_diff && disc.vb_date && (
                        <div
                          className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 mt-1 shadow-xs"
                          title={`İl bülteninde tarih değişti! Volleybox'taki eski tarih: ${disc.vb_date}`}
                        >
                          <AlertTriangle size={8} className="text-amber-400 shrink-0" />
                          <span>VB: {formatRowDate(disc.vb_date)}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 2. Saat */}
                  <td className={`py-2.5 px-2 text-center whitespace-nowrap w-14 border-y ${cardBorderClass}`}>
                    <div className="inline-flex flex-col items-center justify-center">
                      {match.time === "--:--" ? (
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono text-[10px] text-slate-500 bg-slate-800/50 border border-slate-700/40">-</span>
                      ) : (
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md font-mono font-black text-[11px] shadow-xs tracking-wide ${
                          disc?.time_diff
                            ? "bg-amber-900/70 text-amber-200 border border-amber-600/80"
                            : "bg-sky-500/15 text-sky-300 border border-sky-500/30"
                        }`}>
                          {match.time}
                        </span>
                      )}
                      {disc?.time_diff && disc.vb_time && (
                        <div
                          className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center justify-center gap-0.5 mt-1 shadow-xs"
                          title={`İl bülteninde saat değişti! Volleybox'taki eski saat: ${disc.vb_time}`}
                        >
                          <AlertTriangle size={8} className="text-amber-400 shrink-0" />
                          <span>VB: {disc.vb_time}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* 3. Yer */}
                  <td className={`py-2.5 px-2 whitespace-nowrap border-y ${cardBorderClass}`} title={match.hall}>
                    {match.hall && match.hall !== "TBD" ? (
                      <a
                        href={getHallNavigationUrl(match.hall, match.city || effectiveCity)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-800/40 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-all max-w-[95px] lg:max-w-[150px] truncate group/hall shadow-2xs"
                        title={`${match.hall} — Haritada Gör & Yol Tarifi Al`}
                      >
                        <MapPin size={11} className={disc?.hall_diff ? "text-amber-400 shrink-0" : "text-rose-400 group-hover/hall:scale-110 shrink-0 transition-transform"} />
                        <span className={`truncate text-[11px] font-medium ${disc?.hall_diff ? "text-amber-200 font-bold" : ""}`}>
                          {match.hall}
                        </span>
                      </a>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono px-2">-</span>
                    )}
                    {disc?.hall_diff && disc.vb_hall && (
                      <div
                        className="text-[9px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1.5 py-0.5 rounded-md inline-flex items-center gap-0.5 mt-1 truncate max-w-[110px] shadow-xs"
                        title={`İl bülteninde salon değişti! Volleybox'taki salon: ${disc.vb_hall}`}
                      >
                        <AlertTriangle size={8} className="text-amber-400 shrink-0" />
                        <span className="truncate">VB: {disc.vb_hall}</span>
                      </div>
                    )}
                  </td>

                  {/* 4. A Takımı (Ev Sahibi) */}
                  <td className={`py-2.5 px-2 whitespace-nowrap text-right border-y ${cardBorderClass}`}>
                    <div className="flex items-center justify-end gap-2 text-right">
                      <TeamVolleyboxLink
                        teamName={match.home_team}
                        category={match.category || match.age_group}
                        city={match.city || city}
                        className={`text-xs ${
                          homeWon
                            ? "font-black text-white drop-shadow-xs"
                            : isFinished
                            ? "font-normal text-slate-400"
                            : "font-bold text-slate-100 group-hover:text-white transition-colors"
                        }`}
                      />
                    </div>
                  </td>

                  {/* 5. VS / Skor (Merkez Ayracı) */}
                  <td className={`py-2.5 px-1 text-center whitespace-nowrap w-16 border-y ${cardBorderClass}`}>
                    <div className="flex items-center justify-center">
                      {isFinished ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-lg font-mono font-black text-xs bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red tracking-wider">
                            {match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined
                              ? `${match.home_score} - ${match.away_score}`
                              : match.score || "- : -"}
                          </span>
                          {forfeitInfo.isForfeit && (
                            <span
                              className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/90 border border-amber-600/70 px-1.5 py-0.2 rounded mt-0.5 shadow-xs"
                              title={forfeitInfo.reason || "TVF kuralı gereği hükmen galibiyet"}
                            >
                              Hükmen
                            </span>
                          )}
                        </div>
                      ) : (
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full font-black text-[10px] tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30 shadow-xs group-hover:scale-105 group-hover:bg-rose-500/25 transition-all select-none"
                          title="Karşılaşma"
                        >
                          VS
                        </span>
                      )}
                    </div>
                  </td>

                  {/* 6. B Takımı (Deplasman) */}
                  <td className={`py-2.5 px-2 whitespace-nowrap text-left border-y ${cardBorderClass}`}>
                    <div className="flex items-center justify-start gap-2 text-left">
                      <TeamVolleyboxLink
                        teamName={match.away_team}
                        category={match.category || match.age_group}
                        city={match.city || city}
                        className={`text-xs ${
                          awayWon
                            ? "font-black text-white drop-shadow-xs"
                            : isFinished
                            ? "font-normal text-slate-400"
                            : "font-bold text-slate-100 group-hover:text-white transition-colors"
                        }`}
                      />
                    </div>
                  </td>

                  {/* 7. Set Skorları */}
                  <td className={`py-2.5 px-2 text-left whitespace-nowrap border-y ${cardBorderClass}`}>
                    {isFinished && match.set_scores && match.set_scores.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-nowrap">
                        {match.set_scores.map((set, sIdx) => {
                          const parts = set.split("-").map((n) => parseInt(n.trim(), 10));
                          const isHomeSet = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > parts[1];
                          return (
                            <span
                              key={sIdx}
                              className={`font-mono text-[10px] px-1.5 py-0.5 rounded-md border font-bold shadow-2xs ${
                                isHomeSet
                                  ? "bg-rose-950/50 text-rose-200 border-rose-800/60"
                                  : "bg-slate-900/90 text-slate-300 border-slate-700/60"
                              }`}
                            >
                              {set}
                            </span>
                          );
                        })}
                        {forfeitInfo.isForfeit && (
                          <span
                            className="inline-flex items-center gap-0.5 text-[10px] font-black px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-2xs"
                            title={forfeitInfo.reason || "TVF kuralı gereği hükmen tescil edilmiştir"}
                          >
                            <span>(Hükmen)</span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px] font-mono">-</span>
                    )}
                  </td>

                  {/* 8. Volleybox Senkronizasyon ve Skor Durumu Rozeti */}
                  <td className={`py-2.5 px-2 text-center whitespace-nowrap border-y ${cardBorderClass}`}>
                    {match.volleybox?.synced ? (
                      hasDiff ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 hover:bg-amber-900/80 hover:border-amber-600 transition-all shadow-sm group/vb"
                          title={`DİKKAT: İl bülteninde değişiklik var! (${disc?.details || "Tarih/Saat/Yer farklı"}) - Volleybox'ta güncellemek için tıklayın`}
                        >
                          <AlertTriangle size={10} className="text-amber-400 shrink-0 animate-bounce" />
                          <span>VB: Değişti</span>
                          <ExternalLink size={9} className="text-amber-500 group-hover/vb:translate-x-0.5 transition-transform" />
                        </a>
                      ) : match.volleybox.has_score ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/70 hover:border-emerald-600 transition-all shadow-sm group/vb"
                          title={`Volleybox'ta Kayıtlı ve Skoru Girilmiş (Maç ID: #${match.volleybox.match_id} | Skor: ${match.volleybox.score}) - Tıklayarak profili açın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>VB: {match.volleybox.score || "Skorlu"}</span>
                          <ExternalLink size={9} className="text-emerald-400 group-hover/vb:translate-x-0.5 transition-transform" />
                        </a>
                      ) : isMatchOverdueForScore(match.volleybox?.vb_date || match.date) ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-700 hover:bg-amber-900/60 hover:border-amber-600 transition-all shadow-sm group/vb"
                          title={`Maç tarihi geçmesine rağmen Volleybox'a skor henüz girilmemiş! (Maç ID: #${match.volleybox.match_id}) - Skoru girmek için tıklayın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                          <span>VB: Skorsuz</span>
                          <ExternalLink size={9} className="text-amber-400 group-hover/vb:translate-x-0.5 transition-transform" />
                        </a>
                      ) : (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all group/vb shadow-2xs"
                          title={`Volleybox'ta Kayıtlı Gelecek Maç (Maç ID: #${match.volleybox.match_id}) - Maç sayfasını açmak için tıklayın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span>VB: Kayıtlı</span>
                          <ExternalLink size={9} className="text-slate-500 group-hover/vb:translate-x-0.5 transition-transform" />
                        </a>
                      )
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] text-slate-500 bg-slate-900/50 border border-slate-700/50 font-medium"
                        title="Bu maç henüz Volleybox veritabanına girilmemiş"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                        <span>Girilmedi</span>
                      </span>
                    )}
                  </td>

                  {/* 9. İşlemler */}
                  <td className={`py-2.5 px-2 text-center whitespace-nowrap no-print rounded-r-xl border-r border-y ${cardBorderClass}`}>
                      <div className="flex items-center justify-center gap-0.5">
                        {!isFinished && match.date !== "TBD" && (
                          <button
                            onClick={(e) => handleDownloadIcs(e, match)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors cursor-pointer"
                            title="Takvime Ekle (.ics)"
                          >
                            <CalendarPlus size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCopy(e, match)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors cursor-pointer"
                          title="Maç Detayını Kopyala"
                        >
                          {isCopied ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                        {onSelectMatch && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMatch(match);
                            }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Maç Merkezi & Setler"
                            aria-label="Maç Detayı"
                          >
                            <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : (
        /* 3. Yayın Tarzı Grid Kart Görünümü (Broadcast Cards) */
        <div className="p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950/40">
          {visibleMatches.map((match, idx) => {
            const isFav = favorites.includes(match.id);
            const isFinished = match.status === "finished";
            const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
            const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
            const formattedDate = formatRowDate(match.date);
            const isCopied = copiedId === match.id;
            const disc = match.volleybox?.discrepancy;
            const hasDiff = Boolean(disc?.has_diff);
            const forfeitInfo = getMatchForfeitInfo(match);

            const currentGroup = formatGroupName(match.group);
            const prevGroup = idx > 0 ? formatGroupName(matches[idx - 1]?.group) : null;
            const isFirstOfGroup = hasMultipleGroups && currentGroup !== prevGroup;
            const matchesInGroupCount = hasMultipleGroups
              ? matches.filter((m) => formatGroupName(m.group) === currentGroup).length
              : 0;

            return (
              <React.Fragment key={match.id}>
                {isFirstOfGroup && (
                  <div className="col-span-full flex items-center justify-between py-2 px-3.5 bg-[#0b1325]/95 rounded-xl border border-amber-500/25 text-amber-300 text-xs font-bold uppercase mt-2 mb-0.5 shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-glow-amber"></span>
                      <span className="font-black text-amber-300 tracking-wide">{currentGroup}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      {matchesInGroupCount} Maç
                    </span>
                  </div>
                )}
                <div
                key={match.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  hasDiff
                    ? "bg-gradient-to-b from-amber-950/30 via-slate-900/90 to-slate-950 border-amber-600/50 shadow-md shadow-amber-950/20"
                    : isFav
                    ? "bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 border-amber-400/50 shadow-md shadow-amber-500/10"
                    : "bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/90 border-slate-800/80 hover:border-slate-700/80 shadow-card hover:shadow-lg"
                }`}
              >
                {/* Kart Üst Bilgi Çubuğu */}
                <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/70 flex items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-slate-200">
                      {formattedDate}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono font-semibold text-slate-300">
                      {match.time === "--:--" ? "Saat Belirtilmedi" : match.time}
                    </span>
                    {isFinished && (
                      <span className={`ml-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                        forfeitInfo.isForfeit
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-red-600/20 text-red-300 border border-red-500/30"
                      }`}>
                        {forfeitInfo.isForfeit ? "Hükmen" : "Bitti"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isFinished && match.date !== "TBD" && (
                      <button
                        onClick={(e) => handleDownloadIcs(e, match)}
                        className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                        title="Takvime Ekle (.ics)"
                      >
                        <CalendarPlus size={13} />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleCopy(e, match)}
                      className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                      title="Maç Detayını Kopyala"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                    </button>
                    <button
                      onClick={() => onToggleFavorite?.(match.id)}
                      className="p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                      aria-label={isFav ? `${match.home_team} - ${match.away_team} maçını favorilerden çıkar` : `${match.home_team} - ${match.away_team} maçını favorilere ekle`}
                    >
                      <Star size={13} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                    </button>
                  </div>
                </div>

                {/* Kart Gövdesi: Takımlar & Skorlar */}
                <div className="p-3.5 space-y-2.5">
                  {/* Ev Sahibi Takım */}
                  <div
                    className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-colors ${
                      homeWon ? "bg-red-500/10 border border-red-500/25 shadow-xs" : "bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <TeamVolleyboxLink
                        teamName={match.home_team}
                        category={match.category || match.age_group}
                        city={match.city || effectiveCity}
                        logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 object-contain drop-shadow-md bg-transparent shrink-0"
                        className={`text-xs sm:text-sm truncate transition-colors ${
                          homeWon
                            ? "font-black text-white"
                            : isFinished
                            ? "font-medium text-slate-400"
                            : "font-bold text-slate-200 hover:text-white"
                        }`}
                      />
                    </div>
                    <div className="shrink-0 font-mono text-sm font-black">
                      {isFinished ? (
                        <span
                          className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-black ${
                            homeWon
                              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red"
                              : "bg-slate-800 text-slate-400 border border-slate-700/60"
                          }`}
                        >
                          {match.home_score ?? 0}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </div>
                  </div>

                  {/* Deplasman Takımı */}
                  <div
                    className={`flex items-center justify-between gap-2.5 p-2 rounded-xl transition-colors ${
                      awayWon ? "bg-red-500/10 border border-red-500/25 shadow-xs" : "bg-slate-900/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <TeamVolleyboxLink
                        teamName={match.away_team}
                        category={match.category || match.age_group}
                        city={match.city || effectiveCity}
                        logoClassName="!w-9 !h-9 sm:!w-10 sm:!h-10 object-contain drop-shadow-md bg-transparent shrink-0"
                        className={`text-xs sm:text-sm truncate transition-colors ${
                          awayWon
                            ? "font-black text-white"
                            : isFinished
                            ? "font-medium text-slate-400"
                            : "font-bold text-slate-200 hover:text-white"
                        }`}
                      />
                    </div>
                    <div className="shrink-0 font-mono text-sm font-black">
                      {isFinished ? (
                        <span
                          className={`inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-lg text-xs font-black ${
                            awayWon
                              ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red"
                              : "bg-slate-800 text-slate-400 border border-slate-700/60"
                          }`}
                        >
                          {match.away_score ?? 0}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">-</span>
                      )}
                    </div>
                  </div>

                  {/* Set Skorları */}
                  {isFinished && match.set_scores && match.set_scores.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Setler:</span>
                      {match.set_scores.map((set, sIdx) => {
                        const parts = set.split("-").map((n) => parseInt(n.trim(), 10));
                        const isHomeSet = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > parts[1];
                        return (
                          <span
                            key={sIdx}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shadow-xs ${
                              isHomeSet
                                ? "bg-red-950/40 text-red-200 border-red-800/50"
                                : "bg-slate-900/90 text-slate-300 border-slate-700/60"
                            }`}
                          >
                            {set}
                          </span>
                        );
                      })}
                      {forfeitInfo.isForfeit && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          (Hükmen)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Kart Alt Bilgi: Salon & Volleybox */}
                <div className="px-3.5 py-2 bg-slate-950/70 border-t border-slate-800/70 flex items-center justify-between gap-2 text-[11px]">
                  {match.hall && match.hall !== "TBD" ? (
                    <a
                      href={getHallNavigationUrl(match.hall, match.city || effectiveCity)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 min-w-0 truncate text-slate-300 hover:text-white group/hall transition-colors cursor-pointer"
                      title={`${match.hall} — Haritada Gör & Yol Tarifi Al`}
                    >
                      <MapPin size={11} className="text-red-400 group-hover/hall:scale-110 shrink-0 transition-transform" />
                      <span className="truncate underline decoration-slate-600 group-hover/hall:decoration-red-400 font-medium text-[11px]">
                        {match.hall}
                      </span>
                    </a>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Salon Belirtilmedi</span>
                  )}

                  {match.volleybox?.synced ? (
                    hasDiff ? (
                      <a
                        href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 shadow-xs"
                      >
                        <AlertTriangle size={9} className="text-amber-400" />
                        <span>VB Değişti</span>
                      </a>
                    ) : (
                      <a
                        href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold shadow-xs border ${
                          match.volleybox.has_score
                            ? "bg-emerald-950/70 text-emerald-300 border-emerald-700"
                            : isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                            ? "bg-amber-950/80 text-amber-300 border-amber-700"
                            : "bg-slate-800/80 text-slate-300 border-slate-700"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            match.volleybox.has_score
                              ? "bg-emerald-400 animate-pulse"
                              : isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                              ? "bg-amber-400 animate-ping"
                              : "bg-blue-400"
                          }`}
                        ></span>
                        <span>
                          VB:{" "}
                          {match.volleybox.score ||
                            (isMatchOverdueForScore(match.volleybox?.vb_date || match.date)
                              ? "Skorsuz"
                              : "Kayıtlı")}
                        </span>
                      </a>
                    )
                  ) : (
                    <span className="text-[9px] text-slate-500">VB: Girilmedi</span>
                  )}
                </div>

                {onSelectMatch && (
                  <button
                    onClick={() => onSelectMatch(match)}
                    className="w-full py-2 px-3 rounded-b-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold border-t border-slate-800/80 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Maç Merkezi & Setler</span>
                    <ChevronRight size={13} className="text-red-400" />
                  </button>
                )}
              </div>
            </React.Fragment>
          );
        })}
        </div>
      )}

      {/* 4. Sayfalama / Daha Fazla Göster (DOM yükünü hafifletir) */}
      {remainingCount > 0 && (
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
            onClick={() => setVisibleLimit(matches.length)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Tümünü Göster ({matches.length})
          </button>
        </div>
      )}
    </div>
  );
};
