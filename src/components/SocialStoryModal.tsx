"use client";

import React, { useEffect, useRef, useState } from "react";
import { Match } from "@/types/fixture";
import { X, Download, Share2, Sparkles, Check, Copy } from "lucide-react";
import { triggerHaptic } from "@/utils/haptics";
import { getMatchForfeitInfo } from "@/utils/forfeit";

interface SocialStoryModalProps {
  match: Match | null;
  onClose: () => void;
  city?: string;
}

export const SocialStoryModal: React.FC<SocialStoryModalProps> = ({
  match,
  onClose,
  city = "İstanbul",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!match) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 9:16 Story format (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // 1. Zemin: Derin Koyu Gradyan
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, "#080c14");
    bgGrad.addColorStop(0.35, "#0f172a");
    bgGrad.addColorStop(0.7, "#1e1b4b");
    bgGrad.addColorStop(1, "#080c14");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // 2. Voleybol Sahası Çizgi Filigranları
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 250, 880, 1420); // Dış saha
    ctx.beginPath();
    ctx.moveTo(100, 960);
    ctx.lineTo(980, 960); // Orta çizgi (File)
    ctx.stroke();

    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo(100, 720);
    ctx.lineTo(980, 720); // 3 metre hücum çizgisi
    ctx.moveTo(100, 1200);
    ctx.lineTo(980, 1200);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Parlayan Üst Işık (Ambient Light)
    const glowGrad = ctx.createRadialGradient(540, 200, 50, 540, 200, 450);
    glowGrad.addColorStop(0, "rgba(220, 38, 38, 0.25)");
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, 1080, 600);

    // 4. TVF ALTYAPI VOLEYBOL Üst Rozet
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(340, 140, 400, 64, 16);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px 'Museo Sans', system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TVF ALTYAPI VOLEYBOL", 540, 172);

    // 5. Lig ve Grup Bilgisi
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 32px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(
      `${city.toUpperCase()} • ${(match.category || "").toUpperCase()}`,
      540,
      250
    );

    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 28px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(match.group || "Grup Maçı", 540, 295);

    // 6. Ev Sahibi Takım
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(match.home_team, 540, 560);

    // 7. Skor veya VS Alanı
    const isFinished = match.status === "finished";
    if (isFinished) {
      // Skor Kutusu
      const scoreGrad = ctx.createLinearGradient(390, 640, 690, 840);
      scoreGrad.addColorStop(0, "#dc2626");
      scoreGrad.addColorStop(1, "#991b1b");
      ctx.fillStyle = scoreGrad;
      ctx.beginPath();
      ctx.roundRect(360, 660, 360, 160, 28);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = "900 96px monospace, sans-serif";
      ctx.fillText(
        `${match.home_score ?? 0}  -  ${match.away_score ?? 0}`,
        540,
        745
      );

      // Set Skorları
      if (match.set_scores && match.set_scores.length > 0) {
        ctx.fillStyle = "#cbd5e1";
        ctx.font = "bold 34px monospace, sans-serif";
        const forfeit = getMatchForfeitInfo(match);
        const setScoresText = forfeit.isForfeit
          ? `${match.set_scores.join("   •   ")}   (HÜKMEN)`
          : match.set_scores.join("   •   ");
        ctx.fillText(setScoresText, 540, 875);
      }
    } else {
      // VS Rozeti
      ctx.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx.beginPath();
      ctx.roundRect(450, 690, 180, 100, 24);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.stroke();

      ctx.fillStyle = "#f59e0b";
      ctx.font = "900 48px monospace, sans-serif";
      ctx.fillText("VS", 540, 742);
    }

    // 8. Deplasman Takımı
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 52px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(match.away_team, 540, 990);

    // 9. Maç Bilgileri Kartı (Tarih, Saat, Salon)
    ctx.fillStyle = "rgba(15, 23, 42, 0.75)";
    ctx.beginPath();
    ctx.roundRect(140, 1160, 800, 320, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 38px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(`🗓  ${match.date || "Tarih Açıklanacak"}`, 540, 1240);

    ctx.fillStyle = "#facc15";
    ctx.font = "bold 44px monospace, sans-serif";
    ctx.fillText(`⏰  ${match.time || "--:--"}`, 540, 1315);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "600 32px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText(`📍  ${match.hall || "Salon Açıklanacak"}`, 540, 1390);

    // 10. Altbilgi / İntro Filigran
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 26px 'Museo Sans', system-ui, sans-serif";
    ctx.fillText("volley-tracker • Resmi TVF Fikstür ve Canlı Sonuçlar", 540, 1720);

    try {
      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
    } catch {
      // ignore
    }
  }, [match, city]);

  if (!match) return null;

  const handleDownload = () => {
    triggerHaptic("success");
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `mac-${match.home_team}-${match.away_team}-${match.date}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    triggerHaptic("medium");
    if (!dataUrl) return;
    setSharing(true);

    try {
      if (navigator.share && navigator.canShare) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `mac-hikayesi.png`, { type: "image/png" });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: `${match.home_team} vs ${match.away_team}`,
            text: `TVF ${city} ${match.category} Maçı`,
          });
          return;
        }
      }
      // Fallback: Doğrudan indir
      handleDownload();
    } catch {
      // ignore
    } finally {
      setSharing(false);
    }
  };

  const handleCopyText = () => {
    triggerHaptic("light");
    const text = `🏐 TVF ${city} ${match.category}\n${match.home_team} vs ${match.away_team}\n🗓 ${match.date} ${match.time}\n📍 ${match.hall}\n${match.score ? `Skor: ${match.score}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#0b1325] border border-slate-700/80 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles size={16} className="text-amber-400" />
            <span>Instagram & WhatsApp Hikaye Kartı</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Gizli Canvas (Görseli oluşturur) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 9:16 Hikaye Önizlemesi */}
        <div className="relative w-full max-h-[440px] flex items-center justify-center bg-black/40 rounded-2xl overflow-hidden border border-slate-800 p-2">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dataUrl}
              alt="Hikaye Kartı Önizleme"
              className="max-h-[420px] w-auto rounded-xl object-contain shadow-2xl drop-shadow-md"
            />
          ) : (
            <div className="py-20 text-xs text-slate-400 animate-pulse">
              Hikaye kartı hazırlanıyor...
            </div>
          )}
        </div>

        {/* Aksiyon Butonları */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={15} className="text-emerald-400" />
            <span>Görseli İndir (PNG)</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!dataUrl || sharing}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Share2 size={15} />
            <span>{sharing ? "Paylaşılıyor..." : "Hikayede Paylaş"}</span>
          </button>
        </div>

        <button
          onClick={handleCopyText}
          className="w-full flex items-center justify-center gap-2 py-2 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-300 font-semibold">Metin panoya kopyalandı!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Maç bülten metnini kopyala</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
