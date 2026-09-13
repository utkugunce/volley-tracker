"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { Star, MapPin, CalendarPlus, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

interface FlashscoreMatchRowProps {
  match: Match;
  isFavorite: boolean;
  onToggleFavorite: (matchId: string) => void;
}

export const FlashscoreMatchRow: React.FC<FlashscoreMatchRowProps> = ({
  match,
  isFavorite,
  onToggleFavorite,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const isFinished = match.status === "finished";
  const homeWon = isFinished && (match.home_score ?? 0) > (match.away_score ?? 0);
  const awayWon = isFinished && (match.away_score ?? 0) > (match.home_score ?? 0);

  // Set skorlarını ayrıştır (örn: "25-23" -> home: 25, away: 23)
  const parsedSets = (match.set_scores || []).map((s) => {
    const parts = s.split("-").map((p) => p.trim());
    return {
      home: parts[0] || "-",
      away: parts[1] || "-",
    };
  });

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const dateText = match.date === "TBD" ? "Tarih Açıklanacak" : `${match.date} ${match.time}`;
    const text = `TVF İstanbul ${match.category} (${match.group}):\n${match.home_team} vs ${match.away_team}\n🗓 ${dateText}\n📍 ${match.hall}\nMaç No: ${match.match_no}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = (e: React.MouseEvent) => {
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
    <div
      className={`border-b border-slate-200 transition-colors cursor-pointer select-none ${
        isFavorite ? "bg-amber-50/40 hover:bg-amber-50/80" : "bg-white hover:bg-slate-50"
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center px-3 py-2.5 sm:py-3 gap-2 sm:gap-3 text-xs">
        {/* 1. Yıldız (Favori) Butonu */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(match.id);
          }}
          className="p-1 rounded text-slate-300 hover:text-amber-400 transition-colors shrink-0"
          title="Favorilere Ekle"
        >
          <Star
            size={16}
            className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
          />
        </button>

        {/* 2. Saat / Durum Sütunu */}
        <div className="w-14 sm:w-16 shrink-0 text-center">
          {isFinished ? (
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight block">
              Bitti
            </span>
          ) : (
            <span className="text-xs font-bold text-slate-900 block font-mono">
              {match.time}
            </span>
          )}
          <span className="text-[10px] text-slate-400 block font-mono">
            #{match.match_no}
          </span>
        </div>

        {/* 3. İki Satırlı Takım İsimleri (Flashscore İmzası) */}
        <div className="flex-1 min-w-0 pr-2 space-y-1">
          {/* Ev Sahibi Takım */}
          <div className="flex items-center justify-between">
            <span
              className={`truncate text-xs sm:text-sm ${
                homeWon
                  ? "font-extrabold text-slate-900"
                  : isFinished
                  ? "font-normal text-slate-500"
                  : "font-semibold text-slate-800"
              }`}
            >
              {match.home_team}
            </span>
          </div>

          {/* Deplasman Takım */}
          <div className="flex items-center justify-between">
            <span
              className={`truncate text-xs sm:text-sm ${
                awayWon
                  ? "font-extrabold text-slate-900"
                  : isFinished
                  ? "font-normal text-slate-500"
                  : "font-semibold text-slate-800"
              }`}
            >
              {match.away_team}
            </span>
          </div>
        </div>

        {/* 4. Set Skorları Dağılımı (Volleyball 5-Set Flashscore Görünümü) */}
        {isFinished && parsedSets.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[11px] text-slate-500 font-mono">
            {parsedSets.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center w-6 text-center">
                <span className={Number(s.home) > Number(s.away) ? "font-bold text-slate-800" : ""}>
                  {s.home}
                </span>
                <span className={Number(s.away) > Number(s.home) ? "font-bold text-slate-800" : ""}>
                  {s.away}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* 5. Toplam Set Skoru (T) */}
        <div className="shrink-0 flex items-center gap-1 pl-1 sm:pl-2">
          {isFinished ? (
            <div className="flex flex-col items-center bg-slate-100 border border-slate-200 rounded px-2 py-0.5 min-w-[28px] font-bold text-xs sm:text-sm font-mono">
              <span className={homeWon ? "text-primary font-black" : "text-slate-700"}>
                {match.home_score ?? "-"}
              </span>
              <span className={awayWon ? "text-primary font-black" : "text-slate-700"}>
                {match.away_score ?? "-"}
              </span>
            </div>
          ) : (
            <div className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold border border-slate-200">
              VS
            </div>
          )}

          {/* Aç/Kapa Oku */}
          <div className="text-slate-400 p-1">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>

      {/* 6. Genişletilebilir Detay Bölümü (Salon, Grup, Takvim Butonları) */}
      {expanded && (
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium">
              <MapPin size={13} className="text-primary shrink-0" />
              <span>{match.hall}</span>
            </div>
            <div className="text-slate-500 flex items-center gap-2">
              <span className="font-semibold text-primary">{match.category}</span>
              <span>•</span>
              <span>{match.group}</span>
              <span>•</span>
              <span>Maç No: #{match.match_no}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isFinished && (
              <button
                onClick={handleDownloadIcs}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold transition-colors"
                title="Google / Apple / Outlook Takvimine Ekle"
              >
                <CalendarPlus size={13} className="text-primary" />
                <span>Takvime Ekle</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium transition-colors"
              title="Maç Detaylarını Panoya Kopyala"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Kopyalandı</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Kopyala</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
