import { describe, it, expect } from "vitest";
import {
  normalizeEmail,
  safeNextPath,
  validateAnnouncementInput,
  validateApplicationInput,
  validateClubSlug,
  validateMatchNoteInput,
  validateRosterInput,
  validateUuid,
} from "../validation";

describe("normalizeEmail", () => {
  it("küçük harfe çevirir ve kırpar", () => {
    expect(normalizeEmail("  Ali@Kulup.COM ")).toEqual({ ok: true, value: "ali@kulup.com" });
  });
  it("geçersizleri reddeder", () => {
    for (const bad of ["", "abc", "a@b", "a b@c.com", "<x>@c.com", 42, null, "a@b.com,c@d.com", `${"a".repeat(260)}@x.com`]) {
      expect(normalizeEmail(bad).ok).toBe(false);
    }
  });
});

describe("safeNextPath", () => {
  it("site içi yolları kabul eder", () => {
    expect(safeNextPath("/panel")).toBe("/panel");
    expect(safeNextPath("/takim/abc?x=1")).toBe("/takim/abc?x=1");
  });
  it("açık yönlendirmeleri engeller", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "javascript:alert(1)", "panel", "/a\nb", "/" + "a".repeat(300), 5, undefined]) {
      expect(safeNextPath(bad)).toBe("/panel");
    }
  });
  it("özel varsayılan kullanılabilir", () => {
    expect(safeNextPath("//x", "/giris")).toBe("/giris");
  });
});

describe("validateClubSlug / validateUuid", () => {
  it("slug biçimi", () => {
    expect(validateClubSlug("fenerbahce-1").ok).toBe(true);
    for (const bad of ["", "A", "ab c", "../x", "-abc", "x".repeat(121), 3]) expect(validateClubSlug(bad).ok).toBe(false);
  });
  it("uuid biçimi", () => {
    expect(validateUuid("123e4567-e89b-12d3-a456-426614174000").ok).toBe(true);
    expect(validateUuid("1; drop table").ok).toBe(false);
    expect(validateUuid(undefined).ok).toBe(false);
  });
});

describe("validateRosterInput", () => {
  it("geçerli kaydı temizleyerek kabul eder", () => {
    const r = validateRosterInput({ name: "  <b>Ayşe</b> Yılmaz ", shirt_number: "7", height_cm: 178, birth_year: 2009, position: "Pasör", is_staff: false });
    expect(r).toEqual({
      ok: true,
      value: { name: "Ayşe Yılmaz", shirt_number: 7, position: "Pasör", height_cm: 178, birth_year: 2009, is_staff: false, is_visible: true },
    });
  });
  it("boş isteğe bağlı alanlar null olur", () => {
    const r = validateRosterInput({ name: "Zeynep", shirt_number: "", height_cm: null });
    expect(r.ok && r.value.shirt_number).toBeNull();
    expect(r.ok && r.value.height_cm).toBeNull();
  });
  it("sınırları uygular", () => {
    expect(validateRosterInput({ name: "A" }).ok).toBe(false);
    expect(validateRosterInput({ name: "x".repeat(81) }).ok).toBe(false);
    expect(validateRosterInput({ name: "Ayşe", shirt_number: 100 }).ok).toBe(false);
    expect(validateRosterInput({ name: "Ayşe", shirt_number: 1.5 }).ok).toBe(false);
    expect(validateRosterInput({ name: "Ayşe", height_cm: 50 }).ok).toBe(false);
    expect(validateRosterInput({ name: "Ayşe", birth_year: 1900 }).ok).toBe(false);
    expect(validateRosterInput({ name: "Ayşe", birth_year: new Date().getFullYear() + 1 }).ok).toBe(false);
    expect(validateRosterInput(null).ok).toBe(false);
    expect(validateRosterInput([]).ok).toBe(false);
  });
  it("istemciden gelen ek alanlar çıktıya sızmaz", () => {
    const r = validateRosterInput({ name: "Ayşe", club_slug: "baska", created_by: "x", id: "y" });
    expect(r.ok && Object.keys(r.value).sort()).toEqual(
      ["birth_year", "height_cm", "is_staff", "is_visible", "name", "position", "shirt_number"].sort()
    );
  });
});

describe("validateAnnouncementInput", () => {
  const now = new Date("2026-10-04T10:00:00Z");
  it("geçerli duyuruyu kabul eder", () => {
    const r = validateAnnouncementInput({ title: "Hazırlık maçı", body: "Cumartesi 14:00\n<script>x</script>", pinned: true }, now);
    expect(r).toEqual({ ok: true, value: { title: "Hazırlık maçı", body: "Cumartesi 14:00\nx", pinned: true, expires_at: null } });
  });
  it("bitiş tarihi gelecekte olmalı", () => {
    expect(validateAnnouncementInput({ title: "Başlık", body: "x", expires_at: "2026-10-01T00:00:00Z" }, now).ok).toBe(false);
    const ok = validateAnnouncementInput({ title: "Başlık", body: "x", expires_at: "2026-10-10T00:00:00Z" }, now);
    expect(ok.ok && ok.value.expires_at).toBe("2026-10-10T00:00:00.000Z");
    expect(validateAnnouncementInput({ title: "Başlık", body: "x", expires_at: "yarın" }, now).ok).toBe(false);
  });
  it("uzunluk sınırları", () => {
    expect(validateAnnouncementInput({ title: "ab", body: "x" }, now).ok).toBe(false);
    expect(validateAnnouncementInput({ title: "x".repeat(121), body: "x" }, now).ok).toBe(false);
    expect(validateAnnouncementInput({ title: "Başlık", body: "" }, now).ok).toBe(false);
    expect(validateAnnouncementInput({ title: "Başlık", body: "x".repeat(2001) }, now).ok).toBe(false);
  });
});

describe("validateMatchNoteInput", () => {
  it("varsayılan görünürlük yalnız kulüp içidir", () => {
    const r = validateMatchNoteInput({ body: "İyi servis" });
    expect(r.ok && r.value.visibility).toBe("club");
    const weird = validateMatchNoteInput({ body: "x", visibility: "everyone" });
    expect(weird.ok && weird.value.visibility).toBe("club");
  });
  it("public yalnızca açıkça istenirse", () => {
    const r = validateMatchNoteInput({ body: "x", visibility: "public" });
    expect(r.ok && r.value.visibility).toBe("public");
  });
  it("tarihi ve referansı doğrular", () => {
    expect(validateMatchNoteInput({ body: "x", match_date: "2026-02-30" }).ok).toBe(false);
    expect(validateMatchNoteInput({ body: "x", match_date: "04.10.2026" }).ok).toBe(false);
    expect(validateMatchNoteInput({ body: "x", match_date: "2026-10-04" }).ok).toBe(true);
    expect(validateMatchNoteInput({ body: "x", match_ref: "a b" }).ok).toBe(false);
    expect(validateMatchNoteInput({ body: "x", match_ref: "m_12-3" }).ok).toBe(true);
  });
  it("uzunluk sınırı", () => {
    expect(validateMatchNoteInput({ body: "x".repeat(4001) }).ok).toBe(false);
    expect(validateMatchNoteInput({ body: "   " }).ok).toBe(false);
  });
});

describe("validateApplicationInput", () => {
  it("geçerli başvuru", () => {
    const r = validateApplicationInput({ club_slug: "kulup-a", member_role: "coach", note: " merhaba " });
    expect(r).toEqual({ ok: true, value: { club_slug: "kulup-a", member_role: "coach", note: "merhaba" } });
  });
  it("admin rolü başvurusu yapılamaz", () => {
    expect(validateApplicationInput({ club_slug: "kulup-a", member_role: "admin" }).ok).toBe(false);
  });
  it("geçersiz slug reddedilir", () => {
    expect(validateApplicationInput({ club_slug: "../", member_role: "coach" }).ok).toBe(false);
  });
});
