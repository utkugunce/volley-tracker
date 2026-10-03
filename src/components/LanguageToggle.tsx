"use client";

import React from "react";
import { useLanguage } from "@/i18n/useLanguage";

/** Dil değiştirici (TR ↔ EN). Tercih kalıcıdır; varsayılan Türkçedir. */
export const LanguageToggle: React.FC<{ className?: string }> = ({ className = "" }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const label = `${t("lang.label")}: ${t("lang.switchTo")}`;
  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`px-2 min-w-[36px] min-h-[36px] sm:min-w-[30px] sm:min-h-[30px] flex items-center justify-center rounded-lg bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700/80 text-[11px] font-bold tracking-wide transition-colors no-print border border-slate-700/60 ${className}`}
      title={label}
      aria-label={label}
      lang={language === "en" ? "tr" : "en"}
    >
      {language === "en" ? "TR" : "EN"}
    </button>
  );
};
