"use client";

import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "@/theme/useTheme";
import type { ThemePreference } from "@/theme/theme";
import { useLanguage } from "@/i18n/useLanguage";

const ICONS: Record<ThemePreference, typeof Sun> = { system: Monitor, light: Sun, dark: Moon };

/** Tema değiştirici: Sistem → Açık → Koyu döngüsü. Tercih kalıcıdır. */
export const ThemeToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { preference, cycleTheme } = useTheme();
  const { t } = useLanguage();
  const Icon = ICONS[preference];
  const label = `${t("theme.label")}: ${t(`theme.${preference}`)}`;
  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`p-2 sm:p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors no-print border border-slate-700/60 ${className}`}
      title={label}
      aria-label={label}
      data-theme-preference={preference}
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
};
