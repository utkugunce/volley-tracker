export type DataValidationResult = {
  valid: boolean;
  errors: string[];
  summary: string;
};

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateCityIndex(payload: any): DataValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["City index payload is missing or invalid."],
      summary: "City index validation failed: payload not found.",
    };
  }

  const cities = Array.isArray(payload.cities) ? payload.cities : [];
  if (cities.length === 0) {
    errors.push("cities array is empty.");
  }

  if (payload.total_cities != null && toNumber(payload.total_cities) !== cities.length) {
    errors.push(`total_cities mismatch: expected ${cities.length}, got ${payload.total_cities}.`);
  }

  const activeCities = cities.filter(
    (city: Record<string, unknown>) => toNumber(city?.matches_count) > 0 || toNumber(city?.standings_count) > 0
  ).length;

  if (payload.active_cities != null && toNumber(payload.active_cities) !== activeCities) {
    errors.push(`active_cities mismatch: expected ${activeCities}, got ${payload.active_cities}.`);
  }

  const totalMatches = cities.reduce((sum: number, city: Record<string, unknown>) => sum + toNumber(city?.matches_count), 0);
  if (payload.total_matches != null && toNumber(payload.total_matches) !== totalMatches) {
    errors.push(`total_matches mismatch: expected ${totalMatches}, got ${payload.total_matches}.`);
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    summary: valid
      ? `City index validated: ${cities.length} cities, ${activeCities} active, ${totalMatches} matches.`
      : `City index validation failed: ${errors.join(" ")}`,
  };
}

export function validateKadinlar2LigData(payload: any): DataValidationResult {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      errors: ["Kadinlar 2. Lig payload is missing or invalid."],
      summary: "Second-division validation failed: payload not found.",
    };
  }

  if (!payload.metadata || typeof payload.metadata !== "object") {
    errors.push("metadata is missing or incomplete.");
  }

  const groups = Array.isArray(payload.gruplar) ? payload.gruplar : [];
  if (groups.length === 0) {
    errors.push("gruplar array is empty.");
  }

  if (payload.metadata?.toplam_grup_sayisi != null && toNumber(payload.metadata.toplam_grup_sayisi) !== groups.length) {
    errors.push(`toplam_grup_sayisi mismatch: expected ${groups.length}, got ${payload.metadata.toplam_grup_sayisi}.`);
  }

  const totalTeams = groups.reduce(
    (sum: number, group: Record<string, unknown>) => sum + (Array.isArray(group?.puan_durumu) ? (group.puan_durumu as unknown[]).length : 0),
    0
  );
  if (payload.metadata?.toplam_takim_sayisi != null && toNumber(payload.metadata.toplam_takim_sayisi) !== totalTeams) {
    errors.push(`toplam_takim_sayisi mismatch: expected ${totalTeams}, got ${payload.metadata.toplam_takim_sayisi}.`);
  }

  const allMatches = Array.isArray(payload.tum_maclar) ? payload.tum_maclar : [];
  const fixtureMatches = groups.reduce(
    (sum: number, group: Record<string, unknown>) => sum + (Array.isArray(group?.fikstur) ? (group.fikstur as unknown[]).length : 0),
    0
  );
  const matchCount = allMatches.length > 0 ? allMatches.length : fixtureMatches;

  if (payload.metadata?.toplam_mac_sayisi != null && toNumber(payload.metadata.toplam_mac_sayisi) !== matchCount) {
    errors.push(`toplam_mac_sayisi mismatch: expected ${matchCount}, got ${payload.metadata.toplam_mac_sayisi}.`);
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    summary: valid
      ? `Second-division data validated: ${groups.length} groups, ${totalTeams} teams, ${matchCount} matches.`
      : `Second-division data validation failed: ${errors.join(" ")}`,
  };
}
