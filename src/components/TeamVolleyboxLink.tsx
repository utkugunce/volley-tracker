"use client";

import React from "react";
import Link from "next/link";
import { getVolleyboxMapping, normalizeCitySlug } from "@/utils/volleybox";
import { slugify } from "@/utils/slugify";
import { ExternalLink, Star } from "lucide-react";
import { useFavorites } from "@/utils/useFavorites";
import { triggerHaptic } from "@/utils/haptics";

import { TeamBadge } from "./TeamBadge";

interface TeamVolleyboxLinkProps {
  teamName: string;
  category?: string;
  city?: string;
  className?: string;
  showLogo?: boolean;
  logoClassName?: string;
  children?: React.ReactNode;
  disableTeamPageLink?: boolean;
  showFavoriteButton?: boolean;
}

export const TeamVolleyboxLink: React.FC<TeamVolleyboxLinkProps> = ({
  teamName,
  category,
  city,
  className = "",
  showLogo = true,
  logoClassName = "",
  children,
  disableTeamPageLink = false,
  showFavoriteButton = true,
}) => {
  const mapping = getVolleyboxMapping(teamName, category, undefined, city);
  
  // Sitede yer alan tüm takım isimleri Volleybox'taki resmi profiliyle (matched_as) aynı gösterilir
  const volleyboxName = mapping?.matched_as?.trim();
  const displayName = volleyboxName || teamName?.trim() || "";
  const content =
    typeof children === "string" && children.trim() === teamName?.trim()
      ? displayName
      : children ?? displayName;

  const logoElement = showLogo ? (
    <TeamBadge name={displayName} size="xs" className={`inline-flex mr-1.5 align-middle ${logoClassName}`} />
  ) : null;

  const teamSlug = slugify(displayName);
  const cityQuery = city ? `?sehir=${normalizeCitySlug(city)}` : "";

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

  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(displayName);

  const starElement = showFavoriteButton ? (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic("selection");
        toggleFavorite(displayName);
      }}
      className={`p-0.5 rounded transition-all shrink-0 inline-flex items-center ml-1 cursor-pointer ${
        isFav
          ? "opacity-100 text-amber-400 drop-shadow-xs"
          : "opacity-0 group-hover:opacity-60 hover:!opacity-100 text-slate-400 hover:text-amber-300"
      }`}
      title={isFav ? `${displayName} favorilerden çıkar` : `${displayName} favorilere ekle`}
      aria-label={isFav ? `${displayName} favorilerden çıkar` : `${displayName} favorilere ekle`}
    >
      <Star size={11} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
    </button>
  ) : null;

  if (disableTeamPageLink) {
    return (
      <span className={`inline-flex items-center max-w-[160px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-none ${className}`} title={displayName}>
        {logoElement}
        <span className="truncate">{content}</span>
        {externalVbLink}
        {starElement}
      </span>
    );
  }

  return (
    <span
      className={`group inline-flex items-center max-w-[160px] xs:max-w-[220px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-none ${className}`}
      title={displayName}
    >
      {logoElement}
      <Link
        href={`/takim/${teamSlug}${cityQuery}`}
        className="truncate hover:underline hover:text-ink transition-colors cursor-pointer"
        title={`${displayName} Detay Sayfası`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </Link>
      {externalVbLink}
      {starElement}
    </span>
  );
};
