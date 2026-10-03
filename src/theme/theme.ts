/** Tema tercihi saf mantığı (SSR'dan bağımsız, test edilebilir). */
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "av-theme";
export const THEME_PREFERENCES: ThemePreference[] = ["system", "light", "dark"];

export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: "#07131F",
  light: "#F4F8FB",
};

export function parseThemePreference(value: unknown): ThemePreference {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

/** `systemPrefersLight`: `(prefers-color-scheme: light)` eşleşiyor mu. Belirsizse karanlık (mevcut görünüm) kullanılır. */
export function resolveTheme(preference: ThemePreference, systemPrefersLight: boolean): ResolvedTheme {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersLight ? "light" : "dark";
}

/** Sistem → Açık → Koyu → Sistem döngüsü. */
export function nextThemePreference(current: ThemePreference): ThemePreference {
  const i = THEME_PREFERENCES.indexOf(current);
  return THEME_PREFERENCES[(i + 1) % THEME_PREFERENCES.length];
}

export const THEME_LABELS_TR: Record<ThemePreference, string> = {
  system: "Sistem teması",
  light: "Açık tema",
  dark: "Koyu tema",
};

/**
 * <head> içinde, ilk boyamadan ÖNCE çalışan satır içi betik: kayıtlı tercihi (yoksa sistem tercihini)
 * okuyup <html data-theme> ve lang değerini ayarlar. Böylece tema/dil yanıp sönmesi olmaz.
 * Hata durumunda sessizce varsayılan (koyu, Türkçe) kalır.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var l=p==="light"||(p!=="dark"&&window.matchMedia("(prefers-color-scheme: light)").matches);d.setAttribute("data-theme",l?"light":"dark");var g=localStorage.getItem("av-lang");if(g==="en")d.setAttribute("lang","en");}catch(e){}})();`;
