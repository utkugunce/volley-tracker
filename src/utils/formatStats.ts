/** İstatistik sayılarını Türkçe biçimde (virgüllü ondalık) yazar; değer yoksa "-" döner. */
export function fmt(n: number | null | undefined, digits = 1): string {
  return n === null || n === undefined
    ? "-"
    : n.toLocaleString("tr-TR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

/**
 * Puan durumu grup adından kategori önekini ve baştaki tire/boşlukları atar:
 * "Genç Kızlar Süper Lig - A Grubu" → "A Grubu"; "Yıldız Kızlar Süper Lig - - C Gr" → "C Gr".
 */
export function shortGroupName(category: string, groupName: string): string {
  const prefix = `${category} - `;
  const rest = groupName.startsWith(prefix) ? groupName.slice(prefix.length) : groupName;
  return rest.replace(/^[-\s]+/, "") || groupName;
}
