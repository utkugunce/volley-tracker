"use client";

import React, { useState } from "react";
import { RosterPlayer } from "@/types/roster";
import { Shield, ExternalLink, User } from "lucide-react";

interface VolleyballCourtViewProps {
  players: RosterPlayer[];
  teamName: string;
}

export const VolleyballCourtView: React.FC<VolleyballCourtViewProps> = ({
  players,
  teamName,
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);

  // Mevkilere göre oyuncuları grupla
  const setters = players.filter((p) => (p.position || "").toLowerCase().includes("pasör") && !(p.position || "").toLowerCase().includes("çapraz"));
  const opposites = players.filter((p) => (p.position || "").toLowerCase().includes("çapraz") || (p.position || "").toLowerCase().includes("opposite"));
  const outsides = players.filter((p) => (p.position || "").toLowerCase().includes("smaçör") || (p.position || "").toLowerCase().includes("outside"));
  const middles = players.filter((p) => (p.position || "").toLowerCase().includes("orta") || (p.position || "").toLowerCase().includes("middle"));
  const liberos = players.filter((p) => (p.position || "").toLowerCase().includes("libero"));
  const others = players.filter(
    (p) =>
      !setters.includes(p) &&
      !opposites.includes(p) &&
      !outsides.includes(p) &&
      !middles.includes(p) &&
      !liberos.includes(p)
  );

  // 6 Pozisyon için ilk 6 oyuncuyu belirle
  const pos4 = outsides[0] || players[0]; // Sol Ön (Smaçör 1)
  const pos3 = middles[0] || players[1];  // Orta Ön (Orta 1)
  const pos2 = opposites[0] || players[2]; // Sağ Ön (Pasör Çaprazı)
  const pos5 = outsides[1] || players[3]; // Sol Arka (Smaçör 2)
  const pos6 = setters[0] || players[4];  // Orta Arka (Pasör)
  const pos1 = middles[1] || players[5];  // Sağ Arka (Orta 2 / Servis)
  const liberoPlayer = liberos[0];         // Libero

  const renderCourtPosition = (
    player: RosterPlayer | undefined,
    posNumber: number,
    label: string,
    isLibero = false
  ) => {
    if (!player) {
      return (
        <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/5 border border-dashed border-white/20 text-slate-500 text-xs min-h-[90px]">
          <span className="font-bold text-[10px] uppercase">{label}</span>
          <span className="text-[11px] mt-1 font-mono">Boş</span>
        </div>
      );
    }

    const isSelected = selectedPlayer?.name === player.name;

    return (
      <div
        onClick={() => setSelectedPlayer(player)}
        className={`relative flex flex-col items-center text-center p-2 sm:p-2.5 rounded-2xl transition-all duration-200 cursor-pointer select-none group ${
          isLibero
            ? "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 shadow-glow-amber"
            : isSelected
            ? "bg-red-600/30 border-2 border-red-400 shadow-glow-red scale-105"
            : "bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 shadow-md hover:scale-102"
        }`}
      >
        {/* Pozisyon Numarası Rozeti */}
        <span
          className={`absolute top-1.5 left-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center font-mono ${
            isLibero
              ? "bg-amber-400 text-black"
              : "bg-slate-800 text-slate-300 border border-slate-600"
          }`}
        >
          {isLibero ? "L" : posNumber}
        </span>

        {/* Forma / Numara */}
        <div
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm sm:text-base font-mono shadow-md mt-1 ${
            isLibero
              ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black font-black"
              : "bg-gradient-to-br from-red-600 to-rose-700 text-white font-black"
          }`}
        >
          {player.number ? `#${player.number}` : <User size={16} />}
        </div>

        {/* İsim */}
        <div className="mt-1.5 font-bold text-xs text-white truncate max-w-[100px] sm:max-w-[120px] leading-tight">
          {player.name}
        </div>

        {/* Mevki & Boy */}
        <div className="text-[10px] text-slate-400 truncate max-w-[100px]">
          {player.height_cm ? `${player.height_cm} cm • ` : ""}
          <span className={isLibero ? "text-amber-300 font-bold" : "text-sky-300"}>
            {isLibero ? "Libero" : player.position || label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Voleybol Sahası Konteyneri */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-[#38bdf8]/40 bg-gradient-to-b from-[#0b3b60] via-[#072640] to-[#041525] p-4 sm:p-6 shadow-2xl">
        {/* File (Orta Çizgi - Net) */}
        <div className="relative mb-4 flex items-center justify-center">
          <div className="w-full h-2 bg-gradient-to-r from-white/40 via-white to-white/40 rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]" />
          <span className="absolute bg-slate-900/95 border border-white/30 text-[10px] font-black text-white uppercase tracking-widest px-3 py-0.5 rounded-full shadow-md">
            🏐 FİLE (NET)
          </span>
        </div>

        {/* Ön Hat (Hücum Bölgesi - Attack Zone) */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
              Ön Hat (Hücum Hattı)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            {renderCourtPosition(pos4, 4, "Sol Ön (Smaçör)")}
            {renderCourtPosition(pos3, 3, "Orta Ön (Orta Oyuncu)")}
            {renderCourtPosition(pos2, 2, "Sağ Ön (Pasör Çaprazı)")}
          </div>
        </div>

        {/* 3 Metre Hücum Çizgisi */}
        <div className="my-3 border-t-2 border-dashed border-[#38bdf8]/40 relative">
          <span className="absolute right-2 -top-2.5 bg-[#072640] px-1.5 text-[9px] font-bold text-sky-400/80 tracking-wider">
            3M ÇİZGİSİ
          </span>
        </div>

        {/* Arka Hat (Savunma Bölgesi - Defense Zone) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-300/80">
              Arka Hat (Savunma & Servis)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
            {renderCourtPosition(pos5, 5, "Sol Arka (Smaçör)")}
            {renderCourtPosition(pos6, 6, "Orta Arka (Pasör)")}
            {renderCourtPosition(pos1, 1, "Sağ Arka (Servis)")}
          </div>
        </div>

        {/* Libero Savunma Kutusu */}
        {liberoPlayer && (
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-center">
            <div className="w-full max-w-[180px]">
              {renderCourtPosition(liberoPlayer, 0, "Libero", true)}
            </div>
          </div>
        )}
      </div>

      {/* Seçili Oyuncu Detay Kartı (Modal / Tooltip) */}
      {selectedPlayer && (
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 font-bold flex items-center justify-center font-mono text-sm shrink-0">
              {selectedPlayer.number ? `#${selectedPlayer.number}` : "-"}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm truncate">{selectedPlayer.name}</div>
              <div className="text-slate-400 text-[11px] truncate">
                {selectedPlayer.position || "Mevki Belirtilmedi"}
                {selectedPlayer.height_cm ? ` • ${selectedPlayer.height_cm} cm` : ""}
                {selectedPlayer.birth_year ? ` • Doğum: ${selectedPlayer.birth_year}` : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {selectedPlayer.profile_url && (
              <a
                href={selectedPlayer.profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors text-xs border border-slate-700"
              >
                <span>Volleybox</span>
                <ExternalLink size={11} />
              </a>
            )}
            <button
              onClick={() => setSelectedPlayer(null)}
              className="text-slate-500 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
