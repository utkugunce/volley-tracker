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
  // Yaş kategorisi (U16/U18 vb.) zaten lig başlığından belli — takım adından kaldır
  const rawName = mapping?.matched_as || teamName;
  const displayName = rawName.replace(/\s+U\d{2}$/, "").trim();
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
      <span className={`inline-flex items-center max-w-[105px] sm:max-w-[125px] md:max-w-[150px] lg:max-w-[220px] ${className}`} title={displayName}>
        {logoElement}
        <span className="truncate">{content}</span>
      </span>
    );
  }

  const isClubLevelOnly = mapping.confidence === "club_level_only";
  const title = isClubLevelOnly
    ? mapping.note || "Bu bağlantı kulübün profesyonel takımına gider, bu genç takımın kendi profili değildir"
    : `${displayName} — Volleybox Takım Profili`;

  return (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center max-w-[105px] sm:max-w-[125px] md:max-w-[150px] lg:max-w-[220px] hover:underline hover:text-primary transition-colors cursor-pointer ${className}`}
      title={title}
      onClick={(e) => e.stopPropagation()}
    >
      {logoElement}
      <span className="truncate">{content}</span>
    </a>
  );
};
