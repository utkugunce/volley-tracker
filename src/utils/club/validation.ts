/**
 * Kulüp paneli girdi doğrulama (saf fonksiyonlar). Zod bağımlılığı yoktur.
 * Tüm metinler HTML etiketlerinden ve kontrol karakterlerinden arındırılır, uzunlukları sınırlanır.
 */
import { sanitizeString } from "@/utils/sanitize";
import { isMemberRole, type MemberRole } from "./permissions";

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

export const LIMITS = {
  name: { min: 2, max: 80 },
  position: { max: 40 },
  title: { min: 3, max: 120 },
  announcementBody: { max: 2000 },
  noteBody: { max: 4000 },
  opponent: { max: 120 },
  matchRef: { max: 100 },
  note: { max: 500 },
  email: { max: 254 },
} as const;

const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,119}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function fail<T>(error: string): ValidationResult<T> {
  return { ok: false, error };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeEmail(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return fail("Geçerli bir e-posta adresi girin.");
  const email = value.trim().toLowerCase();
  if (email.length > LIMITS.email.max || !EMAIL_RE.test(email)) {
    return fail("Geçerli bir e-posta adresi girin.");
  }
  return { ok: true, value: email };
}

export function validateClubSlug(value: unknown): ValidationResult<string> {
  if (typeof value !== "string") return fail("Geçersiz kulüp.");
  const slug = value.trim();
  if (!SLUG_RE.test(slug)) return fail("Geçersiz kulüp.");
  return { ok: true, value: slug };
}

export function validateUuid(value: unknown): ValidationResult<string> {
  if (typeof value !== "string" || !UUID_RE.test(value)) return fail("Geçersiz kayıt kimliği.");
  return { ok: true, value: value.toLowerCase() };
}

/**
 * Giriş sonrası yönlendirme yolu: yalnız site içi, tek eğik çizgiyle başlayan yollar.
 * "//evil.com", "/\\evil.com", "https://..." gibi açık yönlendirmeler reddedilir.
 */
export function safeNextPath(value: unknown, fallback = "/panel"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value) || value.length > 200) return fallback;
  return value;
}

function optionalInt(
  value: unknown,
  min: number,
  max: number,
  label: string
): ValidationResult<number | null> {
  if (value === null || value === undefined || value === "") return { ok: true, value: null };
  const num = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isInteger(num) || num < min || num > max) {
    return fail(`${label} ${min}-${max} arasında bir tam sayı olmalı.`);
  }
  return { ok: true, value: num };
}

function requiredText(value: unknown, min: number, max: number, label: string): ValidationResult<string> {
  if (typeof value !== "string") return fail(`${label} gerekli.`);
  const text = sanitizeString(value, max + 1);
  if (text.length < min) return fail(`${label} en az ${min} karakter olmalı.`);
  if (text.length > max) return fail(`${label} en fazla ${max} karakter olabilir.`);
  return { ok: true, value: text };
}

function multilineText(value: unknown, max: number, label: string): ValidationResult<string> {
  if (typeof value !== "string") return fail(`${label} gerekli.`);
  const text = value
    .replace(/<[^>]*>/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (text.length < 1) return fail(`${label} gerekli.`);
  if (text.length > max) return fail(`${label} en fazla ${max} karakter olabilir.`);
  return { ok: true, value: text };
}

// ---------------------------------------------------------------------------
// Kadro
// ---------------------------------------------------------------------------
export interface RosterInput {
  name: string;
  shirt_number: number | null;
  position: string | null;
  height_cm: number | null;
  birth_year: number | null;
  is_staff: boolean;
  is_visible: boolean;
}

export function validateRosterInput(input: unknown): ValidationResult<RosterInput> {
  if (!isRecord(input)) return fail("Geçersiz istek gövdesi.");
  const name = requiredText(input.name, LIMITS.name.min, LIMITS.name.max, "İsim");
  if (!name.ok) return name;
  const shirt = optionalInt(input.shirt_number, 0, 99, "Forma numarası");
  if (!shirt.ok) return shirt;
  const height = optionalInt(input.height_cm, 100, 250, "Boy");
  if (!height.ok) return height;
  const currentYear = new Date().getFullYear();
  const birth = optionalInt(input.birth_year, 1950, currentYear, "Doğum yılı");
  if (!birth.ok) return birth;

  let position: string | null = null;
  if (typeof input.position === "string" && input.position.trim() !== "") {
    position = sanitizeString(input.position, LIMITS.position.max) || null;
  }

  return {
    ok: true,
    value: {
      name: name.value,
      shirt_number: shirt.value,
      position,
      height_cm: height.value,
      birth_year: birth.value,
      is_staff: input.is_staff === true,
      is_visible: input.is_visible !== false,
    },
  };
}

// ---------------------------------------------------------------------------
// Duyuru
// ---------------------------------------------------------------------------
export interface AnnouncementInput {
  title: string;
  body: string;
  pinned: boolean;
  expires_at: string | null;
}

export function validateAnnouncementInput(input: unknown, now: Date = new Date()): ValidationResult<AnnouncementInput> {
  if (!isRecord(input)) return fail("Geçersiz istek gövdesi.");
  const title = requiredText(input.title, LIMITS.title.min, LIMITS.title.max, "Başlık");
  if (!title.ok) return title;
  const body = multilineText(input.body, LIMITS.announcementBody.max, "Duyuru metni");
  if (!body.ok) return body;

  let expiresAt: string | null = null;
  if (input.expires_at !== null && input.expires_at !== undefined && input.expires_at !== "") {
    if (typeof input.expires_at !== "string") return fail("Geçersiz bitiş tarihi.");
    const parsed = new Date(input.expires_at);
    if (Number.isNaN(parsed.getTime())) return fail("Geçersiz bitiş tarihi.");
    if (parsed.getTime() <= now.getTime()) return fail("Bitiş tarihi gelecekte olmalı.");
    expiresAt = parsed.toISOString();
  }

  return { ok: true, value: { title: title.value, body: body.value, pinned: input.pinned === true, expires_at: expiresAt } };
}

// ---------------------------------------------------------------------------
// Maç notu
// ---------------------------------------------------------------------------
export interface MatchNoteInput {
  body: string;
  opponent: string | null;
  match_date: string | null;
  match_ref: string | null;
  visibility: "club" | "public";
}

function isRealDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function validateMatchNoteInput(input: unknown): ValidationResult<MatchNoteInput> {
  if (!isRecord(input)) return fail("Geçersiz istek gövdesi.");
  const body = multilineText(input.body, LIMITS.noteBody.max, "Not");
  if (!body.ok) return body;

  let opponent: string | null = null;
  if (typeof input.opponent === "string" && input.opponent.trim() !== "") {
    opponent = sanitizeString(input.opponent, LIMITS.opponent.max) || null;
  }

  let matchDate: string | null = null;
  if (input.match_date !== null && input.match_date !== undefined && input.match_date !== "") {
    if (typeof input.match_date !== "string" || !isRealDate(input.match_date)) {
      return fail("Maç tarihi YYYY-AA-GG biçiminde olmalı.");
    }
    matchDate = input.match_date;
  }

  let matchRef: string | null = null;
  if (typeof input.match_ref === "string" && input.match_ref.trim() !== "") {
    const ref = input.match_ref.trim();
    if (!/^[a-zA-Z0-9_\-]+$/.test(ref) || ref.length > LIMITS.matchRef.max) return fail("Geçersiz maç referansı.");
    matchRef = ref;
  }

  // Varsayılan ve güvenli seçenek: yalnız kulüp içi.
  const visibility = input.visibility === "public" ? "public" : "club";

  return { ok: true, value: { body: body.value, opponent, match_date: matchDate, match_ref: matchRef, visibility } };
}

// ---------------------------------------------------------------------------
// Başvuru ve yönetici işlemleri
// ---------------------------------------------------------------------------
export interface ApplicationInput {
  club_slug: string;
  member_role: MemberRole;
  note: string | null;
}

export function validateApplicationInput(input: unknown): ValidationResult<ApplicationInput> {
  if (!isRecord(input)) return fail("Geçersiz istek gövdesi.");
  const slug = validateClubSlug(input.club_slug);
  if (!slug.ok) return slug;
  if (!isMemberRole(input.member_role)) return fail("Rol 'manager' veya 'coach' olmalı.");
  let note: string | null = null;
  if (typeof input.note === "string" && input.note.trim() !== "") {
    note = sanitizeString(input.note, LIMITS.note.max) || null;
  }
  return { ok: true, value: { club_slug: slug.value, member_role: input.member_role, note } };
}
