"use client";

import React from "react";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface TeamVolleyboxLinkProps {
  teamName: string;
  category?: string;
  className?: string;
  children?: React.ReactNode;
}

export const TeamVolleyboxLink: React.FC<TeamVolleyboxLinkProps> = ({
  teamName,
  category,
  className = "",
  children,
}) => {
  const mapping = getVolleyboxMapping(teamName, category);
  const content = children ?? teamName;

  if (!mapping || !mapping.volleybox_url) {
    return <span className={className}>{content}</span>;
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
      className={`hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      {content}
    </a>
  );
};
