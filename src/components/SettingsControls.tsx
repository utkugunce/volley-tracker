"use client";

import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

/** Başlık çubuklarında kullanılan tema + dil düğmeleri. */
export const SettingsControls: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <LanguageToggle />
    <ThemeToggle />
  </div>
);
