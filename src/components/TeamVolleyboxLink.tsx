"use client";

import React, { useState } from "react";
import { getVolleyboxMapping } from "@/utils/volleybox";

interface TeamVolleyboxLinkProps {
  teamName: string;
  category?: string;
  className?: string;
  showLogo?: boolean;
  logoClassName?: string;
  children?: React.ReactNode;
}

export const TeamVolleyboxLink: React.FC<TeamVolleyboxLinkProps> = ({
  teamName,
  category,
  className = "",
  showLogo = true,
  logoClassName = "",
  children,
}) => {
  const mapping = getVolleyboxMapping(teamName, category);
  
  // Takım adı HER ZAMAN tam ve orijinal haliyle yazılır (A / B takımı ayrımlarını korumak için)
  const displayName = teamName?.trim() || "";
  const content = children ?? displayName;
  const [imgFailed, setImgFailed] = useState(false);

  // Logo source: prefer local_logo, fallback to logo_url
  const logoSrc = showLogo && !imgFailed ? (mapping?.local_logo || mapping?.logo_url) : null;

  const logoElement = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={`${displayName} logosu`}
      className={`w-4 h-4 object-contain rounded-full bg-white p-0.5 border border-slate-200/90 shadow-2xs shrink-0 inline-block align-middle mr-1.5 transition-transform group-hover:scale-110 ${logoClassName}`}
      loading="lazy"
      onError={() => {
        setImgFailed(true);
      }}
    />
  ) : null;

  if (!mapping || !mapping.volleybox_url) {
    return (
      <span className={`inline-flex items-center max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[340px] ${className}`} title={displayName}>
        {logoElement}
        <span className="truncate">{content}</span>
      </span>
    );
  }

  const isClubLevelOnly = mapping.confidence === "club_level_only";
  const title = isClubLevelOnly
    ? mapping.note || `${displayName} (Kulüp Düzeyi Volleybox Profili)`
    : `${displayName} — Volleybox Takım Profili`;

  return (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[340px] hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      {logoElement}
      <span className="truncate">{content}</span>
    </a>
  );
};
