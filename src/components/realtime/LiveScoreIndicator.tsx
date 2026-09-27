import React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

interface LiveScoreIndicatorProps {
  isConnected: boolean;
  lastUpdate?: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function LiveScoreIndicator({
  isConnected,
  lastUpdate,
  onRefresh,
  isRefreshing = false,
}: LiveScoreIndicatorProps) {
  const getTimeSinceUpdate = () => {
    if (!lastUpdate) return null;
    const seconds = Math.floor((Date.now() - lastUpdate.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s önce`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}dk önce`;
    return `${Math.floor(seconds / 3600)}sa önce`;
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${
          isConnected
            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
            : "bg-red-950/80 text-red-400 border border-red-800"
        }`}
      >
        {isConnected ? (
          <Wifi size={12} className="animate-pulse" />
        ) : (
          <WifiOff size={12} />
        )}
        <span className="font-medium">
          {isConnected ? "Canlı" : "Bağlantı Kesik"}
        </span>
      </div>

      {lastUpdate && (
        <span className="text-slate-500">
          Son güncelleme: {getTimeSinceUpdate()}
        </span>
      )}

      {onRefresh && (
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Yenile"
        >
          <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      )}
    </div>
  );
}
