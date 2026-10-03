import React from "react";
import { Play, Pause, Circle } from "lucide-react";

interface LiveMatchScoreProps {
  homeScore: number | null;
  awayScore: number | null;
  setScores: string[];
  status: string;
  isLive?: boolean;
}

export function LiveMatchScore({
  homeScore,
  awayScore,
  setScores,
  status,
  isLive = false,
}: LiveMatchScoreProps) {
  const getStatusIcon = () => {
    switch (status) {
      case "live":
        return <Play size={12} className="text-red-500" />;
      case "finished":
        return <Circle size={12} className="text-emerald-500" />;
      case "postponed":
        return <Pause size={12} className="text-amber-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "live":
        return "Canlı";
      case "finished":
        return "Bitti";
      case "postponed":
        return "Ertelendi";
      case "upcoming":
        return "Gelecek";
      default:
        return status;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "live":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "finished":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "postponed":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/40";
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Status */}
      <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Main Score */}
      {(homeScore !== null || awayScore !== null) && (
        <div className="flex items-center gap-2 font-mono font-scoreboard tabular-nums font-bold text-lg">
          <span className="text-white">{homeScore ?? 0}</span>
          <span className="text-slate-500">-</span>
          <span className="text-white">{awayScore ?? 0}</span>
        </div>
      )}

      {/* Set Scores */}
      {setScores && setScores.length > 0 && (
        <div className="flex items-center gap-1 text-xs font-mono font-scoreboard tabular-nums text-slate-400">
          {setScores.map((set, index) => (
            <span key={index} className="px-1.5 py-0.5 bg-slate-800 rounded">
              {set}
            </span>
          ))}
        </div>
      )}

      {/* Live Indicator */}
      {isLive && status === "live" && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-xs font-medium">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span>CANLI</span>
        </div>
      )}
    </div>
  );
}
