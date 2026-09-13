"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { CalendarPlus, Copy, Check, MapPin } from "lucide-react";

interface MatchTableProps {
  dateStr: string;
  matches: Match[];
}

export const MatchTable: React.FC<MatchTableProps> = ({ dateStr, matches }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Tarihi resmi bülten formatında formatla
  const d = new Date(dateStr);
  const formattedDate = d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).toUpperCase();

  const handleCopy = (m: Match) => {
    const text = `TVF İstanbul ${m.category} (${m.group}):\n${m.home_team} vs ${m.away_team}\n🗓 ${m.date} ${m.time}\n📍 ${m.hall}\nMaç No: ${m.match_no}`;
    navigator.clipboard.writeText(text);
    setCopiedId(m.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadIcs = (m: Match) => {
    const startIso = m.date.replace(/-/g, "") + "T" + m.time.replace(":", "") + "00";
    const icsData = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "BEGIN:VEVENT",
      `SUMMARY:${m.category}: ${m.home_team} vs ${m.away_team}`,
      `DESCRIPTION:TVF İstanbul ${m.group} Maçı\\nMaç No: ${m.match_no}`,
      `LOCATION:${m.hall}`,
      `DTSTART:${startIso}`,
      `DTEND:${startIso}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `mac-${m.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden mb-6">
      {/* Günlük Bülten Başlığı */}
      <div className="bg-slate-100 border-b border-border px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary" />
          <h2 className="text-xs sm:text-sm font-bold text-navy tracking-tight">
            {formattedDate} MAÇ PROGRAMI
          </h2>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
          {matches.length} Karşılaşma
        </span>
      </div>

      {/* Masaüstü Bülten Tablosu */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-border uppercase text-[11px] tracking-wider">
              <th className="py-2.5 px-3 w-16 text-center">Saat</th>
              <th className="py-2.5 px-3">Salon</th>
              <th className="py-2.5 px-3">Lig / Kategori</th>
              <th className="py-2.5 px-2 text-center w-16">No</th>
              <th className="py-2.5 px-3 text-right">Ev Sahibi Takım</th>
              <th className="py-2.5 px-2 text-center w-20">Skor</th>
              <th className="py-2.5 px-3">Deplasman Takım</th>
              <th className="py-2.5 px-3 text-center w-28 no-print">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {matches.map((m, idx) => {
              const isFinished = m.status === "finished";

              return (
                <tr
                  key={m.id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                  }`}
                >
                  {/* Saat */}
                  <td className="py-3 px-3 text-center font-bold text-slate-900 whitespace-nowrap">
                    {m.time}
                  </td>

                  {/* Salon */}
                  <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span>{m.hall}</span>
                    </div>
                  </td>

                  {/* Lig & Grup */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-primary block">
                      {m.category}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {m.group}
                    </span>
                  </td>

                  {/* Maç No */}
                  <td className="py-3 px-2 text-center text-slate-500 font-mono text-[11px]">
                    {m.match_no}
                  </td>

                  {/* Ev Sahibi Takım */}
                  <td className="py-3 px-3 text-right font-bold text-slate-900 text-sm whitespace-nowrap">
                    {m.home_team}
                  </td>

                  {/* Skor / VS */}
                  <td className="py-3 px-2 text-center whitespace-nowrap">
                    {isFinished ? (
                      <span className="inline-block px-2.5 py-1 rounded bg-slate-900 text-white font-bold text-xs tracking-wider">
                        {m.score}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold text-[11px] border border-slate-200">
                        VS
                      </span>
                    )}
                  </td>

                  {/* Deplasman Takım */}
                  <td className="py-3 px-3 font-bold text-slate-900 text-sm whitespace-nowrap">
                    {m.away_team}
                  </td>

                  {/* Aksiyon / Takvim */}
                  <td className="py-3 px-3 text-center whitespace-nowrap no-print">
                    {isFinished ? (
                      <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Tamamlandı
                      </span>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleDownloadIcs(m)}
                          className="p-1.5 rounded text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Takvime Ekle (.ics)"
                        >
                          <CalendarPlus size={13} />
                        </button>
                        <button
                          onClick={() => handleCopy(m)}
                          className="p-1.5 rounded text-slate-600 hover:text-primary hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Maç Detayını Kopyala"
                        >
                          {copiedId === m.id ? (
                            <Check size={13} className="text-emerald-600" />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    )}
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
