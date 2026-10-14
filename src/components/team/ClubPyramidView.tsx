"use client";

import React from "react";
import Link from "next/link";
import { GitMerge, ExternalLink, Sparkles } from "lucide-react";
import type { TeamDetails, ClubPyramidData } from "@/utils/team/types";

interface ClubPyramidViewProps {
  team: TeamDetails;
  pyramid?: ClubPyramidData | null;
}

export const ClubPyramidView: React.FC<ClubPyramidViewProps> = ({ team, pyramid: propPyramid }) => {
  const pyramid = propPyramid ?? team.pyramid;

  if (!pyramid || pyramid.tiers.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 pt-3.5 border-t border-slate-800/80 space-y-3">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <GitMerge size={14} className="text-emerald-400" />
          <span>Kulüp Altyapı Piramidi ({pyramid.totalTeams} Takım)</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {pyramid.clubName}
        </span>
      </div>

      {/* Piramit Kademeleri (Senior -> U18 -> U16 -> U14/U12 -> Diğer) */}
      <div className="space-y-2.5">
        {pyramid.tiers.map((tier) => (
          <div
            key={tier.key}
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5 space-y-1.5 transition-colors hover:border-slate-700/80"
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${tier.badgeColor}`}
              >
                {tier.badge} · {tier.title}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {tier.teams.length} takım
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {tier.teams.map((ct) =>
                ct.isCurrent ? (
                  <div
                    key={ct.slug + ct.city}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-selected-strong text-white shadow-glow-selected"
                    title="Şu an bu takımı görüntülüyorsunuz"
                  >
                    <span>{ct.teamName}</span>
                    {ct.ageCategory && (
                      <span className="bg-black/30 text-white text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                        {ct.ageCategory}
                      </span>
                    )}
                    {ct.teamBranch && (
                      <span className="bg-canvas/40 text-white text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                        {ct.teamBranch}
                      </span>
                    )}
                    <span className="text-[10px] bg-canvas/40 px-1 rounded text-white font-medium">
                      Mevcut
                    </span>
                  </div>
                ) : (
                  <Link
                    prefetch={false}
                    key={ct.slug + ct.city}
                    href={ct.path}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold glass-panel text-slate-200 hover:text-white hover:bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-all shadow-xs active:scale-95 cursor-pointer"
                    title={`${ct.teamName} detay sayfasını aç`}
                  >
                    <span>{ct.teamName}</span>
                    {ct.ageCategory && (
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold">
                        {ct.ageCategory}
                      </span>
                    )}
                    {ct.teamBranch && (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
                        {ct.teamBranch}
                      </span>
                    )}
                    {ct.city !== team.city && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({ct.city})
                      </span>
                    )}
                  </Link>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Kadro Geçişi Yapan Oyuncular (Çifte Kategori) */}
      {pyramid.crossoverPlayers.length > 0 && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-2.5 space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
            <Sparkles size={13} className="text-purple-400" />
            <span>Kadro Geçişleri & Çifte Kategori Oyuncuları ({pyramid.crossoverPlayers.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pyramid.crossoverPlayers.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-slate-900/70 border border-purple-500/20 rounded-lg p-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-100 truncate">
                      {p.name}
                    </span>
                    {p.position && (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-800 text-purple-300 border border-purple-500/30">
                        {p.position}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {p.teams.join(" ⇄ ")}
                  </div>
                </div>
                {p.profileUrl && (
                  <a
                    href={p.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-slate-400 hover:text-purple-300 transition-colors flex-shrink-0"
                    title="Volleybox profili"
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
