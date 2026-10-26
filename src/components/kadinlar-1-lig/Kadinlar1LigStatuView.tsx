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

interface Kadinlar1LigStatuViewProps {
  totalTeams?: number;
}

export const Kadinlar1LigStatuView: React.FC<Kadinlar1LigStatuViewProps> = ({
  totalTeams = 28,
}) => {
  const statuPdfUrl = "https://tvf.org.tr/lig/kadinlar-1-ligi";

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Üst Başlık & PDF Butonu */}
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <Trophy size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                2026-2027 TVF KFC Kadınlar 1. Ligi Resmi Statüsü
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-muted text-ink-2 border border-line font-mono tabular-nums font-bold">
                2 Grup (A & B) • {totalTeams} Kulüp
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Türkiye Voleybol Federasyonu KFC Kadınlar 1. Ligi lig etabı, yarı final/final yükselme ve düşme kuralları
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
              <span className="text-[10px] font-mono text-ink-3">2 Grup • 28 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Lig Etabı (Normal Sezon)</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              İki devreli deplasmanlı lig usulü. Gruplarında <span className="text-amber-400 font-bold">ilk 4 sırayı</span> alan toplam 8 takım Yarı Final&apos;e yükselir.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              8 Takım Yarı Finalde
            </span>
            <span className="text-rose-400 text-[10px] font-medium">Son 2&apos;şer Düşer</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/25">
                2. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">8 Takım (2 Grup)</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Yarı Final Etabı</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Gruplarını 1-4 bitiren takımlar federasyonun belirlediği ilde 4&apos;erli iki gruba ayrılarak tek devreli lig usulü karşılaşır.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <Award size={12} />
              İlk 2&apos;ler Finale
            </span>
            <span className="text-ink-3 text-[10px]">4 Takım Çıkar</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/25">
                3. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">4 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Final Etabı & Yükselme</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              Yarı finallerden gelen 4 takım tek devreli lig usulü oynar. İlk 2 sırayı alan kulüpler <span className="text-amber-400 font-bold">Vodafone Sultanlar Ligi&apos;ne</span> yükselir.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Trophy size={12} />
              2 Takım Yükselir
            </span>
            <span className="text-amber-300 font-bold text-[10px]">Sultanlar Ligi</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded border border-rose-400/25">
                Düşme Hattı
              </span>
              <span className="text-[10px] font-mono text-ink-3">4 Takım</span>
            </div>
            <h3 className="text-sm font-bold text-ink">2. Lig&apos;e Düşme</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              A ve B gruplarını 13. ve 14. sırada tamamlayan son 2&apos;şer takım (toplam 4 kulüp) Kadınlar 2. Ligi&apos;ne düşer.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <ShieldAlert size={12} />
              Toplam 4 Takım
            </span>
            <span className="text-ink-3 text-[10px]">Kadınlar 2. Ligi</span>
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
