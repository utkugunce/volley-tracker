import { describe, it, expect, vi, afterEach } from "vitest";
import {
  authorizeClubAction,
  guardMutation,
  isAuthConfigured,
  isMissingSchemaError,
} from "../server";
import { makeFakeDb } from "./fakeDb";

afterEach(() => {
  vi.unstubAllEnvs();
});

const user = { id: "u1", email: "a@b.com" } as never;

describe("isMissingSchemaError", () => {
  it("tablo yok hatalarını tanır", () => {
    expect(isMissingSchemaError({ code: "42P01", message: "x" })).toBe(true);
    expect(isMissingSchemaError({ code: "PGRST205", message: "x" })).toBe(true);
    expect(isMissingSchemaError({ message: "Could not find the table 'public.club_members' in the schema cache" })).toBe(true);
    expect(isMissingSchemaError({ message: 'relation "club_members" does not exist' })).toBe(true);
  });
  it("diğer hataları tanımaz", () => {
    expect(isMissingSchemaError({ code: "23505", message: "duplicate" })).toBe(false);
    expect(isMissingSchemaError(null)).toBe(false);
    expect(isMissingSchemaError("x")).toBe(false);
  });
});

describe("isAuthConfigured", () => {
  it("URL ve anon anahtar yoksa false", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(isAuthConfigured()).toBe(false);
  });
  it("geçersiz URL false, geçerli true", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "k");
    expect(isAuthConfigured()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    expect(isAuthConfigured()).toBe(true);
  });
});

describe("guardMutation (CSRF)", () => {
  const mk = (headers: Record<string, string>) => new Request("https://site.test/api/panel/roster", { method: "POST", headers });
  it("JSON olmayan içerik türünü 415 ile reddeder", () => {
    expect(guardMutation(mk({ "content-type": "text/plain" }))?.status).toBe(415);
    expect(guardMutation(mk({ "content-type": "application/x-www-form-urlencoded" }))?.status).toBe(415);
  });
  it("farklı kaynaktan gelen isteği 403 ile reddeder", () => {
    expect(guardMutation(mk({ "content-type": "application/json", origin: "https://evil.test" }))?.status).toBe(403);
  });
  it("aynı kaynak + JSON geçer", () => {
    expect(guardMutation(mk({ "content-type": "application/json", origin: "https://site.test" }))).toBeNull();
    expect(guardMutation(mk({ "content-type": "application/json" }))).toBeNull();
  });
});

describe("authorizeClubAction", () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");

  const dbWith = (rows: unknown[] | null, error: unknown = null) =>
    makeFakeDb(() => ({ data: rows, error })).db;

  const setEnv = () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
  };

  it("Supabase yoksa 503 not_configured", async () => {
    setEnv();
    const r = await authorizeClubAction("kulup-a", "roster:read", { getDb: () => null, getUser: async () => user });
    expect(!r.ok && r.response.status).toBe(503);
    expect(!r.ok && (await r.response.json()).code).toBe("not_configured");
  });

  it("oturum yoksa 401", async () => {
    setEnv();
    const r = await authorizeClubAction("kulup-a", "roster:read", { getDb: () => dbWith([]), getUser: async () => null });
    expect(!r.ok && r.response.status).toBe(401);
  });

  it("onaylı üyelik yoksa 403", async () => {
    setEnv();
    const pending = [{ id: "m", user_id: "u1", club_slug: "kulup-a", member_role: "manager", status: "pending" }];
    const r = await authorizeClubAction("kulup-a", "roster:write", { getDb: () => dbWith(pending), getUser: async () => user });
    expect(!r.ok && r.response.status).toBe(403);
  });

  it("başka kulübün üyesi 403", async () => {
    setEnv();
    const other = [{ id: "m", user_id: "u1", club_slug: "kulup-b", member_role: "manager", status: "approved" }];
    const r = await authorizeClubAction("kulup-a", "roster:write", { getDb: () => dbWith(other), getUser: async () => user });
    expect(!r.ok && r.response.status).toBe(403);
  });

  it("antrenör duyuru yazmaya çalışırsa 403, kadro yazabilir", async () => {
    setEnv();
    const coach = [{ id: "m", user_id: "u1", club_slug: "kulup-a", member_role: "coach", status: "approved" }];
    const deps = { getDb: () => dbWith(coach), getUser: async () => user };
    const denied = await authorizeClubAction("kulup-a", "announcement:write", deps);
    expect(!denied.ok && denied.response.status).toBe(403);
    const allowed = await authorizeClubAction("kulup-a", "roster:write", deps);
    expect(allowed.ok).toBe(true);
  });

  it("tablo yoksa 503 setup_required", async () => {
    setEnv();
    const r = await authorizeClubAction("kulup-a", "roster:read", {
      getDb: () => dbWith(null, { code: "PGRST205", message: "Could not find the table" }),
      getUser: async () => user,
    });
    expect(!r.ok && r.response.status).toBe(503);
    expect(!r.ok && (await r.response.json()).code).toBe("setup_required");
  });
});
