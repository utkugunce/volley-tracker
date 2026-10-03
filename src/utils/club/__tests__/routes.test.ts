import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeFakeDb, type FakeCall } from "./fakeDb";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string; app_metadata?: Record<string, unknown> } | null,
  db: null as unknown,
  otp: vi.fn(async () => ({ error: null as null | { message: string; status?: number } })),
  exchange: vi.fn(async (_code: string) => ({ error: null as null | { message: string } })),
  verify: vi.fn(async (_args: unknown) => ({ error: null as null | { message: string } })),
  bearer: null as null | { user: { id: string }; role: string },
}));

vi.mock("@/utils/supabaseAdmin", () => ({ getSupabaseAdmin: () => state.db }));
vi.mock("@/utils/supabaseAuth", () => ({ getAuthenticatedUser: async () => state.bearer }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => undefined }) }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: {
      getUser: async () => (state.user ? { data: { user: state.user }, error: null } : { data: { user: null }, error: { message: "x" } }),
      signInWithOtp: state.otp,
      exchangeCodeForSession: state.exchange,
      verifyOtp: state.verify,
      signOut: async () => ({ error: null }),
    },
  }),
}));

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");
vi.stubEnv("ADMIN_TOKEN", "secret-admin-token");

import * as adminRoute from "@/app/api/admin/club-members/route";
import * as publicRoute from "@/app/api/club/public/route";
import * as magic from "@/app/api/auth/magic-link/route";
import * as apply from "@/app/api/panel/apply/route";
import * as me from "@/app/api/panel/me/route";
import { GET as callback } from "@/app/auth/callback/route";

const ID = "123e4567-e89b-12d3-a456-426614174000";
const json = (method: string, body: unknown, headers: Record<string, string> = {}, url = "https://site.test/api/x") =>
  new Request(url, { method, headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

beforeEach(() => {
  state.user = null;
  state.bearer = null;
  state.db = null;
  state.otp.mockClear();
  state.exchange.mockClear();
  state.verify.mockClear();
});

describe("admin club-members yetkisi", () => {
  const adminHeaders = { "x-admin-token": "secret-admin-token" };

  it("kimliksiz istek 401", async () => {
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    expect((await adminRoute.GET(new Request("https://site.test/api/admin/club-members"))).status).toBe(401);
    expect((await adminRoute.PATCH(json("PATCH", { id: ID, status: "approved" }))).status).toBe(401);
  });

  it("yanlış admin token 401", async () => {
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    const res = await adminRoute.PATCH(json("PATCH", { id: ID, status: "approved" }, { "x-admin-token": "wrong-token-x" }));
    expect(res.status).toBe(401);
  });

  it("kulüp üyesi (admin değil) başvuruyu onaylayamaz", async () => {
    const fake = makeFakeDb((c) => (c.table === "user_roles" ? { data: null, error: null } : { data: [], error: null }));
    state.db = fake.db;
    state.user = { id: "coach1", email: "c@k.com" };
    const res = await adminRoute.PATCH(json("PATCH", { id: ID, status: "approved" }));
    expect(res.status).toBe(401);
    expect(fake.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("Supabase editor rolü yeterli değil", async () => {
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    state.bearer = { user: { id: "e1" }, role: "editor" };
    const res = await adminRoute.GET(new Request("https://site.test/api/admin/club-members", { headers: { authorization: "Bearer abc" } }));
    expect(res.status).toBe(401);
  });

  it("ADMIN_TOKEN ile listeleme çalışır", async () => {
    state.db = makeFakeDb(() => ({ data: [{ id: ID, club_slug: "a" }], error: null })).db;
    const res = await adminRoute.GET(new Request("https://site.test/api/admin/club-members?status=pending", { headers: adminHeaders }));
    expect(res.status).toBe(200);
    expect((await res.json()).members).toHaveLength(1);
  });

  it("Supabase admin rolü (Bearer) ile onay çalışır", async () => {
    const fake = makeFakeDb((c: FakeCall) =>
      c.op === "update" ? { data: [{ id: ID, status: "approved" }], error: null } : { data: [{ id: ID, status: "pending" }], error: null }
    );
    state.db = fake.db;
    state.bearer = { user: { id: "admin1" }, role: "admin" };
    const res = await adminRoute.PATCH(json("PATCH", { id: ID, status: "approved" }, { authorization: "Bearer abc" }));
    expect(res.status).toBe(200);
    const upd = fake.calls.find((c) => c.op === "update");
    expect(upd?.payload).toMatchObject({ status: "approved", decided_by: "admin1" });
  });

  it("geçersiz durum geçişi 409, geçersiz filtre 400", async () => {
    state.db = makeFakeDb(() => ({ data: [{ id: ID, status: "approved" }], error: null })).db;
    const res = await adminRoute.PATCH(json("PATCH", { id: ID, status: "rejected" }, adminHeaders));
    expect(res.status).toBe(409);
    const bad = await adminRoute.GET(new Request("https://site.test/api/admin/club-members?status=hack", { headers: adminHeaders }));
    expect(bad.status).toBe(400);
  });

  it("admin rolü 'manager/coach' dışında bir rol atanamaz", async () => {
    state.db = makeFakeDb(() => ({ data: [{ id: ID, status: "pending" }], error: null })).db;
    const res = await adminRoute.PATCH(json("PATCH", { id: ID, member_role: "admin" }, adminHeaders));
    expect(res.status).toBe(400);
  });

  it("Supabase yoksa 503", async () => {
    state.db = null;
    expect((await adminRoute.GET(new Request("https://site.test/api/admin/club-members", { headers: adminHeaders }))).status).toBe(503);
  });

  it("CSRF: JSON olmayan PATCH 415", async () => {
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    const req = new Request("https://site.test/api/admin/club-members", { method: "PATCH", headers: { ...adminHeaders, "content-type": "text/plain" }, body: "x" });
    expect((await adminRoute.PATCH(req)).status).toBe(415);
  });
});

describe("GET /api/club/public", () => {
  it("özel (club) notları sorgulamaz; yalnız public notları ister", async () => {
    const fake = makeFakeDb((c) => ({ data: c.table === "match_notes" ? [{ id: "n1", body: "x" }] : [], error: null }));
    state.db = fake.db;
    const res = await publicRoute.GET(new Request("https://site.test/api/club/public?team=kulup-a", { headers: { "x-forwarded-for": "9.9.9.1" } }));
    const body = await res.json();
    expect(body.available).toBe(true);
    const noteQuery = fake.calls.find((c) => c.table === "match_notes");
    expect(noteQuery?.filters).toMatchObject({ visibility: "public", club_slug: "kulup-a" });
    const rosterQuery = fake.calls.find((c) => c.table === "club_roster_entries");
    expect(rosterQuery?.filters).toMatchObject({ is_visible: true });
    expect(res.headers.get("cache-control")).toContain("s-maxage");
  });

  it("kurulum eksikse boş ve başarılı yanıt (sayfa etkilenmez)", async () => {
    state.db = makeFakeDb(() => ({ data: null, error: { code: "PGRST205", message: "schema cache" } })).db;
    const res = await publicRoute.GET(new Request("https://site.test/api/club/public?team=kulup-a", { headers: { "x-forwarded-for": "9.9.9.2" } }));
    expect(res.status).toBe(200);
    expect((await res.json()).available).toBe(false);
  });

  it("Supabase yoksa boş yanıt; geçersiz slug 400", async () => {
    state.db = null;
    const ok = await publicRoute.GET(new Request("https://site.test/api/club/public?team=kulup-a", { headers: { "x-forwarded-for": "9.9.9.3" } }));
    expect((await ok.json()).available).toBe(false);
    const bad = await publicRoute.GET(new Request("https://site.test/api/club/public?team=../x", { headers: { "x-forwarded-for": "9.9.9.3" } }));
    expect(bad.status).toBe(400);
  });
});

describe("POST /api/auth/magic-link", () => {
  const req = (body: unknown, ip: string, headers: Record<string, string> = {}) =>
    json("POST", body, { "x-forwarded-for": ip, ...headers }, "https://site.test/api/auth/magic-link");

  it("geçersiz e-posta 400, OTP gönderilmez", async () => {
    const res = await magic.POST(req({ email: "abc" }, "1.1.1.1"));
    expect(res.status).toBe(400);
    expect(state.otp).not.toHaveBeenCalled();
  });

  it("başarılı istek: yönlendirme adresi güvenli ve callback'e gider", async () => {
    const res = await magic.POST(req({ email: "Ali@Kulup.com", next: "//evil.com" }, "1.1.1.2"));
    expect(res.status).toBe(200);
    const arg = (state.otp.mock.calls as unknown as [{ email: string; options: { emailRedirectTo: string } }][])[0][0];
    expect(arg.email).toBe("ali@kulup.com");
    expect(arg.options.emailRedirectTo).toBe("https://site.test/auth/callback?next=%2Fpanel");
  });

  it("aynı e-posta için hız sınırı (3/10dk) 429", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await magic.POST(req({ email: "limit@kulup.com" }, `2.2.2.${i}`))).status);
    expect(statuses.slice(0, 3)).toEqual([200, 200, 200]);
    expect(statuses[3]).toBe(429);
  });

  it("CSRF: başka origin 403", async () => {
    const res = await magic.POST(req({ email: "a@b.com" }, "1.1.1.3", { origin: "https://evil.test" }));
    expect(res.status).toBe(403);
  });

  it("Supabase hatası kullanıcıya iç ayrıntı vermez", async () => {
    state.otp.mockResolvedValueOnce({ error: { message: "SMTP secret failure host=10.0.0.1", status: 500 } });
    const res = await magic.POST(req({ email: "x@kulup.com" }, "1.1.1.4"));
    expect(res.status).toBe(502);
    expect(JSON.stringify(await res.json())).not.toContain("10.0.0.1");
  });
});

describe("GET /auth/callback", () => {
  const url = (qs: string) => new Request(`https://site.test/auth/callback?${qs}`);

  it("geçerli code: next yoluna 303 yönlendirir", async () => {
    const res = await callback(url("code=abc&next=%2Fpanel"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://site.test/panel");
    expect(state.exchange).toHaveBeenCalledWith("abc");
  });

  it("token_hash akışı çalışır", async () => {
    const res = await callback(url("token_hash=h&type=email"));
    expect(res.headers.get("location")).toBe("https://site.test/panel");
    expect(state.verify).toHaveBeenCalled();
  });

  it("açık yönlendirme engellenir", async () => {
    const res = await callback(url("code=abc&next=https%3A%2F%2Fevil.com"));
    expect(res.headers.get("location")).toBe("https://site.test/panel");
    const res2 = await callback(url("code=abc&next=%2F%2Fevil.com"));
    expect(res2.headers.get("location")).toBe("https://site.test/panel");
  });

  it("parametresiz veya hatalı kod giriş sayfasına hata ile döner", async () => {
    expect((await callback(url(""))).headers.get("location")).toBe("https://site.test/giris?hata=gecersiz");
    state.exchange.mockResolvedValueOnce({ error: { message: "expired" } });
    expect((await callback(url("code=bad"))).headers.get("location")).toBe("https://site.test/giris?hata=gecersiz");
    expect((await callback(url("token_hash=h&type=evil"))).headers.get("location")).toContain("hata=gecersiz");
  });
});

describe("POST /api/panel/apply ve GET /api/panel/me", () => {
  it("giriş yoksa 401", async () => {
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    expect((await apply.POST(json("POST", { club_slug: "kulup-a", member_role: "coach" }))).status).toBe(401);
  });

  it("başvuru pending olarak yazılır; istemci status gönderse de yok sayılır", async () => {
    const fake = makeFakeDb(() => ({ data: [], error: null }));
    state.db = fake.db;
    state.user = { id: "u9", email: "u9@k.com" };
    const res = await apply.POST(json("POST", { club_slug: "kulup-a", member_role: "manager", status: "approved" }));
    expect(res.status).toBe(201);
    const ins = fake.calls.find((c) => c.op === "insert");
    expect(ins?.payload).toMatchObject({ user_id: "u9", club_slug: "kulup-a", status: "pending", member_role: "manager" });
  });

  it("zaten üye/bekleyen başvuruda 409", async () => {
    state.db = makeFakeDb(() => ({ data: [{ id: "m", user_id: "u9", club_slug: "kulup-a", member_role: "coach", status: "pending" }], error: null })).db;
    state.user = { id: "u9", email: "u9@k.com" };
    expect((await apply.POST(json("POST", { club_slug: "kulup-a", member_role: "coach" }))).status).toBe(409);
  });

  it("me: yapılandırma yoksa not_configured, giriş yoksa unauthenticated, tablo yoksa setup_required", async () => {
    state.db = null;
    expect((await (await me.GET()).json()).state).toBe("not_configured");
    state.db = makeFakeDb(() => ({ data: [], error: null })).db;
    expect((await (await me.GET()).json()).state).toBe("unauthenticated");
    state.user = { id: "u1", email: "a@b.com" };
    state.db = makeFakeDb(() => ({ data: null, error: { code: "42P01", message: "x" } })).db;
    expect((await (await me.GET()).json()).state).toBe("setup_required");
    state.db = makeFakeDb(() => ({ data: [{ id: "m", club_slug: "a", member_role: "coach", status: "approved", user_id: "u1", note: "gizli" }], error: null })).db;
    const ready = await (await me.GET()).json();
    expect(ready.state).toBe("ready");
    expect(ready.memberships[0]).not.toHaveProperty("user_id");
  });
});
