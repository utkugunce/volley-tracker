"use client";

import React from "react";
import Link from "next/link";
import { setConsentStatus } from "@/components/analytics/AnalyticsConsent";

interface DashboardFooterProps {
  city: string | undefined;
}

export const DashboardFooter: React.FC<DashboardFooterProps> = ({ city }) => {
  const handleResetCookies = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem("av-analytics-consent");
      window.dispatchEvent(new CustomEvent("av-consent-changed", { detail: "undecided" }));
    } catch {
      // ignore
    }
  };

  return (
    <footer className="py-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] sm:pb-4 text-center text-xs text-ink-2 no-print border-t border-line/40 mt-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-semibold text-ink">
          Altyapı Voleybol • {city || "Türkiye"} Genç & Yıldız Kızlar Süper Lig
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] text-ink-2">
          <span>Fikstür & Puan Durumu</span>
          <span className="text-ink-3" aria-hidden="true">•</span>
          <Link
            href="/gizlilik"
            prefetch={false}
            className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded"
          >
            Gizlilik & KVKK
          </Link>
          <span className="text-ink-3" aria-hidden="true">•</span>
          <Link
            href="/dmca"
            prefetch={false}
            className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded"
          >
            DMCA & Telif
          </Link>
          <span className="text-ink-3" aria-hidden="true">•</span>
          <button
            type="button"
            onClick={handleResetCookies}
            className="hover:text-primary transition-colors hover:underline focus:outline-none focus:ring-1 focus:ring-primary rounded cursor-pointer"
          >
            Çerez Ayarları
          </button>
        </div>
      </div>
    </footer>
  );
};
