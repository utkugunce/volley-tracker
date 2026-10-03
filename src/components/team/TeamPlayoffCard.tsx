import React from "react";
import { Medal } from "lucide-react";
import type { TeamPlayoffInfo } from "@/utils/teamStatsBundle";
import { PLAYOFF_STATUS_LABEL, type PlayoffStatus } from "@/utils/playoffRace";
import { PlayoffRuleNote } from "@/components/stats/PlayoffRuleNote";

const STATUS_STYLE: Record<PlayoffStatus, { badge: string; text: (cutoff: number) => string }> = {
  qualified: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
    text: (c) => `Kalan maçlar nasıl biterse bitsin ilk ${c} içinde kalacak.`,
  },
  eliminated: {
    badge: "bg-form-loss/15 text-form-loss border-form-loss/40",
    text: (c) => `Kalan maçların hepsini kazansa bile ilk ${c}'e giremez.`,
  },
  open: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    text: (c) => `İlk ${c} için yarış matematiksel olarak sürüyor.`,
  },
  unknown: {
    badge: "bg-slate-700/40 text-slate-300 border-slate-600/60",
    text: () => "Grubun fikstürü henüz tamamlanmadığı için kesin durum hesaplanamıyor.",
  },
};

interface TeamPlayoffCardProps {
  info: TeamPlayoffInfo;
}

/** Takımın grubundaki play-off (ilk N) matematiksel durumu. */
export const TeamPlayoffCard: React.FC<TeamPlayoffCardProps> = ({ info }) => {
  const style = STATUS_STYLE[info.status];
  return (
    <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 space-y-2.5" data-testid="team-playoff-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Medal size={12} className="text-primary" />
            <span>Play-off Durumu (İlk {info.cutoff})</span>
          </p>
          <p className="text-xs text-slate-400 truncate">{info.groupName}</p>
        </div>
        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${style.badge}`}>
          {PLAYOFF_STATUS_LABEL[info.status]}
        </span>
      </div>
      <p className="text-sm text-slate-200">{style.text(info.cutoff)}</p>
      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
        <div className="bg-slate-900/60 rounded-lg p-2">
          <dt className="text-[10px] text-slate-400">Sıra</dt>
          <dd className="text-sm font-black text-white">
            {info.rank}/{info.groupSize}
          </dd>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <dt className="text-[10px] text-slate-400">Puan ({info.played} maç)</dt>
          <dd className="text-sm font-black text-white">{info.points}</dd>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2">
          <dt className="text-[10px] text-slate-400">Açıklanan kalan maç</dt>
          <dd className="text-sm font-black text-white">{info.remaining}</dd>
        </div>
        {info.scheduleComplete && (
          <div className="bg-slate-900/60 rounded-lg p-2">
            <dt className="text-[10px] text-slate-400">Ulaşabileceği en çok puan</dt>
            <dd className="text-sm font-black text-white">{info.maxPoints}</dd>
          </div>
        )}
      </dl>
      <PlayoffRuleNote cutoff={info.cutoff} />
    </div>
  );
};
