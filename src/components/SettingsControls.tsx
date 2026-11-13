"use client";

import React from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Başlık çubuklarında kullanılan tema kontrol düğmesi. */
export const SettingsControls: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`flex items-center gap-1.5 ${className}`}>
    <ThemeToggle />
  </div>
);
