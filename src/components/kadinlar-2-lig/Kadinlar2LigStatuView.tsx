"use client";

import React from "react";
import {
  FileText,
  ExternalLink,
  Trophy,
  CheckCircle2,
  Award,
  Info,
} from "lucide-react";

interface Kadinlar2LigStatuViewProps {
  totalTeams?: number;
}

export const Kadinlar2LigStatuView: React.FC<Kadinlar2LigStatuViewProps> = ({
  totalTeams = 163,
}) => {
  const statuPdfUrl =
    "https://tvf.org.tr/_dosyalar/Liglerin_Statu_Arsivi/2026-2027/2026-2027_UzmanPosta2Lig_Kadinlar_Statusu.pdf";

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Üst Başlık & PDF Butonu */}
      <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
            <FileText size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                2026-2027 TVF Kadınlar 2. Lig Resmi Statüsü
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-surface-muted text-ink-2 border border-line font-mono tabular-nums font-bold">
                16 Grup • {totalTeams} Kulüp
              </span>
            </div>
            <p className="text-xs text-ink-3 mt-0.5">
              Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi lig etabı, çeyrek/yarı/final aşamaları ve yükselme/düşme kuralları
            </p>
          </div>
        </div>

        <a
          href={statuPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-primary-fg text-xs font-bold transition-colors shrink-0"
        >
          <span>Resmi TVF Statü PDF&apos;i</span>
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
              <span className="text-[10px] font-mono text-ink-3">16 Grup</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Lig Etabı (Grup Maçları)</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              İki devreli deplasmanlı lig usulü. Her grubun <span className="text-done font-bold">ilk 2 takımı</span> Çeyrek Final&apos;e yükselir.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-done font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              32 Takım Yükselir
            </span>
            <span className="text-form-loss text-[10px] font-medium">Son 2 Düşer</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 bg-surface-muted px-2 py-0.5 rounded border border-line">
                2. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">8 Grup</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Çeyrek Final Etabı</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              32 takım 4&apos;erli 8 gruba (A-H) ayrılır. Tarafsız sahada tek devreli lig oynanır. İlk 2&apos;ler Yarı Final&apos;e çıkar.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-done font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              16 Takım Yükselir
            </span>
            <span className="text-ink-3 text-[10px]">Tek Devreli</span>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-2 bg-surface-muted px-2 py-0.5 rounded border border-line">
                3. Aşama
              </span>
              <span className="text-[10px] font-mono text-ink-3">4 Grup</span>
            </div>
            <h3 className="text-sm font-bold text-ink">Yarı Final Etabı</h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              16 takım 4&apos;erli 4 gruba (A-D) ayrılır. Tek devreli lig usulü sonucunda ilk 2&apos;ler Final Etabı&apos;na kalır.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-done font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              8 Takım Yükselir
            </span>
            <span className="text-ink-3 text-[10px]">Tek Devreli</span>
          </div>
        </div>

        <div className="bg-surface border border-line-strong rounded-xl p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/15 px-2 py-0.5 rounded border border-primary/30">
                4. Aşama (Final)
              </span>
              <span className="text-[10px] font-mono text-primary font-bold">2 Grup</span>
            </div>
            <h3 className="text-sm font-bold text-ink flex items-center gap-1.5">
              <Trophy size={14} className="text-primary shrink-0" />
              <span>Final Etabı</span>
            </h3>
            <p className="text-xs text-ink-2 leading-relaxed">
              8 takım 4&apos;erli 2 gruba ayrılır. Her iki grubun <span className="text-ink font-bold">1. ve 2.</span> olan takımları <span className="text-primary font-bold">1. Lig&apos;e</span> terfi eder!
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-line flex items-center justify-between text-[11px]">
            <span className="text-primary font-bold flex items-center gap-1">
              🏆 4 Takım 1. Lig&apos;e
            </span>
            <span className="text-ink-3 text-[10px]">Şampiyonlar</span>
          </div>
        </div>
      </div>

      {/* 3. Puanlama & Sıralama Kriterleri ve Pilot Takım Kuralı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2.5">
            <Award size={15} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
              Resmi TVF Puanlama Sistemi (Madde 10)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-surface-muted border border-line">
              <span className="font-bold text-done block mb-0.5">3-0 veya 3-1 Galibiyet</span>
              <span className="text-ink-2 text-[11px]">Galip takıma <strong className="text-ink font-mono">3 Puan</strong> verilir.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-muted border border-line">
              <span className="font-bold text-ink block mb-0.5">3-2 Galibiyet</span>
              <span className="text-ink-2 text-[11px]">Galip <strong className="text-ink font-mono">2 Puan</strong>, Mağlup <strong className="text-ink font-mono">1 Puan</strong> alır.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-muted border border-line">
              <span className="font-bold text-ink-3 block mb-0.5">0-3 veya 1-3 Mağlubiyet</span>
              <span className="text-ink-3 text-[11px]">Mağlup takıma <strong className="text-ink-2 font-mono">0 Puan</strong> verilir.</span>
            </div>
            <div className="p-2.5 rounded-lg bg-surface-muted border border-line">
              <span className="font-bold text-form-loss block mb-0.5">Hükmen Mağlubiyet</span>
              <span className="text-ink-2 text-[11px]">Galip <strong className="font-mono">3 Puan</strong>, Mağluptan <strong className="font-mono">-3 Puan</strong> düşülür.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-line">
            <span className="text-[11px] font-bold text-ink-3 block mb-1">
              Sıralama Öncelik Kriterleri:
            </span>
            <ol className="list-decimal list-inside text-[11px] text-ink-2 space-y-0.5 font-medium">
              <li>Kazanılmış maç sayısı (Galibiyet)</li>
              <li>Toplam puan</li>
              <li>Set averajı / oranı (Alınan Set ÷ Verilen Set)</li>
              <li>Sayı averajı / oranı (Alınan Sayı ÷ Verilen Sayı)</li>
              <li>Kendi aralarındaki maçlar (İkili averaj: Galibiyet, Puan, Set, Sayı)</li>
            </ol>
          </div>
        </div>

        <div className="bg-surface border border-line rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-line pb-2.5">
            <Info size={15} className="text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wider">
              Kritik Statü Maddeleri
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-lg bg-surface-muted border border-line">
              <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
                <span>Madde 2.8: 1. Lig Pilot Takımı Kısıtlaması</span>
              </div>
              <p className="text-[11px] text-ink-2 leading-relaxed">
                Kadınlar 1. Ligi&apos;nde takımı bulunan bir kulübün 2. Lig&apos;deki takımı ilk 2&apos;ye girerek Çeyrek Final hakkı kazansa dahi <strong className="text-ink">Çeyrek Final etabına katılamaz</strong>. Bu hak sıralamadaki sonraki takıma devreder.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-muted border border-line">
              <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
                <span>Madde 2.4: Küme Düşme Hattı</span>
              </div>
              <p className="text-[11px] text-ink-2 leading-relaxed">
                Lig etabı sonunda gruplarında puan cetvelinde <strong className="text-form-loss">son iki sırada yer alan takımlar</strong> bir alt lige (Bölgesel Lig) düşer.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-surface-muted border border-line">
              <div className="flex items-center gap-1.5 font-bold text-ink mb-1">
                <span>Madde 6.3 & 9.1: Yaş Sınırı ve Saha Ölçüleri</span>
              </div>
              <p className="text-[11px] text-ink-2 leading-relaxed">
                1. Lig kulüplerinin 2. Lig takım kadrosu yalnızca 21 yaş ve altı sporculardan oluşur. File yüksekliği 2,24 m&apos;dir ve Mikasa V200W resmi maç topu kullanılır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
