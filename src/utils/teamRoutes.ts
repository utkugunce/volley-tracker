import { normalizeCitySlug } from "./volleybox";

/**
 * Takım sayfası adresi: `/takim/<slug>` ya da il varyantı `/takim/<slug>/<il>`.
 *
 * Eski `/takim/<slug>?sehir=<il>` biçimi next.config.mjs içindeki rewrite ile hâlâ çalışır, ancak
 * site içi bağlantılarda KULLANILMAMALIDIR: Next.js istemci yönlendiricisi rewrite edilen adresleri
 * önceden getirirken (prefetch) Vercel'de aynı isteği saniyede yüzlerce kez tekrarlayan bir döngüye
 * giriyordu (tarayıcının tamamını kilitleyen yavaşlama). Kanonik yol rewrite gerektirmez.
 */
export function teamPagePath(teamSlug: string, city?: string | null): string {
  const slug = (teamSlug || "").trim();
  const citySlug = normalizeCitySlug(city || "");
  return citySlug ? `/takim/${slug}/${citySlug}` : `/takim/${slug}`;
}
