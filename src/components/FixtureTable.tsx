"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { Star, MapPin, CalendarPlus, Copy, Check, Trophy, ExternalLink, AlertTriangle } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";
import { isMatchPassed } from "@/utils/calendar";

interface FixtureTableProps {
  title: string;
  subTitle?: string;
  matches: Match[];
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  city?: string;
  splitScreenMode?: boolean;
}

export const FixtureTable: React.FC<FixtureTableProps> = ({
  title,
  subTitle,
  matches,
  favorites,
  onToggleFavorite,
  city,
  splitScreenMode = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatRowDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") return "Açıklanacak";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  };

  const handleCopy = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
    const scoreText = match.status === "finished" ? `\nSkor: ${match.score} (${(match.set_scores || []).join(", ")})` : "";
    const text = `TVF İstanbul ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n🗓 ${dateText}\n📍 ${match.hall}${scoreText}\nMaç No: #${match.match_no}`;
    navigator.clipboard.writeText(text);
    setCopiedId(match.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadIcs = (e: React.MouseEvent, match: Match) => {
    e.stopPropagation();
    if (!match.date || match.date === "TBD" || !match.time || match.time === "--:--") {
      alert("Bu maçın tarihi ve saati henüz TVF tarafından açıklanmadığı için takvime eklenemez.");
      return;
    }
    const startIso = match.date.replace(/-/g, "") + "T" + match.time.replace(":", "") + "00";
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${match.home_team} vs ${match.away_team}`,
      `DESCRIPTION:${match.category} - ${match.group}\\nSalon: ${match.hall}`,
      `LOCATION:${match.hall}`,
      `DTSTART:${startIso}`,
      `DTEND:${startIso}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${match.home_team}_vs_${match.away_team}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-2xs border border-slate-200/90 overflow-hidden mb-3.5">
      {/* 1. Grup Başlığı */}
      <div className="bg-[#111827] text-white px-3.5 py-1.5 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center text-primary">
            <Trophy size={11} className="text-amber-400" />
          </div>
          <h3 className="font-bold text-xs tracking-tight text-white uppercase">
            <LeagueVolleyboxLink league={title} city={city || matches[0]?.city}>
              {title}
            </LeagueVolleyboxLink>
            {subTitle && subTitle.toLowerCase() !== title.toLowerCase() && subTitle !== "Tek Grup" ? ` • ${subTitle}` : ""}
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
          {matches.length} Maç
        </span>
      </div>

      {/* 2. Resmi TVF / Fikstür Tablosu: Tarih - Yer - Saat - A Takımı - B Takımı - Skor - Set Skorları - Volleybox - İşlem */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <th className="py-1.5 px-1 text-center w-6" title="Favorilere Ekle">⭐</th>
              <th className="py-1.5 px-1.5 w-[76px] whitespace-nowrap">Tarih</th>
              <th className="py-1.5 px-1.5 min-w-[70px] max-w-[95px] lg:max-w-[130px]">Yer</th>
              <th className="py-1.5 px-1 text-center w-11">Saat</th>
              <th className="py-1.5 px-1.5 min-w-[90px] max-w-[125px] lg:max-w-[155px]">A Takımı</th>
              <th className="py-1.5 px-1.5 min-w-[90px] max-w-[125px] lg:max-w-[155px]">B Takımı</th>
              <th className="py-1.5 px-1 text-center w-14 whitespace-nowrap">Skor</th>
              <th className={`py-1.5 px-1.5 min-w-[110px] max-w-[145px] ${splitScreenMode ? "hidden" : ""}`}>Set Skorları</th>
              <th className="py-1.5 px-1 text-center min-w-[75px]" title="Volleybox maç kaydı durumu">Volleybox</th>
              {!splitScreenMode && (
                <th className="py-1.5 px-1 text-center w-10 no-print">İşlem</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matches.map((match, idx) => {
              const isFav = favorites.includes(match.id);
              const isFinished = match.status === "finished";
              const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
              const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
              const formattedDate = formatRowDate(match.date);
              const isCopied = copiedId === match.id;
              const disc = match.volleybox?.discrepancy;
              const hasDiff = Boolean(disc?.has_diff);

              return (
                <tr
                  key={match.id}
                  className={`transition-colors ${
                    hasDiff
                      ? "bg-amber-50/75 border-l-4 border-l-amber-500 hover:bg-amber-100/70"
                      : isFav
                      ? "bg-amber-50/50 hover:bg-amber-50/80"
                      : idx % 2 === 1
                      ? "bg-slate-50/40 hover:bg-slate-100/60"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* ⭐ Favori */}
                  <td className="py-1.5 px-1 text-center w-6">
                    <button
                      onClick={() => onToggleFavorite(match.id)}
                      className="p-0.5 rounded text-slate-300 hover:text-amber-400 transition-colors"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                    >
                      <Star
                        size={13}
                        className={isFav ? "fill-amber-400 text-amber-400" : ""}
                      />
                    </button>
                  </td>

                  {/* 1. Tarih */}
                  <td className="py-1.5 px-1.5 font-mono font-medium whitespace-nowrap text-slate-800 text-[11px] w-[76px]">
                    <span className={disc?.date_diff ? "text-amber-950 font-bold bg-amber-200/70 px-1 rounded" : ""}>
                      {formattedDate}
                    </span>
                    {disc?.date_diff && disc.vb_date && (
                      <div
                        className="text-[9px] font-sans font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5"
                        title={`İl bülteninde tarih değişti! Volleybox'taki eski tarih: ${disc.vb_date}`}
                      >
                        <AlertTriangle size={8} className="text-amber-600 shrink-0" />
                        <span>VB: {formatRowDate(disc.vb_date)}</span>
                      </div>
                    )}
                  </td>

                  {/* 2. Yer */}
                  <td className="py-1.5 px-1.5 text-slate-600 whitespace-nowrap text-[11px]" title={match.hall}>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} className={disc?.hall_diff ? "text-amber-600 shrink-0" : "text-slate-400 shrink-0"} />
                      <span className={`truncate max-w-[70px] sm:max-w-[95px] lg:max-w-[130px] ${disc?.hall_diff ? "text-amber-950 font-bold bg-amber-200/70 px-1 rounded" : ""}`}>
                        {match.hall}
                      </span>
                    </div>
                    {disc?.hall_diff && disc.vb_hall && (
                      <div
                        className="text-[9px] font-sans font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-1 py-0.5 rounded inline-flex items-center gap-0.5 mt-0.5 truncate max-w-[110px]"
                        title={`İl bülteninde salon değişti! Volleybox'taki salon: ${disc.vb_hall}`}
                      >
                        <AlertTriangle size={8} className="text-amber-600 shrink-0" />
                        <span className="truncate">VB: {disc.vb_hall}</span>
                      </div>
                    )}
                  </td>

                  {/* 3. Saat */}
                  <td className="py-1.5 px-1 text-center font-mono font-bold text-slate-700 whitespace-nowrap text-[11px] w-11">
                    {match.time === "--:--" ? (
                      <span className="text-slate-400 text-[10px]">-</span>
                    ) : (
                      <span className={disc?.time_diff ? "text-amber-950 bg-amber-200/70 px-1 rounded" : ""}>{match.time}</span>
                    )}
                    {disc?.time_diff && disc.vb_time && (
                      <div
                        className="text-[9px] font-sans font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-1 py-0.5 rounded inline-flex items-center justify-center gap-0.5 mt-0.5"
                        title={`İl bülteninde saat değişti! Volleybox'taki eski saat: ${disc.vb_time}`}
                      >
                        <AlertTriangle size={8} className="text-amber-600 shrink-0" />
                        <span>VB: {disc.vb_time}</span>
                      </div>
                    )}
                  </td>

                  {/* 4. A Takımı */}
                  <td className="py-1.5 px-1.5 whitespace-nowrap">
                    <TeamVolleyboxLink
                      teamName={match.home_team}
                      category={match.category || match.age_group}
                      className={`text-xs ${
                        homeWon
                          ? "font-black text-slate-900"
                          : isFinished
                          ? "font-normal text-slate-500"
                          : "font-bold text-slate-800"
                      }`}
                    />
                  </td>

                  {/* 5. B Takımı */}
                  <td className="py-1.5 px-1.5 whitespace-nowrap">
                    <TeamVolleyboxLink
                      teamName={match.away_team}
                      category={match.category || match.age_group}
                      className={`text-xs ${
                        awayWon
                          ? "font-black text-slate-900"
                          : isFinished
                          ? "font-normal text-slate-500"
                          : "font-bold text-slate-800"
                      }`}
                    />
                  </td>

                  {/* 6. Skor */}
                  <td className="py-1.5 px-1 text-center whitespace-nowrap w-14">
                    {isFinished ? (
                      <span className="inline-block px-1.5 py-0.5 rounded font-mono font-black text-[11px] bg-[#0b1325] text-white shadow-2xs">
                        {match.home_score !== null && match.home_score !== undefined && match.away_score !== null && match.away_score !== undefined
                          ? `${match.home_score} - ${match.away_score}`
                          : match.score || "- : -"}
                      </span>
                    ) : match.date !== "TBD" ? (
                      <span className="inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        vs
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">-</span>
                    )}
                  </td>

                  {/* 7. Set Skorları */}
                  <td className={`py-1.5 px-1.5 text-left whitespace-nowrap ${splitScreenMode ? "hidden" : ""}`}>
                    {isFinished && match.set_scores && match.set_scores.length > 0 ? (
                      <div className="flex items-center gap-1 flex-nowrap">
                        {match.set_scores.map((set, sIdx) => (
                          <span
                            key={sIdx}
                            className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200/80 font-medium"
                          >
                            {set}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[11px] font-mono">-</span>
                    )}
                  </td>


                  {/* 8. Volleybox Senkronizasyon ve Skor Durumu Rozeti */}
                  <td className="py-1.5 px-1.5 text-center whitespace-nowrap">
                    {match.volleybox?.synced ? (
                      hasDiff ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-400 hover:bg-amber-200 hover:border-amber-500 transition-all shadow-xs group"
                          title={`DİKKAT: İl bülteninde değişiklik var! (${disc?.details || "Tarih/Saat/Yer farklı"}) - Volleybox'ta güncellemek için tıklayın`}
                        >
                          <AlertTriangle size={10} className="text-amber-700 shrink-0 animate-bounce" />
                          <span>VB: Değişti</span>
                          <ExternalLink size={9} className="text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ) : match.volleybox.has_score ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs group"
                          title={`Volleybox'ta Kayıtlı ve Skoru Girilmiş (Maç ID: #${match.volleybox.match_id} | Skor: ${match.volleybox.score}) - Tıklayarak profili açın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>VB: {match.volleybox.score || "Skorlu"}</span>
                          <ExternalLink size={9} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ) : isMatchPassed(match.date, match.time, match.status) ? (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-2xs group"
                          title={`Maç tarihi geçmesine rağmen Volleybox'a skor henüz girilmemiş! (Maç ID: #${match.volleybox.match_id}) - Skoru girmek için tıklayın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                          <span>VB: Skorsuz</span>
                          <ExternalLink size={9} className="text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      ) : (
                        <a
                          href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all group"
                          title={`Volleybox'ta Kayıtlı Gelecek Maç (Maç ID: #${match.volleybox.match_id}) - Maç sayfasını açmak için tıklayın`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                          <span>VB: Kayıtlı</span>
                          <ExternalLink size={9} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                      )
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] text-slate-400 bg-slate-50 border border-slate-200/60 font-medium"
                        title="Bu maç henüz Volleybox veritabanına girilmemiş"
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>Girilmedi</span>
                      </span>
                    )}
                  </td>


                  {/* 9. İşlemler */}
                  {!splitScreenMode && (
                    <td className="py-1.5 px-1.5 text-center whitespace-nowrap no-print">
                      <div className="flex items-center justify-center gap-0.5">
                        {!isFinished && match.date !== "TBD" && (
                          <button
                            onClick={(e) => handleDownloadIcs(e, match)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-primary transition-colors"
                            title="Takvime Ekle (.ics)"
                          >
                            <CalendarPlus size={12} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCopy(e, match)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                          title="Maç Detayını Kopyala"
                        >
                          {isCopied ? (
                            <Check size={12} className="text-emerald-600" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
