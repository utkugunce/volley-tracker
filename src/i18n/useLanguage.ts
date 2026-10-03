"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_LANGUAGE, LANGUAGE_STORAGE_KEY, parseLanguage, translate, type Language } from "./dictionary";

const listeners = new Set<() => void>();

function readLanguage(): Language {
  try {
    return parseLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  const onStorage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_STORAGE_KEY) {
      document.documentElement.lang = readLanguage();
      callback();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Sunucu ve hydration sırasında her zaman Türkçe; mount sonrası kayıtlı tercih okunur. */
const getServerSnapshot = (): Language => DEFAULT_LANGUAGE;

export function setLanguage(language: Language) {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* gizli mod vb. */
  }
  document.documentElement.lang = language;
  listeners.forEach((l) => l());
}

export function useLanguage() {
  const language = useSyncExternalStore(subscribe, readLanguage, getServerSnapshot);
  const t = useCallback((key: string) => translate(language, key), [language]);
  const toggleLanguage = useCallback(() => setLanguage(language === "en" ? "tr" : "en"), [language]);
  return { language, t, toggleLanguage };
}
