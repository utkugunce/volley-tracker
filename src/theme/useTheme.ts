"use client";

import { useCallback, useEffect, useState } from "react";
import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  nextThemePreference,
  parseThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "./theme";

const LIGHT_QUERY = "(prefers-color-scheme: light)";

function systemPrefersLight(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia(LIGHT_QUERY).matches;
}

function readStoredPreference(): ThemePreference {
  try {
    return parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "system";
  }
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  document
    .querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute("content", THEME_COLORS[resolved]));
}

/** Tema tercihi: "system" | "light" | "dark". Tercih localStorage'da saklanır. */
export function useTheme() {
  // SSR ile aynı ilk değer (hydration uyumu); gerçek değer mount sonrası okunur.
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const pref = readStoredPreference();
    setPreference(pref);
    const next = resolveTheme(pref, systemPrefersLight());
    setResolved(next);
    applyTheme(next);
  }, []);

  // Tercih "sistem" iken işletim sistemi temasındaki değişimi izle.
  useEffect(() => {
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(LIGHT_QUERY);
    const onChange = () => {
      const next = resolveTheme("system", mq.matches);
      setResolved(next);
      applyTheme(next);
    };
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [preference]);

  // Başka sekmede yapılan değişikliği yansıt.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const pref = parseThemePreference(event.newValue);
      setPreference(pref);
      const next = resolveTheme(pref, systemPrefersLight());
      setResolved(next);
      applyTheme(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setThemePreference = useCallback((pref: ThemePreference) => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, pref);
    } catch {
      /* gizli mod vb.: tercih oturum içinde geçerli kalır */
    }
    setPreference(pref);
    const next = resolveTheme(pref, systemPrefersLight());
    setResolved(next);
    applyTheme(next);
  }, []);

  const cycleTheme = useCallback(() => setThemePreference(nextThemePreference(preference)), [preference, setThemePreference]);

  return { preference, resolved, setThemePreference, cycleTheme };
}
