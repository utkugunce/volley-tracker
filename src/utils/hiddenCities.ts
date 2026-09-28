import { slugify } from "./slugify";

/**
 * Canlıda geçici olarak gizlenen iller (datalar saklanır fakat sitede gösterilmez).
 */
export const HIDDEN_CITY_SLUGS = new Set<string>(["nigde"]);

/**
 * Bir ilin veya il slug'ının sitede gizli olup olmadığını kontrol eder.
 */
export function isCityHidden(cityOrSlug?: string): boolean {
  if (!cityOrSlug) return false;
  const clean = slugify(cityOrSlug).toLowerCase();
  return HIDDEN_CITY_SLUGS.has(clean);
}
