import React from "react";
import { MapPin, Navigation } from "lucide-react";
import type { TeamHall } from "@/utils/teamStats";

interface TeamHallsCardProps {
  halls: TeamHall[];
}

/** Takımın maç oynadığı salonlar. Maçlarda salon bilgisi yoksa bölüm gizlenir. */
export const TeamHallsCard: React.FC<TeamHallsCardProps> = ({ halls }) => {
  if (halls.length === 0) return null;

  return (
    <section aria-labelledby="team-halls-title" className="space-y-3">
      <h2 id="team-halls-title" className="text-lg font-bold text-white flex items-center gap-2">
        <MapPin size={18} className="text-primary" />
        <span>Salon Bilgisi</span>
      </h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {halls.map((h) => (
          <li key={h.name} className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white break-words">{h.details?.name ?? h.name}</p>
                <p className="text-[11px] text-slate-400">
                  {h.city ? `${h.city} • ` : ""}
                  {h.matchCount} maç
                  {h.details?.district ? ` • ${h.details.district}` : ""}
                </p>
              </div>
              <a
                href={h.navigationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors"
              >
                <Navigation size={11} />
                <span>Yol Tarifi</span>
              </a>
            </div>
            {h.details?.metroTips && <p className="text-xs text-slate-300">🚇 {h.details.metroTips}</p>}
            {h.details?.parking && <p className="text-xs text-slate-300">🅿️ {h.details.parking}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
};
