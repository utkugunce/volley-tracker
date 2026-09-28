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
  showExternalIcon = true,
}) => {
  const content = children ?? league;
  const internalRoute = getLeagueRoute(league, city);
  const mapping = getVolleyboxLeagueMapping(league, city);

  const externalVbLink = showExternalIcon && mapping?.volleybox_url ? (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded shrink-0 inline-flex items-center ml-1 opacity-70 hover:opacity-100"
      title={`${mapping.matched_as || league} — Volleybox Turnuva Sayfası`}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink size={11} />
    </a>
  ) : null;

  return (
    <span className="inline-flex items-center max-w-full">
      <Link
        href={internalRoute}
        className={`hover:underline hover:text-amber-400 transition-colors cursor-pointer truncate ${className}`}
        title={`${league} Detaylı Lig Sayfası (Fikstür, Puan Durumu, İstatistikler)`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
      {externalVbLink}
    </span>
  );
};
