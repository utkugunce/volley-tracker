"use client";

import React from "react";
import {
  FileText,
  ExternalLink,
  Trophy,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Layers,
  Award,
  Sparkles,
  Info,
} from "lucide-react";

export const Kadinlar2LigStatuView: React.FC = () => {
  const statuPdfUrl =
    "https://tvf.org.tr/_dosyalar/Liglerin_Statu_Arsivi/2026-2027/2026-2027_UzmanPosta2Lig_Kadinlar_Statusu.pdf";

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* 1. Üst Başlık & PDF Butonu */}
      <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0 shadow-xs">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                2026-2027 TVF Kadınlar 2. Lig Resmi Statüsü
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                16 Grup • 167 Kulüp
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Türkiye Voleybol Federasyonu Uzman Posta Kadınlar 2. Ligi lig etabı, çeyrek/yarı/final aşamaları ve yükselme/düşme kuralları
            </p>
          </div>
        </div>

        <a
          href={statuPdfUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-glow-red transition-all active:scale-95 shrink-0"
        >
          <span>Resmi TVF Statü PDF'i</span>
          <ExternalLink size={13} />
        </a>
      </div>

      {/* 2. Lig Aşamaları & Yol Haritası (Timeline Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Aşama 1: Lig Etabı */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-500/30">
                1. Aşama
              </span>
              <span className="text-[10px] font-mono text-slate-400">16 Grup</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">Lig Etabı (Grup Maçları)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              İki devreli deplasmanlı lig usulü. Her grubun <span className="text-emerald-400 font-bold">ilk 2 takımı</span> Çeyrek Final'e yükselir.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              32 Takım Yükselir
            </span>
            <span className="text-rose-400 text-[10px] font-medium">Son 2 Düşer</span>
          </div>
        </div>

        {/* Aşama 2: Çeyrek Final */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
                2. Aşama
              </span>
              <span className="text-[10px] font-mono text-slate-400">8 Grup</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">Çeyrek Final Etabı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              32 takım 4'erli 8 gruba (A-H) ayrılır. Tarafsız sahada tek devreli lig oynanır. İlk 2'ler Yarı Final'e çıkar.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              16 Takım Yükselir
            </span>
            <span className="text-slate-500 text-[10px]">Tek Devreli</span>
          </div>
        </div>

        {/* Aşama 3: Yarı Final */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col justify-between relative overflow-hidden group">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 bg-sky-950/40 px-2 py-0.5 rounded-md border border-sky-500/30">
                3. Aşama
              </span>
              <span className="text-[10px] font-mono text-slate-400">4 Grup</span>
            </div>
            <h3 className="text-sm font-extrabold text-white">Yarı Final Etabı</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              16 takım 4'erli 4 gruba (A-D) ayrılır. Tek devreli lig usulü sonucunda ilk 2'ler Final Etabı'na kalır.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={12} />
              8 Takım Yükselir
            </span>
            <span className="text-slate-500 text-[10px]">Tek Devreli</span>
          </div>
        </div>

        {/* Aşama 4: Final Etabı */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 shadow-card flex flex-col justify-between relative overflow-hidden group bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/40">
                4. Aşama (Final)
              </span>
              <span className="text-[10px] font-mono text-amber-400 font-bold">2 Grup</span>
            </div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400 shrink-0" />
              <span>Final Etabı</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              8 takım 4'erli 2 gruba ayrılır. Her iki grubun <span className="text-amber-300 font-bold">1. ve 2.</span> olan takımları <span className="text-white font-black underline decoration-amber-400">1. Lig'e</span> terfi eder!
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-extrabold flex items-center gap-1">
              🏆 4 Takım 1. Lig'e
            </span>
            <span className="text-slate-400 text-[10px]">Şampiyonlar</span>
          </div>
        </div>
      </div>

      {/* 3. Puanlama & Sıralama Kriterleri ve Pilot Takım Kuralı */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Puanlama Sistemi (Madde 10) */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <Award size={16} className="text-amber-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              Resmi TVF Puanlama Sistemi (Madde 10)
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-emerald-400 block mb-0.5">3-0 veya 3-1 Galibiyet</span>
              <span className="text-slate-300 text-[11px]">Galip takıma <strong className="text-white font-mono">3 Puan</strong> verilir.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-amber-400 block mb-0.5">3-2 Galibiyet</span>
              <span className="text-slate-300 text-[11px]">Galip <strong className="text-white font-mono">2 Puan</strong>, Mağlup <strong className="text-white font-mono">1 Puan</strong> alır.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="font-bold text-slate-400 block mb-0.5">0-3 veya 1-3 Mağlubiyet</span>
              <span className="text-slate-400 text-[11px]">Mağlup takıma <strong className="text-slate-300 font-mono">0 Puan</strong> verilir.</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30">
              <span className="font-bold text-rose-400 block mb-0.5">Hükmen Mağlubiyet</span>
              <span className="text-rose-200 text-[11px]">Galip <strong className="font-mono">3 Puan</strong>, Mağluptan <strong className="font-mono">-3 Puan</strong> düşülür.</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <span className="text-[11px] font-bold text-slate-400 block mb-1">
              Sıralama Öncelik Kriterleri:
            </span>
            <ol className="list-decimal list-inside text-[11px] text-slate-300 space-y-0.5 font-medium">
              <li>Kazanılmış maç sayısı (Galibiyet)</li>
              <li>Toplam puan</li>
              <li>Set averajı / oranı (Alınan Set ÷ Verilen Set)</li>
              <li>Sayı averajı / oranı (Alınan Sayı ÷ Verilen Sayı)</li>
              <li>Kendi aralarındaki maçlar (İkili averaj: Galibiyet, Puan, Set, Sayı)</li>
            </ol>
          </div>
        </div>

        {/* Önemli Statü Notları (Madde 2.4, 2.8, 6.3) */}
        <div className="glass-panel border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2.5">
            <Info size={16} className="text-sky-400" />
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider">
              Kritik Statü Maddeleri
            </h3>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-amber-300 mb-1">
                <span>Madde 2.8: 1. Lig Pilot Takımı Kısıtlaması</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Kadınlar 1. Ligi'nde takımı bulunan bir kulübün 2. Lig'deki takımı ilk 2'ye girerek Çeyrek Final hakkı kazansa dahi <strong>Çeyrek Final etabına katılamaz</strong>. Bu hak sıralamadaki sonraki takıma devreder.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-rose-400 mb-1">
                <span>Madde 2.4: Küme Düşme Hattı</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Lig etabı sonunda gruplarında puan cetvelinde <strong className="text-rose-300">son iki sırada yer alan takımlar</strong> bir alt lige (Bölgesel Lig) düşer.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-1.5 font-bold text-slate-200 mb-1">
                <span>Madde 6.3 & 9.1: Yaş Sınırı ve Saha Ölçüleri</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                1. Lig kulüplerinin 2. Lig takım kadrosu yalnızca 21 yaş ve altı sporculardan oluşur. File yüksekliği 2,24 m'dir ve Mikasa V200W resmi maç topu kullanılır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
