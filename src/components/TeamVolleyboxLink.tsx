"use client";

import React, { useState } from "react";
import Link from "next/link";
import { getVolleyboxMapping } from "@/utils/volleybox";
import { slugify } from "@/utils/slugify";
import { ExternalLink } from "lucide-react";

import Image from "next/image";

interface TeamVolleyboxLinkProps {
  teamName: string;
  category?: string;
  className?: string;
  showLogo?: boolean;
  logoClassName?: string;
  children?: React.ReactNode;
  disableTeamPageLink?: boolean;
}

export const TeamVolleyboxLink: React.FC<TeamVolleyboxLinkProps> = ({
  teamName,
  category,
  className = "",
  showLogo = true,
  logoClassName = "",
  children,
  disableTeamPageLink = false,
}) => {
  const mapping = getVolleyboxMapping(teamName, category);
  
  // Takım adı HER ZAMAN tam ve orijinal haliyle yazılır (A / B takımı ayrımlarını korumak için)
  const displayName = teamName?.trim() || "";
  const content = children ?? displayName;
  const [imgFailed, setImgFailed] = useState(false);

  // Logo source: prefer local_logo, fallback to logo_url
  const logoSrc = showLogo && !imgFailed ? (mapping?.local_logo || mapping?.logo_url) : null;

  const logoElement = logoSrc ? (
    <Image
      src={logoSrc}
      alt={`${displayName} logosu`}
      width={16}
      height={16}
      className={`w-4 h-4 object-contain rounded-full bg-white p-0.5 border border-slate-700 shadow-2xs shrink-0 inline-block align-middle mr-1.5 transition-transform group-hover:scale-110 ${logoClassName}`}
      unoptimized={logoSrc.startsWith("http")}
      onError={() => {
        setImgFailed(true);
      }}
    />
  ) : null;

  const teamSlug = slugify(displayName);

  const isClubLevelOnly = mapping?.confidence === "club_level_only";
  const vbTitle = isClubLevelOnly
    ? mapping?.note || `${displayName} (Kulüp Düzeyi Volleybox Profili)`
    : `${displayName} — Volleybox Takım Profili`;

  const externalVbLink = mapping?.volleybox_url ? (
    <a
      href={mapping.volleybox_url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5 rounded shrink-0 inline-flex items-center ml-1 opacity-70 hover:opacity-100"
      title={vbTitle}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink size={10} />
    </a>
  ) : null;

  if (disableTeamPageLink) {
    return (
      <span className={`inline-flex items-center max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[340px] ${className}`} title={displayName}>
        {logoElement}
        <span className="truncate">{content}</span>
        {externalVbLink}
      </span>
    );
  }

  return (
    <span
      className={`group inline-flex items-center max-w-[180px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[340px] ${className}`}
      title={displayName}
    >
      {logoElement}
      <Link
        href={`/takim/${teamSlug}`}
        className="truncate hover:underline hover:text-primary transition-colors cursor-pointer"
        title={`${displayName} Detay Sayfası`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
      {externalVbLink}
    </span>
  );
};
