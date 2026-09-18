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
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Outer glow circle */}
          <circle
            cx="20"
            cy="20"
            r="19"
            fill="url(#logo-grad-bg)"
            stroke="url(#logo-border-grad)"
            strokeWidth="1.5"
          />

          {/* Volleyball segments */}
          {/* Top segment */}
          <path
            d="M20 3C27.5 3 33.9 7.8 36.1 14.5C31.5 12.8 26.2 13.2 21.2 15.8C18.4 10.9 15.5 6.5 20 3Z"
            fill="url(#seg-grad-top)"
            opacity="0.95"
          />
          {/* Left segment */}
          <path
            d="M4.5 15.2C8.2 8.6 15.2 4.2 20 3C15.6 6.5 18.5 11 21.2 15.8C15.8 17.5 10.2 17.2 4.5 15.2Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
          {/* Bottom Left segment */}
          <path
            d="M3.9 16.5C10 18.5 15.8 18.5 21 17C21.8 22.8 24.5 28 29.5 31.8C23.2 36.2 14.5 35.8 8.8 30.5C5.1 26.8 3.2 21.8 3.9 16.5Z"
            fill="url(#seg-grad-coral)"
          />
          {/* Bottom Right segment */}
          <path
            d="M30.5 30.8C25.8 27.2 23.2 22.5 22.5 17.2C27.5 14.8 32.5 14.5 36.8 16C37.2 21.2 35.2 26.8 30.5 30.8Z"
            fill="#FFFFFF"
            opacity="0.95"
          />
          {/* Center Swirl & Seams */}
          <path
            d="M20 3C15.6 6.5 18.5 11 21.2 15.8C27.5 14.8 32.5 14.5 36.8 16"
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M4.5 15.2C10.2 17.2 15.8 17.5 21.2 15.8C22 22.8 24.5 28 30.5 30.8"
            stroke="#0f172a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />

          {/* Dynamic Velocity Ring Accent */}
          <circle
            cx="20"
            cy="20"
            r="18.5"
            stroke="url(#accent-ring)"
            strokeWidth="1"
            strokeDasharray="18 4 12 6"
          />

          {/* Core Energy Dot */}
          <circle cx="21" cy="16.5" r="2" fill="#fbbf24" />

          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="logo-grad-bg" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <linearGradient id="logo-border-grad" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="50%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="seg-grad-top" x1="15" y1="3" x2="36" y2="16">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="seg-grad-coral" x1="4" y1="16" x2="29" y2="36">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
            <linearGradient id="accent-ring" x1="0" y1="0" x2="40" y2="40">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Typography */}
      {variant !== "mark" && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 text-white text-xs sm:text-[13px] font-black tracking-wider uppercase px-2 py-0.5 rounded-md shadow-xs border border-white/10">
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
