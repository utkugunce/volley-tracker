import React from "react";
import { Wifi } from "lucide-react";

interface LiveMatchBannerProps {
  count: number;
}

/** Canlı Skor Göstergesi */
export const LiveMatchBanner: React.FC<LiveMatchBannerProps> = ({ count }) => (
  <div className="mx-4 mt-2 flex items-center gap-2 px-3 py-2 bg-red-950/80 border border-red-800 rounded-lg">
    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
    <span className="text-xs font-medium text-red-400">
      {count} Canlı Maç
    </span>
    <Wifi size={12} className="text-red-400" />
  </div>
);
