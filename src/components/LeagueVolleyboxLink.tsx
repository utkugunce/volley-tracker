"use client";

import React from "react";
import { getVolleyboxLeagueMapping } from "@/utils/volleybox";

interface LeagueVolleyboxLinkProps {
  league: string;
  city?: string;
  className?: string;
  children?: React.ReactNode;
}

export const LeagueVolleyboxLink: React.FC<LeagueVolleyboxLinkProps> = ({
  league,
  city,
  className = "",
  children,
}) => {
  const mapping = getVolleyboxLeagueMapping(league, city);
  const content = children ?? league;

  if (!mapping || !mapping.volleybox_url) {
    return <span className={className}>{content}</span>;
  }

  const title = `${mapping.matched_as || league} — Volleybox Turnuva Sayfası`;

  return (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`hover:underline hover:text-amber-400 transition-colors cursor-pointer ${className}`}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      {content}
    </a>
  );
};
