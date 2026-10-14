"use client";

import React, { useState } from "react";
import { CalendarPlus, Copy, Check, ExternalLink, X, Smartphone, Globe, Download } from "lucide-react";
import { normalizeCitySlug } from "@/utils/volleybox";

interface CalendarSubscribeModalProps {
  teamName: string;
  teamSlug: string;
  city?: string;
  isOpen: boolean;
  onClose: () => void;
  onDownloadIcs: () => void;
}

export const CalendarSubscribeModal: React.FC<CalendarSubscribeModalProps> = ({
  teamName,
  teamSlug,
  city,
  isOpen,
  onClose,
  onDownloadIcs,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const citySlug = city ? normalizeCitySlug(city) : "";
  const query = `team=${teamSlug}${citySlug ? `&city=${citySlug}` : ""}`;
  const webcalUrl = `webcal://altyapivoleybol.com.tr/api/ics?${query}`;
  const httpsUrl = `https://altyapivoleybol.com.tr/api/ics?${query}`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 sm:p-6 text-slate-100 space-y-4">
        {/* Başlık */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/40 shadow-glow-primary">
              <CalendarPlus size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Canlı Takvim Aboneliği</h3>
              <p className="text-xs text-slate-400">{teamName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Takvime abone olduğunuzda tüm maçlar telefon veya bilgisayar takviminize otomatik eklenir. TVF bülteninde salon veya saat değişikliği yapıldığında takviminiz kendiliğinden güncellenir.
        </p>

        {/* Seçenekler */}
        <div className="space-y-2.5">
          {/* Apple Calendar / iPhone / Mac */}
          <a
            href={webcalUrl}
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-primary/60 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Smartphone size={16} className="text-primary group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-white block">Apple Takvim / iPhone / Mac</span>
                <span className="text-[10px] text-slate-400 block">Tek tıkla doğrudan abone ol</span>
              </div>
            </div>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-primary transition-colors" />
          </a>

          {/* Google Calendar */}
          <a
            href={googleCalendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-sky-500/60 transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Globe size={16} className="text-sky-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-white block">Google Takvim</span>
                <span className="text-[10px] text-slate-400 block">Web tarayıcısında Google Takvim&apos;e ekle</span>
              </div>
            </div>
            <ExternalLink size={14} className="text-slate-400 group-hover:text-sky-400 transition-colors" />
          </a>

          {/* Statik ICS Dosyası */}
          <button
            type="button"
            onClick={() => {
              onDownloadIcs();
              onClose();
            }}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-emerald-500/60 transition-all group cursor-pointer text-left"
          >
            <div className="flex items-center gap-2.5">
              <Download size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <span className="text-xs font-bold text-white block">Dosya Olarak İndir (.ics)</span>
                <span className="text-[10px] text-slate-400 block">Outlook veya diğer uygulamalar için</span>
              </div>
            </div>
            <Download size={14} className="text-slate-400 group-hover:text-emerald-400 transition-colors" />
          </button>
        </div>

        {/* Bağlantıyı Kopyala */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Abonelik Bağlantısı (URL)
          </label>
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              readOnly
              value={webcalUrl}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 select-all focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-xs font-bold transition-all cursor-pointer shadow-glow-primary shrink-0"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span>{copied ? "Kopyalandı" : "Kopyala"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
