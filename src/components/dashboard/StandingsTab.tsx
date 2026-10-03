"use client";

import React from "react";
import dynamic from "next/dynamic";
import { TabViewLoading } from "@/components/dashboard/TabViewLoading";
import type { FixturesData } from "@/types/fixture";

const StandingsTable = dynamic(
  () => import("@/components/StandingsTable").then((mod) => mod.StandingsTable),
  { loading: TabViewLoading }
);

interface StandingsTabProps {
  data: FixturesData | undefined;
  activeStandings: NonNullable<FixturesData["standings"]>;
}

/** PUAN DURUMU SEKMESİ */
export const StandingsTab: React.FC<StandingsTabProps> = ({ data, activeStandings }) => (
  <div className="space-y-4">
    <h1 className="font-display text-lg sm:text-xl font-bold text-ink">
      {data?.city && data.city !== "Tüm İller"
        ? `${data.city} Puan Durumu · Genç & Yıldız Kızlar Süper Lig`
        : "Puan Durumu · Genç & Yıldız Kızlar Süper Lig"}
    </h1>
    {Object.keys(activeStandings).length > 0 ? (
      <StandingsTable
        standingsData={activeStandings}
        city={data?.city}
        matches={data?.matches || []}
      />
    ) : (
      <div className="text-center py-12 bg-gradient-to-br from-canvas via-surface-muted to-panel border border-slate-800 rounded-2xl p-6 max-w-md mx-auto my-8 shadow-xl">
        <p className="text-sm font-semibold text-slate-300">
          TVF {data?.city || "Bu İl"} için henüz puan durumu tablosu oluşturulmamıştır.
        </p>
      </div>
    )}
  </div>
);
