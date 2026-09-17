/**
 * Input sanitization and validation utilities for user and admin inputs.
 */

/**
 * Strips HTML tags, trims whitespace, and limits maximum length.
 */
export function sanitizeString(val: unknown, maxLength = 255): string {
  if (typeof val !== "string") return "";
  const cleaned = val
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "") // Strip control chars
    .trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Validates and sanitizes a match ID (alphanumeric, hyphens, underscores).
 */
export function sanitizeMatchId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  const trimmed = id.trim();
  if (!/^[a-zA-Z0-9_\-]+$/.test(trimmed) || trimmed.length > 100) {
    return null;
  }
  return trimmed;
}

/**
 * Validates an array of set scores (e.g. ["25-18", "21-25", "15-12"]).
 */
export function sanitizeSetScores(scores: unknown): string[] | undefined {
  if (!Array.isArray(scores)) return undefined;
  const validScores: string[] = [];
  const setScoreRegex = /^\d{1,2}\s*[-:]\s*\d{1,2}$/;

  for (const s of scores) {
    if (typeof s === "string") {
      const trimmed = s.trim().replace(/\s*:\s*/, "-");
      if (setScoreRegex.test(trimmed)) {
        validScores.push(trimmed);
      }
    }
  }

  return validScores.length > 0 ? validScores : undefined;
}

/**
 * Validates match status against allowed enum values.
 */
export const ALLOWED_STATUSES = ["upcoming", "live", "finished", "postponed"] as const;
export type ValidStatus = (typeof ALLOWED_STATUSES)[number];

export function sanitizeStatus(status: unknown): ValidStatus {
  if (typeof status === "string" && (ALLOWED_STATUSES as readonly string[]).includes(status)) {
    return status as ValidStatus;
  }
  return "finished";
}
