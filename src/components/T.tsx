"use client";

import React from "react";
import { useLanguage } from "@/i18n/useLanguage";

/** Sunucu bileşenlerinde çevrilmiş metin göstermek için: <T k="stats.title" />. SSR çıktısı Türkçedir. */
export const T: React.FC<{ k: string }> = ({ k }) => {
  const { t } = useLanguage();
  return <>{t(k)}</>;
};
