"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";
import { getLeagueRoute } from "@/utils/leagueRoutes";

interface LeagueVolleyboxLinkProps {
  league: string;
  city?: string;
  className?: string;
  children?: React.ReactNode;
  showExternalIcon?: boolean;
}

export const LeagueVolleyboxLink: React.FC<LeagueVolleyboxLinkProps> = ({
  league,
  city,
  className = "",
  children,
  showExternalIcon = false,
}) => {
  const content = children ?? league;
  const internalRoute = getLeagueRoute(league, city);
  const mapping = getVolleyboxLeagueMapping(league, city);

  if (!showExternalIcon || !mapping?.volleybox_url) {
    return (
      <Link
        href={internalRoute}
        className={`hover:underline hover:text-amber-400 transition-colors cursor-pointer truncate ${className}`}
        title={`${league} Detaylı Lig Sayfası (Fikstür, Puan Durumu, İstatistikler)`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 max-w-full">
      <Link
        href={internalRoute}
        className={`hover:underline hover:text-amber-400 transition-colors cursor-pointer truncate ${className}`}
        title={`${league} Detaylı Lig Sayfası (Fikstür, Puan Durumu, İstatistikler)`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
      <a
        href={mapping.volleybox_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-emerald-400/70 hover:text-emerald-300 p-0.5 rounded transition-colors shrink-0"
        title={`${mapping.matched_as || league} — Turnuva Sayfası`}
        onClick={(e) => e.stopPropagation()}
      >
        <ExternalLink size={11} />
      </a>
    </span>
  );
};
