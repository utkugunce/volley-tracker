"use client";

import React from "react";
import { AlertCircle, Clock, CheckCircle2, ArrowRight } from "lucide-react";

export const AnkaraNotice: React.FC = () => {
  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-court-panel border border-amber-500/40 backdrop-blur-md shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0 mt-0.5 sm:mt-0">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-amber-200">
                Ankara İl Temsilciliği Bülten Durumu
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Yükleme Bekleniyor
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
              Ankara Voleybol İl Temsilciliği henüz 2026-2027 sezonu resmi maç bültenlerini web sitesinde yayımlamamıştır.
              Veri boru hattımız hazır olup (Ankara modülü entegre), bülten sisteme yüklendiği anda sıfır gecikmeyle gerçek maçlar çekilecektir.
              Şu an gösterilen maçlar dashboard'u test edebilmeniz için örnek Ankara takımlarıdır.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Parser Hazır</span>
          </div>
        </div>
      </div>
    </div>
  );
};
