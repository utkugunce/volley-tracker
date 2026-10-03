import { describe, it, expect } from "vitest";
import {
  approvedClubSlugs,
  canPerform,
  canTransitionStatus,
  findApprovedMembership,
  isMemberRole,
  isMemberStatus,
  type ClubAction,
} from "../permissions";

const m = (over: Partial<Parameters<typeof canPerform>[0] & object> = {}) => ({
  id: "1",
  user_id: "u1",
  club_slug: "kulup-a",
  member_role: "manager" as const,
  status: "approved" as const,
  ...over,
});

const ALL: ClubAction[] = [
  "roster:read",
  "roster:write",
  "announcement:read",
  "announcement:write",
  "note:read",
  "note:write",
];

describe("canPerform", () => {
  it("onaylı yönetici tüm işlemleri kendi kulübünde yapabilir", () => {
    for (const a of ALL) expect(canPerform(m(), "kulup-a", a)).toBe(true);
  });

  it("antrenör duyuru yazamaz ama kadro ve not yazabilir", () => {
    const coach = m({ member_role: "coach" });
    expect(canPerform(coach, "kulup-a", "announcement:write")).toBe(false);
    expect(canPerform(coach, "kulup-a", "announcement:read")).toBe(true);
    expect(canPerform(coach, "kulup-a", "roster:write")).toBe(true);
    expect(canPerform(coach, "kulup-a", "note:write")).toBe(true);
  });

  it("onaylanmamış üyelik (pending/rejected/revoked) hiçbir işlem yapamaz", () => {
    for (const status of ["pending", "rejected", "revoked"] as const) {
      for (const a of ALL) expect(canPerform(m({ status }), "kulup-a", a)).toBe(false);
    }
  });

  it("başka kulüpte yetki yoktur", () => {
    for (const a of ALL) expect(canPerform(m(), "kulup-b", a)).toBe(false);
  });

  it("üyelik yoksa ya da rol geçersizse reddeder", () => {
    expect(canPerform(null, "kulup-a", "roster:read")).toBe(false);
    expect(canPerform(undefined, "kulup-a", "roster:read")).toBe(false);
    expect(canPerform(m({ member_role: "admin" as never }), "kulup-a", "roster:read")).toBe(false);
  });
});

describe("üyelik yardımcıları", () => {
  const list = [
    m({ club_slug: "a", status: "pending" }),
    m({ club_slug: "b", status: "approved" }),
    m({ club_slug: "b", status: "approved" }),
    m({ club_slug: "c", status: "revoked" }),
  ];

  it("findApprovedMembership yalnızca onaylı kaydı döndürür", () => {
    expect(findApprovedMembership(list, "a")).toBeNull();
    expect(findApprovedMembership(list, "b")?.club_slug).toBe("b");
    expect(findApprovedMembership(list, "c")).toBeNull();
  });

  it("approvedClubSlugs tekrarsız onaylı kulüpleri verir", () => {
    expect(approvedClubSlugs(list)).toEqual(["b"]);
  });

  it("rol ve durum tip korumaları", () => {
    expect(isMemberRole("manager")).toBe(true);
    expect(isMemberRole("admin")).toBe(false);
    expect(isMemberRole(undefined)).toBe(false);
    expect(isMemberStatus("pending")).toBe(true);
    expect(isMemberStatus("x")).toBe(false);
  });
});

describe("canTransitionStatus", () => {
  it("izin verilen geçişler", () => {
    expect(canTransitionStatus("pending", "approved")).toBe(true);
    expect(canTransitionStatus("pending", "rejected")).toBe(true);
    expect(canTransitionStatus("approved", "revoked")).toBe(true);
    expect(canTransitionStatus("rejected", "approved")).toBe(true);
    expect(canTransitionStatus("revoked", "approved")).toBe(true);
  });
  it("izin verilmeyen geçişler", () => {
    expect(canTransitionStatus("pending", "revoked")).toBe(false);
    expect(canTransitionStatus("approved", "rejected")).toBe(false);
    expect(canTransitionStatus("approved", "pending")).toBe(false);
  });
});
