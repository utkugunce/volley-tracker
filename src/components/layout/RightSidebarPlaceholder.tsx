"use client";

import React from "react";
import { 
  Trophy, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  ExternalLink, 
  BarChart3, 
  Flame, 
  CheckCircle2, 
  Navigation,
  Layers,
  Sparkles,
  X
} from "lucide-react";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";

interface RightSidebarPlaceholderProps {
  selectedMatch: Match | null;
  onClose?: () => void;
  onToggleFavorite?: (matchId: string) => void;
  isFavorite?: boolean;
}

export const RightSidebarPlaceholder: React.FC<RightSidebarPlaceholderProps> = ({
  selectedMatch,
  onClose,
  onToggleFavorite,
  isFavorite = false,
}) => {
  if (!selectedMatch) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center select-none">
        <div className="w-14 h-14 rounded-2xl bg-[#181A20] border border-[#2A2E3D] flex items-center justify-center text-[#64748B] mb-3 shadow-inner">
          <BarChart3 size={24} />
        </div>
        <h3 className="text-sm font-bold text-white mb-1">Maç Detayı</h3>
        <p className="text-xs text-[#94A3B8] max-w-[220px] mb-4">
          Detaylı set analizi, salon bilgisi ve kafa kafaya istatistikleri görüntülemek için listeden bir maça tıklayın.
        </p>
        <span className="text-[10px] text-[#64748B] bg-[#181A20] px-2.5 py-1 rounded-full border border-[#2A2E3D]">
          Sofascore Detay Paneli
        </span>
      </div>
    );
  }

  const isLive = selectedMatch.status === "live";
  const isFinished = selectedMatch.status === "finished" || (selectedMatch.home_score !== null && selectedMatch.home_score !== undefined);
  const homeScore = selectedMatch.home_score ?? "-";
  const awayScore = selectedMatch.away_score ?? "-";

  return (
    <div className="flex flex-col h-full text-xs select-none">
      {/* 1. Üst Başlık & Kontroller */}
      <div className="px-3.5 py-3 border-b border-[#2A2E3D] flex items-center justify-between bg-[#1E222D]/90">
        <div className="flex items-center gap-2 truncate">
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="font-bold text-white text-[12px] truncate">
            {selectedMatch.category || "Maç Detayı"}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onToggleFavorite && (
            <button
              type="button"
              onClick={() => onToggleFavorite(selectedMatch.id)}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-amber-400 hover:bg-[#181A20] transition-colors"
              title="Favoriye Ekle"
            >
              <Star size={14} className={isFavorite ? "fill-amber-400 text-amber-400" : ""} />
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#181A20] transition-colors"
              title="Kapat"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {/* 2. Maç Skor Kartı (Sofascore Stili) */}
        <div className="bg-[#181A20] rounded-2xl border border-[#2A2E3D] p-3.5 shadow-md space-y-3">
          {/* Lig & Durum Rozeti */}
          <div className="flex items-center justify-between text-[10px] text-[#94A3B8]">
            <span className="truncate pr-2 font-medium">
              {selectedMatch.city ? `TVF ${selectedMatch.city}` : "TVF"} • {selectedMatch.group || "Grup"}
            </span>
            {isLive ? (
              <span className="flex items-center gap-1 font-bold text-[#EF4444] bg-red-950/40 border border-red-800/60 px-2 py-0.5 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
                <span>CANLI</span>
              </span>
            ) : isFinished ? (
              <span className="font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded-full shrink-0">
                BİTTİ
              </span>
            ) : (
              <span className="font-mono text-blue-400 bg-blue-950/40 border border-blue-800/60 px-2 py-0.5 rounded-full shrink-0">
                {selectedMatch.time || "Program"}
              </span>
            )}
          </div>

          {/* Takımlar ve Skor */}
          <div className="space-y-2 pt-1">
            {/* Ev Sahibi */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamBadge name={selectedMatch.home_team} size="sm" />
                <span className={`font-bold text-[13px] truncate ${
                  isFinished && typeof selectedMatch.home_score === "number" && typeof selectedMatch.away_score === "number" && selectedMatch.home_score > selectedMatch.away_score
                    ? "text-white"
                    : "text-[#F1F5F9]"
                }`}>
                  {selectedMatch.home_team}
                </span>
              </div>
              <span className="font-mono text-base font-extrabold text-white px-2 py-0.5 rounded bg-[#1E222D] border border-[#2A2E3D] shrink-0">
                {homeScore}
              </span>
            </div>

            {/* Deplasman */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <TeamBadge name={selectedMatch.away_team} size="sm" />
                <span className={`font-bold text-[13px] truncate ${
                  isFinished && typeof selectedMatch.home_score === "number" && typeof selectedMatch.away_score === "number" && selectedMatch.away_score > selectedMatch.home_score
                    ? "text-white"
                    : "text-[#F1F5F9]"
                }`}>
                  {selectedMatch.away_team}
                </span>
              </div>
              <span className="font-mono text-base font-extrabold text-white px-2 py-0.5 rounded bg-[#1E222D] border border-[#2A2E3D] shrink-0">
                {awayScore}
              </span>
            </div>
          </div>

          {/* Set Skorları Gösterimi (Varsa) */}
          {selectedMatch.set_scores && selectedMatch.set_scores.length > 0 && (
            <div className="pt-2 border-t border-[#2A2E3D]/80 flex items-center justify-between text-[11px]">
              <span className="text-[#94A3B8] font-semibold text-[10px] uppercase">Setler:</span>
              <div className="flex items-center gap-1 font-mono text-blue-300">
                {selectedMatch.set_scores.map((set, idx) => (
                  <span key={idx} className="bg-[#1E222D] border border-[#2A2E3D] px-1.5 py-0.5 rounded text-[10px]">
                    {set}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tarih, Saat & Salon */}
          <div className="pt-2 border-t border-[#2A2E3D]/80 grid grid-cols-2 gap-2 text-[10px] text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">{selectedMatch.date}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="text-blue-400 shrink-0" />
              <span className="truncate">{selectedMatch.time || "TBD"}</span>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 text-[#94A3B8]">
              <MapPin size={12} className="text-rose-400 shrink-0" />
              <span className="truncate">{selectedMatch.hall || "Belirtilmedi"}</span>
            </div>
          </div>
        </div>

        {/* 3. Aşama 3 Yer Tutucusu: Set-by-Set Skor Matrisi */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-white">
            <span className="flex items-center gap-1.5">
              <BarChart3 size={13} className="text-blue-400" />
              <span>Set-by-Set Skor Matrisi</span>
            </span>
            <span className="text-[9px] bg-blue-950/60 text-blue-300 border border-blue-800/50 px-1.5 py-0.2 rounded font-mono">
              Aşama 3
            </span>
          </div>
          <div className="bg-[#1E222D] rounded-lg p-2.5 text-center text-[#94A3B8] text-[11px]">
            {selectedMatch.set_scores && selectedMatch.set_scores.length > 0 ? (
              <div className="space-y-1">
                <div className="text-[10px] text-[#64748B]">Set Ayrıntıları</div>
                <div className="font-mono text-white font-bold">{selectedMatch.set_scores.join(" • ")}</div>
              </div>
            ) : (
              <span className="text-[10px] text-[#64748B]">Maç tamamlandığında set dökümü burada listelenecektir.</span>
            )}
          </div>
        </div>

        {/* 4. Aşama 3 Yer Tutucusu: Salon & Yol Tarifi */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-white">
            <span className="flex items-center gap-1.5">
              <MapPin size={13} className="text-rose-400" />
              <span>Salon & Yol Tarifi</span>
            </span>
            <span className="text-[9px] bg-[#1E222D] text-[#94A3B8] border border-[#2A2E3D] px-1.5 py-0.2 rounded">
              Harita
            </span>
          </div>
          <p className="text-[11px] text-[#F1F5F9] font-medium">
            {selectedMatch.hall || "Salon bilgisi sisteme girilmemiştir."}
          </p>
          {selectedMatch.hall && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                `${selectedMatch.hall} ${selectedMatch.city || ""}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2"
            >
              <Navigation size={11} />
              <span>Google Haritalarda Aç</span>
            </a>
          )}
        </div>

        {/* 5. Aşama 3 Yer Tutucusu: Mini Grup Puan Durumu */}
        <div className="bg-[#181A20] rounded-xl border border-[#2A2E3D] p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-400" />
              <span>Mini Puan Durumu</span>
            </span>
            <span className="text-[9px] bg-blue-950/60 text-blue-300 border border-blue-800/50 px-1.5 py-0.2 rounded font-mono">
              Aşama 3
            </span>
          </div>
          <p className="text-[10px] text-[#94A3B8]">
            Bu grubun canlı puan durumu Aşama 3&apos;te bu alana bağlanacaktır.
          </p>
        </div>

        {/* 6. Volleybox Entegrasyonu (Varsa) */}
        {selectedMatch.volleybox?.url && (
          <a
            href={selectedMatch.volleybox.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E222D] hover:bg-[#242936] border border-[#2A2E3D] text-xs text-white transition-all group"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-[11px]">Volleybox Maç Raporu</span>
            </span>
            <ExternalLink size={12} className="text-[#94A3B8] group-hover:text-white" />
          </a>
        )}
      </div>
    </div>
  );
};
