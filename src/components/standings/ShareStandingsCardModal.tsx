"use client";

import React, { useState } from "react";
import type { StandingItem } from "@/types/fixture";
import { TeamBadge } from "@/components/TeamBadge";
import { X, Download, Share2, Check } from "lucide-react";

interface ShareStandingsCardModalProps {
  items: StandingItem[];
  city?: string;
  leagueTitle: string;
  groupTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStandingsCardModal: React.FC<ShareStandingsCardModalProps> = ({
  items,
  city = "İstanbul",
  leagueTitle,
  groupTitle,
  isOpen,
  onClose,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const topRows = items.slice(0, 10);

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
      ctx.fillRect(80, 78, 120, 8);

      // 3. Başlıklar
      ctx.fillStyle = "#94A3B8";
      ctx.font = "600 24px system-ui, -apple-system, sans-serif";
      ctx.fillText(`PUAN DURUMU  •  ${(city || "TÜRKİYE").toUpperCase()}`, 80, 132);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "700 40px system-ui, -apple-system, sans-serif";
      const headerLine = `${leagueTitle}${groupTitle && groupTitle !== "Genel" ? ` • ${groupTitle}` : ""}`;
      ctx.fillText(headerLine.slice(0, 44), 80, 190);

      // 4. Tablo Çerçevesi
      const tableTop = 235;
      const rowHeight = 82;
      const tableHeight = 70 + topRows.length * rowHeight;

      ctx.fillStyle = "#0E2033";
      ctx.strokeStyle = "#1B3550";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(80, tableTop, 920, tableHeight, 28);
      ctx.fill();
      ctx.stroke();

      // Tablo Sütun Başlıkları
      ctx.fillStyle = "#64748B";
      ctx.font = "700 20px ui-monospace, SFMono-Regular, monospace";
      ctx.fillText("#", 118, tableTop + 44);
      ctx.fillText("TAKIM", 175, tableTop + 44);
      ctx.textAlign = "center";
      ctx.fillText("O", 675, tableTop + 44);
      ctx.fillText("G", 745, tableTop + 44);
      ctx.fillText("M", 815, tableTop + 44);
      ctx.fillStyle = "#FF6B2C";
      ctx.fillText("P", 915, tableTop + 44);
      ctx.textAlign = "left";

      ctx.fillStyle = "#1B3550";
      ctx.fillRect(105, tableTop + 62, 870, 2);

      // Satırlar
      topRows.forEach((row, idx) => {
        const y = tableTop + 66 + idx * rowHeight;
        const textY = y + 50;

        if (idx > 0) {
          ctx.fillStyle = "rgba(27, 53, 80, 0.55)";
          ctx.fillRect(105, y, 870, 1);
        }

        // Sıra
        ctx.fillStyle = idx < 2 ? "#FF6B2C" : "#94A3B8";
        ctx.font = "700 26px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(String(row.rank || idx + 1), 118, textY);

        // Takım Adı
        ctx.fillStyle = idx === 0 ? "#FFFFFF" : "#E2E8F0";
        ctx.font = `${idx === 0 ? "700" : "600"} 28px system-ui, -apple-system, sans-serif`;
        ctx.fillText(row.team.slice(0, 26), 175, textY);

        // O, G, M, P
        ctx.textAlign = "center";
        ctx.fillStyle = "#94A3B8";
        ctx.font = "600 26px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(String(row.played), 675, textY);

        ctx.fillStyle = "#10B981";
        ctx.fillText(String(row.won), 745, textY);

        ctx.fillStyle = "#EF4444";
        ctx.fillText(String(row.lost), 815, textY);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "800 30px ui-monospace, SFMono-Regular, monospace";
        ctx.fillText(String(row.points), 915, textY);
        ctx.textAlign = "left";
      });

      // 5. Alt Bilgi (Footer Watermark)
      ctx.fillStyle = "#1B3550";
      ctx.fillRect(80, 1210, 920, 2);

      ctx.fillStyle = "#F8FAFC";
      ctx.font = "700 28px system-ui, -apple-system, sans-serif";
      ctx.fillText("altyapivoleybol.com.tr", 80, 1270);

      ctx.fillStyle = "#64748B";
      ctx.font = "500 22px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${items.length} Takım`, 1000, 1270);
      ctx.textAlign = "left";

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `puan-durumu-${(city || "tvf").toLowerCase()}.png`;
      a.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsAppShare = () => {
    const lines = topRows.map(
      (r, i) => `${r.rank || i + 1}. ${r.team} — ${r.points}P (${r.won}G/${r.lost}M)`
    );
    const text = `🏆 *${city ? `${city} • ` : ""}${leagueTitle}${groupTitle ? ` (${groupTitle})` : ""} Puan Durumu*\n\n${lines.join("\n")}\n\n🔗 https://altyapivoleybol.com.tr`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Puan Durumu Kartı Paylaş"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık */}
        <div className="px-4 py-3 border-b border-line/70 flex items-center justify-between bg-surface-muted/40">
          <div className="flex items-center gap-2">
            <Share2 size={15} className="text-primary" />
            <span className="text-xs font-semibold text-white">Puan Durumu Kartı Paylaş</span>
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

        {/* Canlı Önizleme */}
        <div className="p-4 bg-canvas overflow-y-auto">
          <div className="rounded-2xl bg-surface border border-line/80 p-4 space-y-3 shadow-lg">
            <div className="w-10 h-1 rounded-full bg-primary" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-3">
                PUAN DURUMU • {city || "TÜRKİYE"}
              </div>
              <div className="text-xs font-semibold text-white truncate mt-0.5">
                {leagueTitle} {groupTitle && groupTitle !== "Genel" ? `• ${groupTitle}` : ""}
              </div>
            </div>

            <div className="rounded-xl bg-surface-muted/50 border border-line/60 overflow-hidden">
              <table className="w-full text-[11px] text-left">
                <thead>
                  <tr className="border-b border-line/60 text-ink-3 font-mono text-[10px]">
                    <th className="py-1.5 px-2 w-6 text-center">#</th>
                    <th className="py-1.5 px-2">Takım</th>
                    <th className="py-1.5 px-1.5 text-center">O</th>
                    <th className="py-1.5 px-1.5 text-center">G</th>
                    <th className="py-1.5 px-1.5 text-center">M</th>
                    <th className="py-1.5 px-2 text-center text-primary font-bold">P</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/40 font-mono tabular-nums">
                  {topRows.map((row, idx) => (
                    <tr key={row.team} className={idx === 0 ? "text-white font-semibold" : "text-ink-2"}>
                      <td className="py-1.5 px-2 text-center text-ink-3">{row.rank || idx + 1}</td>
                      <td className="py-1.5 px-2 font-sans">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <TeamBadge name={row.team} size="xs" />
                          <span className="truncate max-w-[140px]">{row.team}</span>
                        </div>
                      </td>
                      <td className="py-1.5 px-1.5 text-center text-ink-3">{row.played}</td>
                      <td className="py-1.5 px-1.5 text-center text-done">{row.won}</td>
                      <td className="py-1.5 px-1.5 text-center text-form-loss">{row.lost}</td>
                      <td className="py-1.5 px-2 text-center font-bold text-white">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
