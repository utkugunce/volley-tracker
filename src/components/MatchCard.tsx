"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { MapPin, CalendarPlus, Check, Copy } from "lucide-react";

interface MatchCardProps {
  match: Match;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const [copied, setCopied] = useState(false);

  const isFinished = match.status === "finished";

  // Tarihi Türkçe formatla
  const formattedDate = new Date(match.date).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    weekday: "short",
  });

  const handleCopy = () => {
    const text = `${match.category} Maçı:\n${match.home_team} vs ${match.away_team}\n🗓 ${match.date} ${match.time}\n📍 ${match.hall}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadIcs = () => {
    // Basit ICS takvim dosyası oluştur
    const startIso = match.date.replace(/-/g, "") + "T" + match.time.replace(":", "") + "00";
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${match.category}: ${match.home_team} vs ${match.away_team}`,
      `DESCRIPTION:TVF Ankara İl Şampiyonası ${match.group} Maçı\\nMaç No: ${match.match_no}`,
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
    <div className="group relative bg-surface border border-border hover:border-zinc-700 hover:shadow-[0_0_25px_rgba(0,0,0,0.5)] rounded-2xl p-4 sm:p-5 transition-all duration-200">
      {/* İnce sol vurgu çizgisi (Oynanacak maçlar için accent yeşil, bitenler için gri) */}
      <div
        className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors ${
          isFinished ? "bg-zinc-800" : "bg-accent group-hover:shadow-[0_0_10px_#00f59b]"
        }`}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Sol Taraf: Saat, Durum & Lig Bilgisi */}
        <div className="flex items-center gap-3.5">
          <div className="text-center bg-background border border-border px-3 py-2 rounded-xl min-w-[64px]">
            <span className="block text-base font-bold font-mono text-white tracking-tight">
              {match.time}
            </span>
            <span
              className={`inline-block text-[10px] uppercase font-mono font-semibold px-1.5 py-0.2 rounded ${
                isFinished
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-accent/15 text-accent"
              }`}
            >
              {isFinished ? "BİTTİ" : "BEKLİYOR"}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-accent tracking-wide">
                {match.category}
              </span>
              <span className="text-zinc-600 text-xs">•</span>
              <span className="text-xs font-mono text-zinc-400">
                {match.group}
              </span>
              <span className="text-zinc-700 text-xs"># {match.match_no}</span>
            </div>

            {/* Takım İsimleri */}
            <div className="flex items-center gap-2.5 text-base sm:text-lg font-semibold tracking-tight text-white">
              <span className="hover:text-accent transition-colors">
                {match.home_team}
              </span>
              <span className="text-xs text-muted font-mono font-normal">vs</span>
              <span className="hover:text-accent transition-colors">
                {match.away_team}
              </span>
            </div>

            {/* Salon / Konum */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <MapPin size={13} className="text-zinc-500" />
              <span>{match.hall}</span>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Skor veya Aksiyon Butonları */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
          {isFinished ? (
            <div className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-xl">
              <span className="text-xs uppercase font-mono text-muted">Skor:</span>
              <span className="text-xl font-mono font-bold text-white tracking-wider">
                {match.score || "Bitti"}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadIcs}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-xs font-mono text-zinc-300 hover:text-white bg-background hover:bg-surface-hover border border-border px-3 py-2 rounded-xl transition-all"
                title="Takvime Ekle (.ics)"
              >
                <CalendarPlus size={13} className="text-accent" />
                <span>Takvime Ekle</span>
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center justify-center p-2 rounded-xl bg-background hover:bg-surface-hover border border-border text-zinc-400 hover:text-white transition-all"
                title="Maç Detayını Kopyala"
              >
                {copied ? (
                  <Check size={14} className="text-accent" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
