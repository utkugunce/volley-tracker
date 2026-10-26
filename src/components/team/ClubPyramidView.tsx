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
    <div className="mt-4 pt-3.5 border-t border-line space-y-3">
      {/* Başlık */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-ink">
          <GitMerge size={14} className="text-primary" />
          <span>Kulüp Altyapı Piramidi ({pyramid.totalTeams} Takım)</span>
        </div>
        <span className="text-[11px] text-ink-3 font-mono">
          {pyramid.clubName}
        </span>
      </div>

      {/* Piramit Kademeleri */}
      <div className="space-y-2">
        {pyramid.tiers.map((tier) => (
          <div
            key={tier.key}
            className="rounded-lg border border-line bg-surface-muted p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-surface text-ink-2 border border-line">
                {tier.badge} · {tier.title}
              </span>
              <span className="text-[10px] text-ink-3 font-mono tabular-nums">
                {tier.teams.length} takım
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {tier.teams.map((ct) =>
                ct.isCurrent ? (
                  <div
                    key={ct.slug + ct.city}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-primary text-primary-fg"
                    title="Şu an bu takımı görüntülüyorsunuz"
                  >
                    <span>{ct.teamName}</span>
                    {ct.ageCategory && (
                      <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                        {ct.ageCategory}
                      </span>
                    )}
                    {ct.teamBranch && (
                      <span className="bg-black/25 text-white text-[10px] px-1.5 py-0.2 rounded font-bold">
                        {ct.teamBranch}
                      </span>
                    )}
                    <span className="text-[10px] bg-black/25 px-1 rounded text-white font-medium">
                      Mevcut
                    </span>
                  </div>
                ) : (
                  <Link
                    prefetch={false}
                    key={ct.slug + ct.city}
                    href={ct.path}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface text-ink-2 hover:text-ink hover:bg-surface-raised border border-line transition-colors cursor-pointer"
                    title={`${ct.teamName} detay sayfasını aç`}
                  >
                    <span>{ct.teamName}</span>
                    {ct.ageCategory && (
                      <span className="bg-surface-muted text-ink-3 border border-line text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                        {ct.ageCategory}
                      </span>
                    )}
                    {ct.teamBranch && (
                      <span className="bg-surface-muted text-ink-2 border border-line text-[10px] px-1.5 py-0.2 rounded font-bold">
                        {ct.teamBranch}
                      </span>
                    )}
                    {ct.city !== team.city && (
                      <span className="text-[10px] text-ink-3 font-normal">
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

      {/* Kadro Geçişi Yapan Oyuncular */}
      {pyramid.crossoverPlayers.length > 0 && (
        <div className="rounded-lg border border-line bg-surface-muted p-2.5 space-y-2 mt-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-ink">
            <Sparkles size={13} className="text-primary" />
            <span>Kadro Geçişleri & Çifte Kategori Oyuncuları ({pyramid.crossoverPlayers.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pyramid.crossoverPlayers.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs bg-surface border border-line rounded-md p-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-ink truncate">
                      {p.name}
                    </span>
                    {p.position && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-muted text-ink-2 border border-line">
                        {p.position}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-ink-3 truncate">
                    {p.teams.join(" ⇄ ")}
                  </div>
                </div>
                {p.profileUrl && (
                  <a
                    href={p.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-ink-3 hover:text-primary transition-colors flex-shrink-0"
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
