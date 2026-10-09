"use client";

import React from "react";

interface BrandLogoProps {
  className?: string;
  variant?: "full" | "mark" | "compact";
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = "",
  variant = "full",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${
        onClick ? "cursor-pointer group" : ""
      } ${className}`}
      title="Altyapı Voleybol — Türkiye Altyapı Voleybol Ligleri"
    >
      {/* Volleyball Emblem Mark */}
      <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt="Altyapı Voleybol"
          width={36}
          height={36}
          className="w-full h-full object-contain rounded-xl shadow-md border border-slate-700/60"
        />
      </div>

      {/* Typography */}
      {variant !== "mark" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-primary/15 text-primary border border-primary/40 font-display font-bold text-xs sm:text-[13px] tracking-wider uppercase px-2 py-0.5 rounded-md">
              ALTYAPI
            </span>
            <span className="text-white text-base sm:text-lg font-black tracking-tight font-sans">
              VOLEYBOL
            </span>
          </div>
          {variant === "full" && (
            <span className="text-[9px] font-semibold tracking-widest text-slate-400 uppercase mt-0.5 hidden sm:block">
              Türkiye Altyapı Ligleri
            </span>
          )}
        </div>
      )}
    </div>
  );
};
