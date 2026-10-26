"use client";

import React from "react";
import {
  FileText,
  ExternalLink,
  Trophy,
  CheckCircle2,
  Award,
  ShieldAlert,
} from "lucide-react";

interface SultanlarLigiStatuViewProps {
  totalTeams?: number;
}

export const SultanlarLigiStatuView: React.FC<SultanlarLigiStatuViewProps> = ({
  totalTeams = 14,
}) => {
  const statuPdfUrl =
    "https://tvf.org.tr/lig/sultanlar-ligi";

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Üst Başlık & PDF Butonu */}
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-400/15 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                2026-2027 TVF Vodafone Sultanlar Ligi Resmi Statüsü
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-muted text-ink-2 border border-line font-mono tabular-nums font-bold">
                {totalTeams} Kulüp • Tek Grup
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Türkiye Voleybol Federasyonu Vodafone Sultanlar Ligi lig etabı, şampiyonluk/klasman play-off ve düşme kuralları
            </p>
          </div>
        </div>

        <a
          href={statuPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-xs font-bold transition-colors shrink-0"
        >
          <span>Resmi TVF Sayfası</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* 2. Lig Aşamaları & Yol Haritası */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/25">
                1. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">14 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Lig Etabı (Normal Sezon)</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              İki devreli deplasmanlı lig usulü (26 Hafta). İlk 4 takım Şampiyonluk Play-off&apos;una, 5-8 arası Klasman Etabı&apos;na kalır.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              İlk 4 Play-off
            </span>
            <span className="text-rose-400 text-[10px] font-medium">Son 2 Düşer</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25">
                2. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">4 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Şampiyonluk Play-off (1-4)</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              1-4 ve 2-3 eşleşmeleri 3 maç üzerinden oynanır. Galip gelenler Final serisine (3 galibiyet alan şampiyon) yükselir.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Trophy size={12} />
              Türkiye Şampiyonu
            </span>
            <span className="text-ink-3 text-[10px]">CEV Şampiyonlar Ligi</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/25">
                3. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">4 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Klasman Etabı (5-8)</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              5-8 ve 6-7 eşleşmeleri üzerinden oynanır. Kazananlar 5/6, kaybedenler 7/8 maçları yaparak Avrupa kupası biletlerini alır.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <Award size={12} />
              Avrupa Biletleri
            </span>
            <span className="text-ink-3 text-[10px]">CEV & Challenge Cup</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/25">
                Düşme Hattı
              </span>
              <span className="text-[10px] font-mono text-ink-3">2 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">1. Lig&apos;e Düşme</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Lig etabını (normal sezonu) 13. ve 14. sırada bitiren son 2 kulüp doğrudan KFC Kadınlar 1. Ligi&apos;ne düşer.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <ShieldAlert size={12} />
              13. ve 14. Sıra
            </span>
            <span className="text-ink-3 text-[10px]">KFC Kadınlar 1. Ligi</span>
          </div>
        </div>
      </div>

      {/* 3. Puan ve Sıralama Kriterleri */}
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-bold text-ink">Resmi TVF Puanlama & Eşitlik Bozma Sistemi</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-surface-muted border border-line">
            <p className="font-bold text-emerald-400">3-0 ve 3-1 Galibiyet</p>
            <p className="text-ink-2 text-[11px] mt-0.5">Kazanan takıma <strong className="text-ink">3 puan</strong>, kaybedene 0 puan verilir.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted border border-line">
            <p className="font-bold text-emerald-400">3-2 Galibiyet</p>
            <p className="text-ink-2 text-[11px] mt-0.5">Kazanan takıma <strong className="text-ink">2 puan</strong>, kaybedene <strong className="text-ink">1 puan</strong> verilir.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted border border-line">
            <p className="font-bold text-primary">1. Eşitlik Bozma: Galibiyet</p>
            <p className="text-ink-2 text-[11px] mt-0.5">Puan eşitliğinde öncelikle daha fazla <strong className="text-ink">galibiyet</strong> alan öne geçer.</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-muted border border-line">
            <p className="font-bold text-primary">2. ve 3. Eşitlik: Oranlar</p>
            <p className="text-ink-2 text-[11px] mt-0.5">Galibiyet de eşitse sırasıyla <strong className="text-ink">Set Oranı</strong> ve ardından <strong className="text-ink">Sayı Oranı</strong> belirleyicidir.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
