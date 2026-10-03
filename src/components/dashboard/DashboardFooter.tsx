import React from "react";

interface DashboardFooterProps {
  city: string | undefined;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ city }) => (
  <footer className="py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-4 text-center text-xs text-ink-2 no-print">
    <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <p className="font-semibold text-ink">
        Altyapı Voleybol • {city || "Türkiye"} Genç & Yıldız Kızlar Süper Lig
      </p>
      <div className="flex items-center gap-3 text-[11px] text-ink-2">
        <span>Fikstür & Puan Durumu</span>
        <span className="text-ink-2">•</span>
        <span>Sofascore Voleybol Arayüz Mimarisi</span>
      </div>
    </div>
  </footer>
);
