"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { Star, MapPin, CalendarPlus, Copy, Check, Trophy, ExternalLink, AlertTriangle, Navigation, LayoutGrid, List, ChevronRight } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";
import { isMatchPassed } from "@/utils/calendar";
import { generateMatchIcs, generateSeasonIcs, downloadIcsFile } from "@/utils/ics";
import { getHallNavigationUrl } from "@/utils/halls";
import { PrintScheduleButton } from "./PrintScheduleButton";
import { formatGroupName } from "@/utils/grouping";

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

  const formatShortDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") return "TBD";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [, m, d] = parts;
    return `${d}.${m}`;
  };

  const handleCopy = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
    const scoreText = match.status === "finished" ? `\nSkor: ${match.score} (${(match.set_scores || []).join(", ")})` : "";
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
            {subTitle && subTitle.toLowerCase() !== title.toLowerCase() && subTitle !== "Tek Grup" ? ` • ${subTitle.replace(/\b(grup)\s+grubu\b/i, "Grubu")}` : ""}
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
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/60 text-slate-400 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <th className="py-1.5 px-0.5 text-center w-6 sm:w-7" title="Favorilere Ekle">⭐</th>
              <th className="py-1.5 px-1 whitespace-nowrap w-[44px] sm:w-[50px] xl:w-[72px]">Tarih</th>
              <th className="py-1.5 px-1 w-[60px] sm:w-[70px] xl:w-[92px]">Yer</th>
              <th className="py-1.5 px-0.5 text-center w-[36px] sm:w-10">Saat</th>
              <th className="py-1.5 px-1.5 w-auto">A Takımı</th>
              <th className="py-1.5 px-1.5 w-auto">B Takımı</th>
              <th className="py-1.5 px-1 text-center whitespace-nowrap w-[48px] sm:w-[56px] xl:w-[62px]">Skor</th>
              <th className="hidden xl:table-cell py-1.5 px-1 w-[125px]">Setler</th>
              <th className="py-1.5 px-0.5 text-center w-[36px] sm:w-[46px] xl:w-[72px]" title="Volleybox maç kaydı durumu">VB</th>
              <th className="py-1.5 px-0.5 text-center w-7 sm:w-8 no-print">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {matches.map((match, idx) => {
              const isFav = favorites.includes(match.id);
              const isFinished = match.status === "finished";
              const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
              const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
              const formattedDate = formatRowDate(match.date);
              const isCopied = copiedId === match.id;
              const disc = match.volleybox?.discrepancy;
              const hasDiff = Boolean(disc?.has_diff);

              const currentGroup = formatGroupName(match.group);
              const prevGroup = idx > 0 ? formatGroupName(matches[idx - 1]?.group) : null;
              const isFirstOfGroup = hasMultipleGroups && currentGroup !== prevGroup;
              const matchesInGroupCount = hasMultipleGroups
                ? matches.filter((m) => formatGroupName(m.group) === currentGroup).length
                : 0;

              return (
                <React.Fragment key={match.id}>
                  {isFirstOfGroup && (
                    <tr className="bg-[#0b1325]/95 text-amber-300 font-extrabold text-[11px] uppercase tracking-wider border-y border-amber-500/20 select-none">
                      <td colSpan={10} className="py-2 px-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-glow-amber"></span>
                            <span className="text-amber-300 font-black tracking-wide">{currentGroup}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                            {matchesInGroupCount} Maç
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  <tr
                    onClick={() => onSelectMatch?.(match)}
                    className={`transition-colors duration-150 ${
                      onSelectMatch ? "cursor-pointer" : ""
                    } ${
                      hasDiff
                        ? "bg-amber-950/30 border-l-4 border-l-amber-500 hover:bg-amber-950/50"
                        : isFav
                        ? "bg-amber-500/10 border-l-2 border-l-amber-400 hover:bg-amber-500/20"
                        : idx % 2 === 1
                        ? "bg-slate-900/30 hover:bg-slate-800/60"
                        : "bg-transparent hover:bg-slate-800/40"
                    }`}
                  >
                  {/* ⭐ Favori */}
                  <td className="py-1 px-0.5 text-center">
                    <button
                      onClick={() => onToggleFavorite?.(match.id)}
                      className="p-1 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-slate-800/60 transition-all active:scale-90"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                    >
                      <Star
                        size={12}
                        className={isFav ? "fill-amber-400 text-amber-400 drop-shadow-xs" : ""}
                      />
                    </button>
                  </td>

                  {/* 1. Tarih */}
                  <td className="py-1 px-1 font-mono font-medium whitespace-nowrap text-slate-200 text-[10px] sm:text-[10.5px] xl:text-[11px]" title={formattedDate}>
                    <span className={disc?.date_diff ? "text-amber-200 font-bold bg-amber-900/60 px-1 py-0.5 rounded" : ""}>
                      <span className="hidden xl:inline">{formattedDate}</span>
                      <span className="xl:hidden">{formatShortDate(match.date)}</span>
                    </span>
                    {disc?.date_diff && disc.vb_date && (
                      <div
                        className="text-[8px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5 shadow-xs"
                        title={`İl bülteninde tarih değişti! Volleybox'taki eski tarih: ${disc.vb_date}`}
                      >
                        <AlertTriangle size={7} className="text-amber-400 shrink-0" />
                        <span className="hidden xl:inline">VB: {formatRowDate(disc.vb_date)}</span>
                        <span className="xl:hidden">VB: {formatShortDate(disc.vb_date)}</span>
                      </div>
                    )}
                  </td>

                  {/* 2. Yer */}
                  <td className="py-1 px-1 text-slate-300 truncate text-[10.5px] sm:text-[11px]" title={match.hall}>
                    {match.hall && match.hall !== "TBD" ? (
                      <a
                        href={getHallNavigationUrl(match.hall, match.city || effectiveCity)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 group/hall hover:text-white transition-colors cursor-pointer min-w-0"
                        title={`${match.hall} — Haritada Gör & Yol Tarifi Al`}
                      >
                        <MapPin size={9} className={disc?.hall_diff ? "text-amber-400 shrink-0" : "text-red-400 group-hover/hall:scale-110 shrink-0 transition-transform"} />
                        <span className={`truncate font-medium group-hover/hall:underline ${disc?.hall_diff ? "text-amber-200 font-bold bg-amber-900/60 px-1 py-0.5 rounded" : ""}`}>
                          {match.hall}
                        </span>
                      </a>
                    ) : (
                      <div className="flex items-center gap-1 text-slate-500">
                        <MapPin size={9} className="shrink-0" />
                        <span>-</span>
                      </div>
                    )}
                    {disc?.hall_diff && disc.vb_hall && (
                      <div
                        className="text-[8px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5 truncate max-w-full shadow-xs"
                        title={`İl bülteninde salon değişti! Volleybox'taki salon: ${disc.vb_hall}`}
                      >
                        <AlertTriangle size={7} className="text-amber-400 shrink-0" />
                        <span className="truncate">VB: {disc.vb_hall}</span>
                      </div>
                    )}
                  </td>

                  {/* 3. Saat */}
                  <td className="py-1 px-0.5 text-center font-mono font-bold text-slate-200 whitespace-nowrap text-[10.5px] sm:text-[11px]">
                    {match.time === "--:--" ? (
                      <span className="text-slate-500 text-[10px]">-</span>
                    ) : (
                      <span className={disc?.time_diff ? "text-amber-200 bg-amber-900/60 px-1 py-0.5 rounded" : ""}>{match.time}</span>
                    )}
                    {disc?.time_diff && disc.vb_time && (
                      <div
                        className="text-[8px] font-sans font-bold text-amber-300 bg-amber-950/90 border border-amber-700/80 px-1 py-0.5 rounded inline-flex items-center justify-center gap-0.5 mt-0.5 shadow-xs"
                        title={`İl bülteninde saat değişti! Volleybox'taki eski saat: ${disc.vb_time}`}
                      >
                        <AlertTriangle size={7} className="text-amber-400 shrink-0" />
                        <span>VB: {disc.vb_time}</span>
                      </div>
                    )}
                  </td>

                  {/* 4. A Takımı */}
                  <td className="py-1 px-1.5 min-w-0">
                    <TeamVolleyboxLink
                      teamName={match.home_team}
                      category={match.category || match.age_group}
                      city={match.city || city}
                      showFavoriteButton={false}
                      logoClassName="!w-4 !h-4 sm:!w-4.5 sm:!h-4.5 !mr-1.5 shrink-0"
                      className={`text-xs min-w-0 ${
                        homeWon
                          ? "font-black text-white drop-shadow-xs"
                          : isFinished
                          ? "font-normal text-slate-400"
                          : "font-bold text-slate-200 hover:text-white"
                      }`}
                    />
                  </td>

                  {/* 5. B Takımı */}
                  <td className="py-1 px-1.5 min-w-0">
                    <TeamVolleyboxLink
                      teamName={match.away_team}
                      category={match.category || match.age_group}
                      city={match.city || city}
                      showFavoriteButton={false}
                      logoClassName="!w-4 !h-4 sm:!w-4.5 sm:!h-4.5 !mr-1.5 shrink-0"
                      className={`text-xs min-w-0 ${
                        awayWon
                          ? "font-black text-white drop-shadow-xs"
                          : isFinished
                          ? "font-normal text-slate-400"
                          : "font-bold text-slate-200 hover:text-white"
                      }`}
                    />
                  </td>

                  {/* 6. Skor */}
                  <td className="py-1 px-1 text-center whitespace-nowrap">
                    {isFinished ? (
                      <div className="flex flex-col items-center justify-center">
                        <span className="inline-block px-1.5 py-0.5 rounded-md font-mono font-black text-[10px] sm:text-[11px] bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-glow-red tracking-tight">
                          {match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined
                            ? `${match.home_score}-${match.away_score}`
                            : match.score || "-:-"}
                        </span>
                        {match.set_scores && match.set_scores.length > 0 && (
                          <div className="xl:hidden flex items-center gap-0.5 mt-0.5 flex-wrap justify-center max-w-[65px]" title={`Setler: ${match.set_scores.join(", ")}`}>
                            {match.set_scores.map((set, sIdx) => (
                              <span key={sIdx} className="text-[7.5px] font-mono text-slate-400 bg-slate-900/90 px-0.5 rounded border border-slate-800">
                                {set}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : match.date !== "TBD" ? (
                      <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-slate-800 text-slate-400 border border-slate-700/70">
                        vs
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[10px]">-</span>
                    )}
                  </td>

                  {/* 7. Set Skorları (Sadece xl ve üzeri geniş ekranlarda bağımsız sütun, dar ekranlarda skor altında) */}
                  <td className="hidden xl:table-cell py-1 px-1 text-left whitespace-nowrap">
                    {isFinished && match.set_scores && match.set_scores.length > 0 ? (
                      <div className="flex items-center gap-1 flex-nowrap">
                        {match.set_scores.map((set, sIdx) => {
                          const parts = set.split("-").map((n) => parseInt(n.trim(), 10));
                          const isHomeSet = parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[0] > parts[1];
                          return (
                            <span
                              key={sIdx}
                              className={`font-mono text-[9px] sm:text-[9.5px] px-1 py-0.5 rounded border font-bold shadow-2xs ${
                                isHomeSet
                                  ? "bg-red-950/50 text-red-200 border-red-800/60"
                                  : "bg-slate-900/90 text-slate-300 border-slate-700/60"
                              }`}
                            >
                              {set}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[10px] font-mono">-</span>
                    )}
                  </td>


                  {/* 8. Volleybox Senkronizasyon ve Skor Durumu Rozeti */}
                  <td className="py-1 px-0.5 text-center whitespace-nowrap">
                    {match.volleybox?.synced ? (
                      hasDiff ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700 hover:bg-amber-900/80 transition-all shadow-xs"
                          title={`DİKKAT: İl bülteninde değişiklik var! (${disc?.details || "Tarih/Saat/Yer farklı"})`}
                        >
                          <AlertTriangle size={8} className="text-amber-400 shrink-0" />
                          <span className="hidden sm:inline">Değişti</span>
                        </a>
                      ) : match.volleybox.has_score ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8.5px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700 hover:bg-emerald-900/70 transition-all shadow-xs"
                          title={`Volleybox'ta Kayıtlı ve Skoru Girilmiş (${match.volleybox.score})`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                          <span>{match.volleybox.score || "VB"}</span>
                        </a>
                      ) : isMatchPassed(match.volleybox?.vb_date || match.date, match.time, match.status) ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8.5px] font-bold bg-amber-950/60 text-amber-300 border border-amber-700 hover:bg-amber-900/60 transition-all shadow-xs"
                          title="Maç tarihi geçti, Volleybox'a skor bekleniyor"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>
                          <span className="hidden sm:inline">Bekliyor</span>
                        </a>
                      ) : (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[8.5px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all"
                          title="Volleybox'ta Kayıtlı Gelecek Maç"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0"></span>
                          <span className="hidden sm:inline">Kayıtlı</span>
                        </a>
                      )
                    ) : (
                      <span
                        className="text-[10px] text-slate-600 font-mono"
                        title="Bu maç henüz Volleybox veritabanına girilmemiş"
                      >
                        -
                      </span>
                    )}
                  </td>


                  {/* 9. İşlemler */}
                  <td className="py-1 px-0.5 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-0.5">
                        {!isFinished && match.date !== "TBD" && (
                          <button
                            onClick={(e) => handleDownloadIcs(e, match)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-primary transition-colors"
                            title="Takvime Ekle (.ics)"
                          >
                            <CalendarPlus size={11} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCopy(e, match)}
                          className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-white transition-colors"
                          title="Maç Detayını Kopyala"
                        >
                          {isCopied ? (
                            <Check size={11} className="text-emerald-400" />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                        {onSelectMatch && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectMatch(match);
                            }}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                            title="Maç Merkezi & Setler"
                            aria-label="Maç Detayı"
                          >
                            <ChevronRight size={12} />
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
          {matches.map((match, idx) => {
            const isFav = favorites.includes(match.id);
            const isFinished = match.status === "finished";
            const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
            const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
            const formattedDate = formatRowDate(match.date);
            const isCopied = copiedId === match.id;
            const disc = match.volleybox?.discrepancy;
            const hasDiff = Boolean(disc?.has_diff);

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
                      <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-red-600/20 text-red-300 border border-red-500/30">
                        Bitti
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
                      className="p-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 transition-colors"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-700 shadow-xs"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>VB: {match.volleybox.score || "Kayıtlı"}</span>
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
    </div>
  );
};
