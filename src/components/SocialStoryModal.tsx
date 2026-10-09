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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [match, onClose]);

  useEffect(() => {
    if (!match) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 9:16 Story format (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Canvas `ctx.font` içinde CSS var() çözülmez: next/font'un gerçek aile adını oku.
    const cs = getComputedStyle(document.documentElement);
    const FONT_BODY = `${cs.getPropertyValue("--font-manrope").trim() || "Manrope"}, system-ui, sans-serif`;
    const FONT_NUM = `${cs.getPropertyValue("--font-space-grotesk").trim() || "Space Grotesk"}, system-ui, sans-serif`;

    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      // 1. Zemin: Derin Koyu Gradyan
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
      bgGrad.addColorStop(0, "#07131F");
      bgGrad.addColorStop(0.35, "#0E2033");
      bgGrad.addColorStop(0.7, "#0A1A2B");
      bgGrad.addColorStop(1, "#07131F");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Voleybol Sahası Çizgi Filigranları
      ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
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
      glowGrad.addColorStop(0, "rgba(45, 212, 192, 0.20)");
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, 1080, 600);

      // 4. TVF ALTYAPI VOLEYBOL Üst Rozet
      ctx.fillStyle = "#2DD4C0";
      ctx.beginPath();
      ctx.roundRect(340, 140, 400, 64, 16);
      ctx.fill();

      ctx.fillStyle = "#032320";
      ctx.font = `bold 28px ${FONT_BODY}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("TVF ALTYAPI VOLEYBOL", 540, 172);

      // 5. Lig ve Grup Bilgisi
      ctx.fillStyle = "#A9C3D1";
      ctx.font = `bold 32px ${FONT_BODY}`;
      ctx.fillText(
        `${city.toUpperCase()} • ${(match.category || "").toUpperCase()}`,
        540,
        250
      );

      ctx.fillStyle = "#7FB4FF";
      ctx.font = `bold 28px ${FONT_BODY}`;
      ctx.fillText(match.group || "Grup Maçı", 540, 295);

      // 6. Ev Sahibi Takım
      ctx.fillStyle = "#EAF6FA";
      ctx.font = `800 52px ${FONT_BODY}`;
      ctx.fillText(match.home_team, 540, 560);

      // 7. Skor veya VS Alanı
      const isFinished = match.status === "finished";
      if (isFinished) {
        // Skor Kutusu
        const scoreGrad = ctx.createLinearGradient(390, 640, 690, 840);
        scoreGrad.addColorStop(0, "#13293F");
        scoreGrad.addColorStop(1, "#0A1A2B");
        ctx.fillStyle = scoreGrad;
        ctx.beginPath();
        ctx.roundRect(360, 660, 360, 160, 28);
        ctx.fill();
        ctx.strokeStyle = "rgba(45, 212, 192, 0.4)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#9BE15D";
        ctx.font = `700 96px ${FONT_NUM}`;
        ctx.fillText(
          `${match.home_score ?? 0}  -  ${match.away_score ?? 0}`,
          540,
          745
        );

        // Set Skorları
        if (match.set_scores && match.set_scores.length > 0) {
          ctx.fillStyle = "#A9C3D1";
          ctx.font = `600 34px ${FONT_NUM}`;
          const forfeit = getMatchForfeitInfo(match);
          const setScoresText = forfeit.isForfeit
            ? `${match.set_scores.join("   •   ")}   (HÜKMEN)`
            : match.set_scores.join("   •   ");
          ctx.fillText(setScoresText, 540, 875);
        }
      } else {
        // VS Rozeti
        ctx.fillStyle = "#13293F";
        ctx.beginPath();
        ctx.roundRect(450, 690, 180, 100, 24);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.stroke();

        ctx.fillStyle = "#2DD4C0";
        ctx.font = `700 48px ${FONT_NUM}`;
        ctx.fillText("VS", 540, 742);
      }

      // 8. Deplasman Takımı
      ctx.fillStyle = "#EAF6FA";
      ctx.font = `800 52px ${FONT_BODY}`;
      ctx.fillText(match.away_team, 540, 990);

      // 9. Maç Bilgileri Kartı (Tarih, Saat, Salon)
      ctx.fillStyle = "rgba(14, 32, 51, 0.85)";
      ctx.beginPath();
      ctx.roundRect(140, 1160, 800, 320, 24);
      ctx.fill();
      ctx.strokeStyle = "#1B3550";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#EAF6FA";
      ctx.font = `bold 36px ${FONT_BODY}`;
      ctx.fillText(`🗓  ${match.date || "Tarih Açıklanacak"}`, 540, 1240);

      ctx.fillStyle = "#2DD4C0";
      ctx.font = `700 44px ${FONT_NUM}`;
      ctx.fillText(`⏰  ${match.time || "--:--"}`, 540, 1315);

      ctx.fillStyle = "#A9C3D1";
      ctx.font = `600 32px ${FONT_BODY}`;
      ctx.fillText(`📍  ${match.hall || "Salon Açıklanacak"}`, 540, 1390);

      // 10. Altbilgi / İntro Filigran
      ctx.fillStyle = "#8CA8B8";
      ctx.font = `bold 26px ${FONT_BODY}`;
      ctx.fillText("altyapivoleybol.com.tr • TVF Altyapı Bülteni ve Canlı Sonuçlar", 540, 1720);

      try {
        const url = canvas.toDataURL("image/png");
        setDataUrl(url);
      } catch {
        // ignore
      }
    };

    // Yüklenmemiş web fontuyla çizim yapmamak için önce fontları yükle (Türkçe karakterler dahil)
    const fontsApi = document.fonts;
    if (fontsApi?.load) {
      Promise.all([
        fontsApi.load(`700 32px ${FONT_BODY}`, "ÇĞİÖŞÜçğıöşü"),
        fontsApi.load(`700 32px ${FONT_NUM}`, "0123456789"),
      ])
        .catch(() => undefined)
        .then(draw);
    } else {
      draw();
    }

    return () => {
      cancelled = true;
    };
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
      role="dialog"
      aria-modal="true"
      aria-label="Hikaye Kartı Önizleme"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-surface-muted border border-slate-700/80 rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlığı */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles size={16} className="text-primary" aria-hidden="true" />
            <span>Instagram & WhatsApp Hikaye Kartı</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={16} aria-hidden="true" />
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
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-raised hover:bg-surface-raised/80 text-ink text-xs font-bold border border-line shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Download size={15} className="text-done" />
            <span>Görseli İndir (PNG)</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!dataUrl || sharing}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-fg text-xs font-bold shadow-glow-primary transition-all active:scale-95 cursor-pointer disabled:opacity-50"
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
              <span className="text-done font-semibold">Metin panoya kopyalandı!</span>
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
