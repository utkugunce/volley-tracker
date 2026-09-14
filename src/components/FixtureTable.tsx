"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { Star, MapPin, CalendarPlus, Copy, Check, Trophy, ExternalLink } from "lucide-react";
import { TeamVolleyboxLink } from "./TeamVolleyboxLink";
import { LeagueVolleyboxLink } from "./LeagueVolleyboxLink";

interface FixtureTableProps {
  title: string;
  subTitle?: string;
  matches: Match[];
  favorites: string[];
  onToggleFavorite: (matchId: string) => void;
  city?: string;
}

export const FixtureTable: React.FC<FixtureTableProps> = ({
  title,
  subTitle,
  matches,
  favorites,
  onToggleFavorite,
  city,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatRowDate = (dateStr: string) => {
    if (!dateStr || dateStr === "TBD") return { date: "Açıklanacak", day: "" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { date: dateStr, day: "" };
    const [y, m, d] = parts;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    const day = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString("tr-TR", { weekday: "short" })
      : "";
    return { date: `${d}.${m}.${y}`, day };
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
      `SUMMARY:${match.category}: ${match.home_team} vs ${match.away_team}`,
      `DESCRIPTION:TVF İstanbul ${match.group} Maçı\\nMaç No: ${match.match_no}`,
      `LOCATION:${match.hall}`,
      `DTSTART:${startIso}`,
      `DTEND:${startIso}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mac-${match.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mb-6">
      {/* 1. Grup Başlığı */}
      <div className="bg-[#111827] text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-primary">
            <Trophy size={13} className="text-amber-400" />
          </div>
          <h3 className="font-bold text-xs sm:text-sm tracking-tight text-white uppercase">
            <LeagueVolleyboxLink league={title} city={city || matches[0]?.city}>
              {title}
            </LeagueVolleyboxLink>
            {subTitle ? ` • ${subTitle}` : ""}
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
          {matches.length} Maç
        </span>
      </div>

      {/* 2. Resmi TVF / Fikstür Tablosu: Tarih - Saat - Yer - A Takımı - B Takımı - Skor - Set Skorları */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-600 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-2 text-center w-8" title="Favorilere Ekle">⭐</th>
              <th className="py-2.5 px-3 w-28 whitespace-nowrap">Tarih</th>
              <th className="py-2.5 px-2 text-center w-14">Saat</th>
              <th className="py-2.5 px-3 min-w-[160px]">Yer</th>
              <th className="py-2.5 px-3 min-w-[150px]">A Takımı</th>
              <th className="py-2.5 px-3 min-w-[150px]">B Takımı</th>
              <th className="py-2.5 px-2 text-center w-20">Skor</th>
              <th className="py-2.5 px-3 min-w-[180px]">Set Skorları</th>
              <th className="py-2.5 px-2 text-center min-w-[95px]" title="Volleybox maç kaydı durumu">Volleybox</th>
              <th className="py-2.5 px-2 text-center w-14 no-print">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {matches.map((match, idx) => {
              const isFav = favorites.includes(match.id);
              const isFinished = match.status === "finished";
              const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
              const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);
              const { date, day } = formatRowDate(match.date);
              const isCopied = copiedId === match.id;

              return (
                <tr
                  key={match.id}
                  className={`transition-colors ${
                    isFav
                      ? "bg-amber-50/50 hover:bg-amber-50/80"
                      : idx % 2 === 1
                      ? "bg-slate-50/40 hover:bg-slate-100/60"
                      : "bg-white hover:bg-slate-50"
                  }`}
                >
                  {/* ⭐ Favori */}
                  <td className="py-2.5 px-2 text-center">
                    <button
                      onClick={() => onToggleFavorite(match.id)}
                      className="p-1 rounded text-slate-300 hover:text-amber-400 transition-colors"
                      title={isFav ? "Favorilerden Çıkar" : "Favorilere Ekle"}
                    >
                      <Star
                        size={15}
                        className={isFav ? "fill-amber-400 text-amber-400" : ""}
                      />
                    </button>
                  </td>

                  {/* 1. Tarih */}
                  <td className="py-2.5 px-3 font-mono font-medium whitespace-nowrap text-slate-800">
                    <span>{date}</span>
                    {day && (
                      <span className="text-[10px] text-slate-400 ml-1 font-sans">
                        ({day})
                      </span>
                    )}
                  </td>

                  {/* 2. Saat */}
                  <td className="py-2.5 px-2 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                    {match.time === "--:--" ? (
                      <span className="text-slate-400 text-[11px]">-</span>
                    ) : (
                      <span>{match.time}</span>
                    )}
                  </td>

                  {/* 3. Yer */}
                  <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap" title={match.hall}>
                    <div className="flex items-center gap-1">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span className="truncate max-w-[180px]">{match.hall}</span>
                    </div>
                  </td>

                  {/* 4. A Takımı */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <TeamVolleyboxLink
                      teamName={match.home_team}
                      category={match.category || match.age_group}
                      className={`text-xs sm:text-[13px] ${
                        homeWon
                          ? "font-black text-slate-900"
                          : isFinished
                          ? "font-normal text-slate-500"
                          : "font-bold text-slate-800"
                      }`}
                    />
                  </td>

                  {/* 5. B Takımı */}
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <TeamVolleyboxLink
                      teamName={match.away_team}
                      category={match.category || match.age_group}
                      className={`text-xs sm:text-[13px] ${
                        awayWon
                          ? "font-black text-slate-900"
                          : isFinished
                          ? "font-normal text-slate-500"
                          : "font-bold text-slate-800"
                      }`}
                    />
                  </td>

                  {/* 6. Skor */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    {isFinished ? (
                      <span className="inline-block px-2 py-0.5 rounded font-mono font-black text-xs bg-[#0b1325] text-white shadow-xs">
                        {match.home_score} - {match.away_score}
                      </span>
                    ) : match.date !== "TBD" ? (
                      <span className="inline-block px-2 py-0.5 rounded font-mono text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                        vs
                      </span>
                    ) : (
                      <span className="text-slate-400 font-mono text-xs">-</span>
                    )}
                  </td>

                  {/* 7. Set Skorları */}
                  <td className="py-2.5 px-3 text-left whitespace-nowrap">
                    {isFinished && match.set_scores && match.set_scores.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1">
                        {match.set_scores.map((set, sIdx) => (
                          <span
                            key={sIdx}
                            className="font-mono text-[11px] bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded border border-slate-200/80 font-medium"
                          >
                            {set}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-mono">-</span>
                    )}
                  </td>

                  {/* Volleybox Senkronizasyon Rozeti */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    {match.volleybox?.synced ? (
                      <a
                        href={match.volleybox.url || `https://women.volleybox.net/m${match.volleybox.match_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs group"
                        title={`Volleybox'ta Kayıtlı (Maç ID: #${match.volleybox.match_id}) - Tıklayarak profili açın`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Volleybox</span>
                        <ExternalLink size={10} className="text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-slate-400 bg-slate-50 border border-slate-200/60 font-medium"
                        title="Bu maç henüz Volleybox veritabanına girilmemiş"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span>Girilmedi</span>
                      </span>
                    )}
                  </td>

                  {/* İşlemler (Kopyala / Takvim) */}
                  <td className="py-2.5 px-2 text-center whitespace-nowrap no-print">
                    <div className="flex items-center justify-center gap-1">
                      {!isFinished && match.date !== "TBD" && (
                        <button
                          onClick={(e) => handleDownloadIcs(e, match)}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-primary transition-colors"
                          title="Takvime Ekle (.ics)"
                        >
                          <CalendarPlus size={13} />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleCopy(e, match)}
                        className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                        title="Maç Detayını Kopyala"
                      >
                        {isCopied ? (
                          <Check size={13} className="text-emerald-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
