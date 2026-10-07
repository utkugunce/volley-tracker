import type { Kadinlar2LigData, Kadinlar2LigGroup, Kadinlar2LigMatch } from "@/types/kadinlar2Lig";

/**
 * Sunucudan istemci bileşenine geçen Kadınlar 2. Ligi verisinin sıkıştırılmış hâli.
 *
 * `gruplar[].fikstur`, `tum_maclar` içindeki maçların birebir kopyasıdır. Tam veri her
 * ISR sayfasına (HTML + RSC yükü) iki kez gömülüyordu; burada grup fikstürleri yalnızca
 * `tum_maclar` indeksleri olarak taşınır ve istemcide aynı yapıya geri açılır.
 * Böylece her Kadınlar 2. Ligi sayfasının önbelleğe yazılan çıktısı belirgin biçimde küçülür
 * (Vercel ISR Write birimleri 8 KB'lık parçalar hâlinde sayılır).
 */
export interface Kadinlar2LigCompactGroup extends Omit<Kadinlar2LigGroup, "fikstur"> {
  fikstur_idx: number[];
}

export interface Kadinlar2LigCompactData extends Omit<Kadinlar2LigData, "gruplar"> {
  compact: true;
  gruplar: Kadinlar2LigCompactGroup[];
}

/**
 * Uygulamada kullanılmayan alanları boşaltır: `takim_a_logo`/`takim_b_logo` silinmiş
 * `public/logos` dosyalarını gösterir ve hiçbir bileşen tarafından okunmaz (logolar CSS TeamBadge ile çizilir).
 */
function stripUnusedFields(match: Kadinlar2LigMatch): Kadinlar2LigMatch {
  if (!match.takim_a_logo && !match.takim_b_logo) return match;
  return { ...match, takim_a_logo: "", takim_b_logo: "" };
}

function matchKey(match: Kadinlar2LigMatch): string {
  return JSON.stringify(match);
}

/**
 * Grup fikstürlerini `tum_maclar` indekslerine çevirir. Herhangi bir grup maçı
 * `tum_maclar` içinde birebir bulunamazsa veri olduğu gibi (sıkıştırılmadan) döner.
 */
export function compactKadinlar2LigData(data: Kadinlar2LigData): Kadinlar2LigCompactData | Kadinlar2LigData {
  const allMatches = data.tum_maclar || [];
  const indexByKey = new Map<string, number>();
  allMatches.forEach((match, idx) => {
    const key = matchKey(match);
    if (!indexByKey.has(key)) indexByKey.set(key, idx);
  });

  const gruplar: Kadinlar2LigCompactGroup[] = [];
  for (const group of data.gruplar || []) {
    const { fikstur, ...rest } = group;
    const fiksturIdx: number[] = [];
    for (const match of fikstur || []) {
      const idx = indexByKey.get(matchKey(match));
      if (idx === undefined) return data;
      fiksturIdx.push(idx);
    }
    gruplar.push({ ...rest, fikstur_idx: fiksturIdx });
  }

  return { ...data, compact: true, gruplar, tum_maclar: allMatches.map(stripUnusedFields) };
}

export function isCompactKadinlar2LigData(
  data: Kadinlar2LigData | Kadinlar2LigCompactData
): data is Kadinlar2LigCompactData {
  return (data as Kadinlar2LigCompactData).compact === true;
}

/** Sıkıştırılmış veriyi bileşenlerin beklediği tam `Kadinlar2LigData` yapısına geri açar. */
export function expandKadinlar2LigData(data: Kadinlar2LigData | Kadinlar2LigCompactData): Kadinlar2LigData {
  if (!isCompactKadinlar2LigData(data)) return data;
  const { compact: _compact, gruplar, ...rest } = data;
  void _compact;
  const allMatches = rest.tum_maclar || [];
  return {
    ...rest,
    gruplar: gruplar.map(({ fikstur_idx, ...group }) => ({
      ...group,
      fikstur: fikstur_idx.map((idx) => allMatches[idx]),
    })),
  };
}
