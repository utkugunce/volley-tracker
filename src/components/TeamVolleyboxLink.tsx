"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface TeamVolleyboxLinkProps {
  teamName: string;
  category?: string;
  className?: string;
}

export const TeamVolleyboxLink: React.FC<TeamVolleyboxLinkProps> = ({
  teamName,
  category,
  className = "",
}) => {
  const mapping = getVolleyboxMapping(teamName, category);

  if (!mapping || !mapping.volleybox_url) {
    return null;
  }

  const isClubLevelOnly = mapping.confidence === "club_level_only";
  const title = isClubLevelOnly
    ? mapping.note || "Bu bağlantı kulübün profesyonel takımına gider, bu genç takımın kendi profili değildir"
    : `${mapping.matched_as || teamName} — Volleybox Takım Profili`;

  return (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center ml-1.5 text-slate-400 hover:text-primary transition-colors align-middle no-print ${className}`}
      title={title}
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink size={12} className="shrink-0 stroke-[2.2]" />
    </a>
  );
};
