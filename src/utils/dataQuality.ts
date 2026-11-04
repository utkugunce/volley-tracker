export type DataValidationResult = {
  valid: boolean;
  errors: string[];
  summary: string;
};

interface CityIndexPayload {
  cities?: unknown;
  total_cities?: unknown;
  active_cities?: unknown;
  total_matches?: unknown;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function validateCityIndex(input: unknown): DataValidationResult {
  const errors: string[] = [];

  if (!input || typeof input !== "object") {
    return {
      valid: false,
      errors: ["City index payload is missing or invalid."],
      summary: "City index validation failed: payload not found.",
    };
  }

  const payload = input as CityIndexPayload;
  const cities: Record<string, unknown>[] = Array.isArray(payload.cities) ? payload.cities : [];
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
