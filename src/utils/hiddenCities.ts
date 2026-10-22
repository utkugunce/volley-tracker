import { slugify } from "./slugify";

/**
 * Canlıda geçici olarak gizlenen iller (datalar saklanır fakat sitede gösterilmez).
 * - kirikkale: Yalnızca kurumlar arası turnuva mevcut, resmi altyapı ligi yok
 * - usak: Yalnızca büyük kadınlar ligi turnuvası mevcut, resmi altyapı ligi yok
 * - nigde: Yalnızca kamu sporları turnuvası mevcut, resmi altyapı ligi yok
 * - erzurum: Yalnızca kamu sporları turnuvası mevcut, resmi altyapı ligi yok
 * - isparta: Genç ve yıldız kulüp turnuvası değil (Cumhuriyet Kupası)
 * - bayburt, ardahan: Verisi henüz açıklanmamış/boş iller
 */
export const HIDDEN_CITY_SLUGS = new Set<string>([
  "kirikkale",
  "usak",
  "nigde",
  "erzurum",
  "isparta",
  "bayburt",
  "ardahan",
]);

/**
 * Bir ilin veya il slug'ının sitede gizli olup olmadığını kontrol eder.
 */
export function isCityHidden(cityOrSlug?: string): boolean {
  if (!cityOrSlug) return false;
  const clean = slugify(cityOrSlug).toLowerCase();
  return HIDDEN_CITY_SLUGS.has(clean);
}
