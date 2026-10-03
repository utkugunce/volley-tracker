/**
 * Kulüp paneli yetki mantığı (saf fonksiyonlar; sunucu ve testlerde kullanılır).
 *
 * Roller:
 *  - manager: kadro, duyuru ve maç notlarını yönetir.
 *  - coach:   kadro ve maç notlarını yönetir; duyuru yayınlayamaz.
 * Her iki rol de yalnızca yönetici (admin) tarafından `approved` yapıldığında geçerlidir.
 */

export const MEMBER_ROLES = ["manager", "coach"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];

export const MEMBER_STATUSES = ["pending", "approved", "rejected", "revoked"] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export type ClubAction =
  | "roster:read"
  | "roster:write"
  | "announcement:read"
  | "announcement:write"
  | "note:read"
  | "note:write";

export interface ClubMembership {
  id: string;
  user_id: string;
  club_slug: string;
  member_role: MemberRole;
  status: MemberStatus;
}

export function isMemberRole(value: unknown): value is MemberRole {
  return typeof value === "string" && (MEMBER_ROLES as readonly string[]).includes(value);
}

export function isMemberStatus(value: unknown): value is MemberStatus {
  return typeof value === "string" && (MEMBER_STATUSES as readonly string[]).includes(value);
}

const ACTIONS_BY_ROLE: Record<MemberRole, ReadonlySet<ClubAction>> = {
  manager: new Set<ClubAction>([
    "roster:read",
    "roster:write",
    "announcement:read",
    "announcement:write",
    "note:read",
    "note:write",
  ]),
  coach: new Set<ClubAction>(["roster:read", "roster:write", "announcement:read", "note:read", "note:write"]),
};

/** Üyenin belirtilen kulüpte belirtilen işlemi yapıp yapamayacağı. */
export function canPerform(
  membership: Pick<ClubMembership, "club_slug" | "member_role" | "status"> | null | undefined,
  clubSlug: string,
  action: ClubAction
): boolean {
  if (!membership) return false;
  if (membership.status !== "approved") return false;
  if (membership.club_slug !== clubSlug) return false;
  if (!isMemberRole(membership.member_role)) return false;
  return ACTIONS_BY_ROLE[membership.member_role].has(action);
}

/** Kullanıcının kulübe bağlı, onaylı üyeliğini bulur (yoksa null). */
export function findApprovedMembership<T extends Pick<ClubMembership, "club_slug" | "status">>(
  memberships: readonly T[],
  clubSlug: string
): T | null {
  return memberships.find((m) => m.club_slug === clubSlug && m.status === "approved") ?? null;
}

/** Kullanıcının yönetebildiği (onaylı) kulüp slug listesi. */
export function approvedClubSlugs(memberships: readonly Pick<ClubMembership, "club_slug" | "status">[]): string[] {
  return Array.from(new Set(memberships.filter((m) => m.status === "approved").map((m) => m.club_slug)));
}

/** Yönetici bir üyelik kaydında yapılabilecek durum geçişleri. */
const STATUS_TRANSITIONS: Record<MemberStatus, readonly MemberStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["revoked"],
  rejected: ["approved"],
  revoked: ["approved"],
};

export function canTransitionStatus(from: MemberStatus, to: MemberStatus): boolean {
  return STATUS_TRANSITIONS[from].includes(to);
}
