/**
 * src/utils/turkishLocale.ts
 * Türkçe büyük/küçük harf dönüşümü ve arama toleransı için merkezi yardımcı fonksiyonlar.
 *
 * JavaScript varsayılan .toLowerCase() çağrısı Türkçe "İ" harfini "i" yerine
 * combining dot içeren U+0069 U+0307 karakterine çevirdiği için "İBB".toLowerCase().includes("ibb") false döner.
 * toLocaleLowerCase("tr") ise doğru şekilde "i" karakterine dönüştürür.
 */

/**
 * Verilen metni Türkçe dil kurallarına uygun olarak küçük harfe çevirir.
 * Örnek: "İBB Spor Kulübü" -> "ibb spor kulübü"
 * Örnek: "İstanbul" -> "istanbul"
 * Örnek: "IĞDIR" -> "ığdır"
 */
export function trLower(s: string): string {
  return (s || "").toLocaleLowerCase("tr");
}

/**
 * Türkçe özel karakterleri ASCII karşılıklarına dönüştürerek
 * Türkçe klavye kullanmayan (veya düz harf yazan) kullanıcılar için
 * arama toleransı sağlar.
 * Örnek: "İTÜ" -> "itu", "Iğdır" -> "igdir", "Çeşme" -> "cesme"
 */
export function trNormalize(s: string): string {
  return trLower(s)
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/**
 * `haystack` içinde `needle` aramasını hem Türkçe küçük harf kurallarıyla
 * hem de ASCII toleranslı olarak kontrol eder.
 * Örnek: trIncludes("İstanbul", "istanbul") -> true
 * Örnek: trIncludes("İBB Spor Kulübü", "ibb") -> true
 * Örnek: trIncludes("İTÜ GVO", "itu") -> true
 */
export function trIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true;
  if (!haystack) return false;
  const hLower = trLower(haystack);
  const nLower = trLower(needle);
  if (hLower.includes(nLower)) return true;
  return trNormalize(haystack).includes(trNormalize(needle));
}
