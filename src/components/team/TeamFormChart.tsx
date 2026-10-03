import React from "react";
import { Activity } from "lucide-react";
import type { FormPoint } from "@/utils/teamStats";

interface TeamFormChartProps {
  series: FormPoint[];
}

const W = 320;
const H = 96;
const PAD_X = 16;
const PAD_Y = 14;

/**
 * Son maçların (en fazla 10) set farkına göre maç puanı (0–3) grafiği.
 * Saf SVG; istemci JS'i gerektirmez. En az 2 maç yoksa hiçbir şey çizmez.
 */
export const TeamFormChart: React.FC<TeamFormChartProps> = ({ series }) => {
  if (series.length < 2) return null;

  const stepX = (W - PAD_X * 2) / (series.length - 1);
  const yFor = (points: number) => PAD_Y + ((3 - points) / 3) * (H - PAD_Y * 2);
  const coords = series.map((p, i) => ({ x: PAD_X + i * stepX, y: yFor(p.points), p }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const total = series.reduce((sum, p) => sum + p.points, 0);
  const wins = series.filter((p) => p.result === "W").length;

  return (
    <section aria-labelledby="team-form-title" className="space-y-3">
      <h2 id="team-form-title" className="text-lg font-bold text-white flex items-center gap-2">
        <Activity size={18} className="text-primary" />
        <span>Form Grafiği</span>
        <span className="text-xs font-normal text-slate-400">(son {series.length} maç)</span>
      </h2>
      <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 shadow-md">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto max-h-40"
          role="img"
          aria-label={`Son ${series.length} maçta ${wins} galibiyet, toplam ${total} maç puanı`}
        >
          {[0, 1, 2, 3].map((v) => (
            <g key={v}>
              <line x1={PAD_X} x2={W - PAD_X} y1={yFor(v)} y2={yFor(v)} stroke="#1B3550" strokeWidth="1" strokeDasharray="3 4" />
              <text x={2} y={yFor(v) + 3} fontSize="8" fill="#94a3b8">
                {v}
              </text>
            </g>
          ))}
          <path d={path} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinejoin="round" />
          {coords.map(({ x, y, p }) => (
            <circle key={p.id} cx={x} cy={y} r="4.5" fill={p.result === "W" ? "#9BE15D" : "#f87171"}>
              <title>{`${p.date} • ${p.opponent} • ${p.score} (${p.result === "W" ? "G" : "M"}, ${p.points} puan)`}</title>
            </circle>
          ))}
        </svg>
        <p className="mt-2 text-[11px] text-slate-400">
          Puan: 3 = farklı galibiyet (3-0, 3-1), 2 = 3-2 galibiyet, 1 = 2-3 mağlubiyet, 0 = diğer mağlubiyetler. Eski maç solda.
        </p>
      </div>
    </section>
  );
};
