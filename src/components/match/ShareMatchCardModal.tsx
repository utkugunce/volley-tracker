"use client";

import React, { useState } from "react";
import { Match } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { X, Download, Share2, Check, MapPin, Calendar } from "lucide-react";
import { formatGroupName } from "@/utils/grouping";

interface ShareMatchCardModalProps {
  match: Match;
  isOpen: boolean;
  onClose: () => void;
  homeLogo?: string | null;
  awayLogo?: string | null;
}

export const ShareMatchCardModal: React.FC<ShareMatchCardModalProps> = ({
  match,
  isOpen,
  onClose,
  homeLogo,
  awayLogo,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const isFinished =
    match.status === "finished" ||
    (match.home_score !== null &&
      match.home_score !== undefined &&
      match.away_score !== null &&
      match.away_score !== undefined);

  const homeScore = match.home_score ?? 0;
  const awayScore = match.away_score ?? 0;
  const city = match.city || "İstanbul";
  const sets = match.set_scores ?? [];

  const handleDownloadPng = async () => {
    setDownloading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Arka Plan (#07131F -> #0B1929)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 1350);
      bgGrad.addColorStop(0, "#07131F");
      bgGrad.addColorStop(0.5, "#0B1929");
      bgGrad.addColorStop(1, "#07131F");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1350);

      // 2. Üst İnce Vurgu Çizgisi (#FF6B2C)
      ctx.fillStyle = "#FF6B2C";
      ctx.fillRect(80, 88, 120, 8);

      // 3. Üst Marka & Lig Başlığı
      ctx.fillStyle = "#94A3B8";
      ctx.font = "600 26px system-ui, -apple-system, sans-serif";
      ctx.fillText(`ALTYAPI VOLEYBOL  •  ${city.toUpperCase()}`, 80, 145);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "700 42px system-ui, -apple-system, sans-serif";
      const leagueText = `${match.category || "TVF Voleybol Ligi"}${match.group ? ` • ${formatGroupName(match.group)}` : ""}`;
      ctx.fillText(leagueText.slice(0, 44), 80, 205);

      // 4. Ana Skorboard Kartı
      ctx.fillStyle = "#0E2033";
      ctx.strokeStyle = "#1B3550";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, 260, 920, 620, 36);
      ctx.fill();
      ctx.stroke();

      // Durum Etiketi
      ctx.fillStyle = isFinished ? "#10B981" : "#FF6B2C";
      ctx.font = "700 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(isFinished ? "MAÇ SONUCU" : `MAÇ PROGRAMI • ${match.time || ""}`, 130, 330);

      // Ev Sahibi Takım Satırı
      ctx.fillStyle = isFinished && homeScore > awayScore ? "#FFFFFF" : "#CBD5E1";
      ctx.font = `${isFinished && homeScore > awayScore ? "700" : "600"} 46px system-ui, -apple-system, sans-serif`;
      ctx.fillText(match.home_team.slice(0, 24), 130, 445);

      if (isFinished) {
        ctx.fillStyle = homeScore > awayScore ? "#FF6B2C" : "#64748B";
        ctx.font = "800 84px ui-monospace, SFMono-Regular, monospace";
        ctx.textAlign = "right";
        ctx.fillText(String(homeScore), 940, 455);
        ctx.textAlign = "left";
      }

      // Orta Ayırıcı Çizgi
      ctx.fillStyle = "#1B3550";
      ctx.fillRect(130, 505, 810, 2);

      // Deplasman Takım Satırı
      ctx.fillStyle = isFinished && awayScore > homeScore ? "#FFFFFF" : "#CBD5E1";
      ctx.font = `${isFinished && awayScore > homeScore ? "700" : "600"} 46px system-ui, -apple-system, sans-serif`;
      ctx.fillText(match.away_team.slice(0, 24), 130, 595);

      if (isFinished) {
        ctx.fillStyle = awayScore > homeScore ? "#FF6B2C" : "#64748B";
        ctx.font = "800 84px ui-monospace, SFMono-Regular, monospace";
        ctx.textAlign = "right";
        ctx.fillText(String(awayScore), 940, 605);
        ctx.textAlign = "left";
      }

      // Set Skorları Şeridi
      if (sets.length > 0) {
        ctx.fillStyle = "#94A3B8";
        ctx.font = "600 24px system-ui, -apple-system, sans-serif";
        ctx.fillText("SET SKORLARI", 130, 705);

        sets.slice(0, 5).forEach((s, i) => {
          const boxX = 130 + i * 162;
          ctx.fillStyle = "#07131F";
          ctx.strokeStyle = "#1B3550";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(boxX, 730, 145, 92, 18);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#64748B";
          ctx.font = "600 18px ui-monospace, monospace";
          ctx.fillText(`S${i + 1}`, boxX + 20, 762);

          ctx.fillStyle = "#F8FAFC";
          ctx.font = "700 30px ui-monospace, monospace";
          ctx.fillText(s.replace(":", "-"), boxX + 20, 802);
        });
      }

      // 5. Alt Meta Bilgisi (Tarih, Saat, Salon)
      ctx.fillStyle = "#94A3B8";
      ctx.font = "500 28px system-ui, -apple-system, sans-serif";
      ctx.fillText(`📅 ${match.date}   ⏰ ${match.time || "-"}`, 80, 965);
      ctx.fillText(`📍 ${(match.hall || "Salon Açıklanacak").slice(0, 48)}`, 80, 1020);

      // 6. Alt Bilgi (Footer Watermark)
      ctx.fillStyle = "#1B3550";
      ctx.fillRect(80, 1180, 920, 2);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "700 30px system-ui, -apple-system, sans-serif";
      ctx.fillText("altyapivoleybol.com.tr", 80, 1245);

      ctx.fillStyle = "#64748B";
      ctx.font = "500 24px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`Maç #${match.match_no || "-"}`, 1000, 1245);
      ctx.textAlign = "left";

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `mac-karti-${match.date}-${match.match_no || "tvf"}.png`;
      a.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const scoreLine = isFinished
      ? `🏐 *${match.home_team}* ${homeScore} - ${awayScore} *${match.away_team}*${sets.length > 0 ? ` (${sets.join(", ")})` : ""}`
      : `🏐 *${match.home_team}* vs *${match.away_team}*`;
    const text = `${scoreLine}\n🏆 ${city} • ${match.category}${match.group ? ` (${formatGroupName(match.group)})` : ""}\n📅 ${match.date} ${match.time || ""}\n📍 ${match.hall || "-"}\n🔗 https://altyapivoleybol.com.tr`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Skor Kartı Paylaş"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık */}
        <div className="px-4 py-3 border-b border-line/70 flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-primary" />
            <span className="text-xs font-semibold text-white">Paylaşılabilir Maç Kartı</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Paylaşım penceresini kapat"
            className="p-1 rounded-lg text-ink-3 hover:text-white hover:bg-surface-muted transition-colors cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        {/* Canlı Önizleme Kartı (FotMob / Apple Sports Story Stili) */}
        <div className="p-4 bg-canvas">
          <div className="rounded-2xl bg-surface border border-line/80 p-4 space-y-3.5 shadow-lg relative overflow-hidden">
            <div className="w-10 h-1 rounded-full bg-primary" />

            <div className="space-y-0.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                ALTYAPI VOLEYBOL • {city}
              </div>
              <div className="text-xs font-semibold text-white truncate">
                {match.category} {match.group ? `• ${formatGroupName(match.group)}` : ""}
              </div>
            </div>

            {/* Takımlar ve Set Skoru */}
            <div className="bg-surface-muted/60 rounded-xl border border-line/70 p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamBadge name={match.home_team} logoUrl={homeLogo} size="xs" />
                  <span className={`text-xs truncate ${isFinished && homeScore > awayScore ? "font-bold text-white" : "font-medium text-ink-2"}`}>
                    {match.home_team}
                  </span>
                </div>
                {isFinished && (
                  <span className={`font-mono font-scoreboard tabular-nums text-base font-bold ${homeScore > awayScore ? "text-primary" : "text-ink-3"}`}>
                    {homeScore}
                  </span>
                )}
              </div>

              <div className="h-px bg-line/60" />

              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TeamBadge name={match.away_team} logoUrl={awayLogo} size="xs" />
                  <span className={`text-xs truncate ${isFinished && awayScore > homeScore ? "font-bold text-white" : "font-medium text-ink-2"}`}>
                    {match.away_team}
                  </span>
                </div>
                {isFinished && (
                  <span className={`font-mono font-scoreboard tabular-nums text-base font-bold ${awayScore > homeScore ? "text-primary" : "text-ink-3"}`}>
                    {awayScore}
                  </span>
                )}
              </div>

              {sets.length > 0 && (
                <div className="pt-2 border-t border-line/50 flex items-center gap-1.5 flex-wrap">
                  {sets.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-canvas border border-line/70 font-mono font-scoreboard tabular-nums text-[10px] text-ink"
                    >
                      <span className="text-ink-3 mr-1">S{idx + 1}</span>
                      {s.replace(":", "-")}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tarih & Salon */}
            <div className="flex items-center justify-between text-[10px] text-ink-3 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <Calendar size={11} />
                {match.date} {match.time}
              </span>
              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                <MapPin size={11} />
                {match.hall || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Paylaşım Aksiyonları */}
        <div className="px-4 py-3 border-t border-line/70 bg-surface-muted/30 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadPng}
            disabled={downloading}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg text-xs font-semibold transition-colors cursor-pointer"
          >
            {downloaded ? (
              <>
                <Check size={14} />
                <span>İndirildi!</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span>{downloading ? "Hazırlanıyor..." : "Görsel İndir (PNG)"}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-muted hover:bg-panel text-white border border-line text-xs font-semibold transition-colors cursor-pointer"
          >
            <Share2 size={14} className="text-emerald-400" />
            <span>WhatsApp&apos;ta Paylaş</span>
          </button>
        </div>
      </div>
    </div>
  );
};
