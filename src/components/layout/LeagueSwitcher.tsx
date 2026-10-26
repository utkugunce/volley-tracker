"use client";

import React from "react";
import Link from "next/link";

export type ActiveLeagueKey = "sultanlar" | "1-lig" | "2-lig" | "altyapi";

interface LeagueSwitcherProps {
  activeLeague: ActiveLeagueKey;
  className?: string;
}

export const LeagueSwitcher: React.FC<LeagueSwitcherProps> = ({
  activeLeague,
  className = "",
}) => {
  const leagues: { key: ActiveLeagueKey; label: string; href: string; title: string }[] = [
    {
      key: "sultanlar",
      label: "Sultanlar Ligi",
      href: "/sultanlar-ligi",
      title: "Vodafone Sultanlar Ligi — Canlı Puan Durumu, Fikstür & Sonuçlar",
    },
    {
      key: "1-lig",
      label: "1. Lig",
      href: "/kadinlar-1-ligi",
      title: "KFC Kadınlar 1. Ligi (A & B Grubu) — Puan Durumu & Fikstür",
    },
    {
      key: "2-lig",
      label: "2. Lig",
      href: "/kadinlar-2-ligi",
      title: "Uzman Posta Kadınlar 2. Ligi (16 Grup) — Puan Durumu & Fikstür",
    },
    {
      key: "altyapi",
      label: "Altyapı (81 İl)",
      href: "/",
      title: "TVF Resmi 81 İl Altyapı Voleybol Ligleri & Fikstürleri",
    },
  ];

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-lg bg-surface-muted border border-line text-xs font-semibold ${className}`}
      role="group"
      aria-label="Lig Seçici"
    >
      {leagues.map((item) => {
        const isActive = activeLeague === item.key;
        if (isActive) {
          return (
            <span
              key={item.key}
              className="px-2.5 py-1 rounded-md bg-surface text-ink font-bold tracking-tight shadow-xs whitespace-nowrap cursor-default"
            >
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.key}
            href={item.href}
            prefetch={false}
            className="px-2.5 py-1 rounded-md text-ink-3 hover:text-ink transition-colors whitespace-nowrap"
            title={item.title}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
};
