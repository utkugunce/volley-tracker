import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeFakeDb, type FakeCall } from "./fakeDb";

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  db: null as unknown,
}));

vi.mock("@/utils/supabaseAdmin", () => ({ getSupabaseAdmin: () => state.db }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => [], set: () => undefined }) }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser: async () => (state.user ? { data: { user: state.user }, error: null } : { data: { user: null }, error: { message: "no session" } }) },
  }),
}));

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abc.supabase.co");
vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon-key");

import { GET, POST, PUT, DELETE } from "@/app/api/panel/roster/route";
import * as announcements from "@/app/api/panel/announcements/route";
import * as notes from "@/app/api/panel/notes/route";

const ID_A = "123e4567-e89b-12d3-a456-426614174000";
const ROW_A = { id: ID_A, club_slug: "kulup-a" };

function membership(slug: string, role: "manager" | "coach", status = "approved") {
  return { id: "mem", user_id: "u1", club_slug: slug, member_role: role, status };
}

function setup(opts: { memberships?: unknown[]; rows?: Record<string, unknown[]>; user?: { id: string; email: string } | null }) {
  state.user = opts.user === undefined ? { id: "u1", email: "a@b.com" } : opts.user;
  const fake = makeFakeDb((call: FakeCall) => {
    if (call.table === "club_members") return { data: opts.memberships ?? [], error: null };
    if (call.op === "select" && call.filters.club_slug && !call.filters.id) return { data: opts.rows?.[call.table] ?? [], error: null, count: 0 };
    if (call.op === "select") return { data: opts.rows?.[call.table] ?? [], error: null };
    if (call.op === "insert") return { data: [{ id: ID_A, ...(call.payload as object) }], error: null };
    if (call.op === "update") return { data: [{ id: ID_A, ...(call.payload as object) }], error: null };
    return { data: null, error: null };
  });
  state.db = fake.db;
  return fake;
}

const json = (method: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://site.test/api/panel/x", {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  state.user = null;
  state.db = null;
});

describe("POST /api/panel/roster", () => {
  it("giriş yoksa 401", async () => {
    setup({ user: null });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(401);
  });

  it("üye olmayan kullanıcı 403", async () => {
    const fake = setup({ memberships: [] });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(403);
    expect(fake.calls.some((c) => c.op === "insert")).toBe(false);
  });

  it("bekleyen (onaylanmamış) başvuru sahibi 403", async () => {
    setup({ memberships: [membership("kulup-a", "manager", "pending")] });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(403);
  });

  it("başka kulübün yöneticisi 403", async () => {
    setup({ memberships: [membership("kulup-b", "manager")] });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(403);
  });

  it("JSON olmayan içerik türü 415, yanlış origin 403 (yetki kontrolünden önce)", async () => {
    setup({ memberships: [membership("kulup-a", "manager")] });
    const form = new Request("https://site.test/api/panel/x", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" });
    expect((await POST(form)).status).toBe(415);
    const cross = json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }, { origin: "https://evil.test" });
    expect((await POST(cross)).status).toBe(403);
  });

  it("geçersiz girdi 422", async () => {
    setup({ memberships: [membership("kulup-a", "coach")] });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "A", shirt_number: 500 }));
    expect(res.status).toBe(422);
  });

  it("geçersiz kulüp slug'ı 400", async () => {
    setup({ memberships: [membership("kulup-a", "coach")] });
    const res = await POST(json("POST", { club_slug: "../etc", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(400);
  });

  it("yetkili antrenör kayıt ekler; created_by sunucudan gelir, istemci alanları yok sayılır", async () => {
    const fake = setup({ memberships: [membership("kulup-a", "coach")] });
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz", created_by: "hacker", is_visible: true }));
    expect(res.status).toBe(201);
    const insert = fake.calls.find((c) => c.op === "insert");
    expect(insert?.payload).toMatchObject({ club_slug: "kulup-a", created_by: "u1", name: "Ayşe Yılmaz" });
  });

  it("kulüp başına kayıt sınırı aşılırsa 409", async () => {
    const fake = makeFakeDb((call) => {
      if (call.table === "club_members") return { data: [membership("kulup-a", "manager")], error: null };
      return { data: null, error: null, count: 200 };
    });
    state.user = { id: "u1", email: "a@b.com" };
    state.db = fake.db;
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(409);
  });

  it("migration yoksa 503 setup_required", async () => {
    const fake = makeFakeDb(() => ({ data: null, error: { code: "PGRST205", message: "Could not find the table 'public.club_members' in the schema cache" } }));
    state.user = { id: "u1", email: "a@b.com" };
    state.db = fake.db;
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("setup_required");
  });

  it("Supabase ortamı yoksa 503 not_configured", async () => {
    state.user = { id: "u1", email: "a@b.com" };
    state.db = null;
    const res = await POST(json("POST", { club_slug: "kulup-a", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("not_configured");
  });
});

describe("PUT/DELETE kimlik uydurma", () => {
  it("başka kulübün kaydını güncellemeye çalışan kullanıcı 403 alır", async () => {
    const fake = setup({
      memberships: [membership("kulup-b", "manager")],
      rows: { club_roster_entries: [ROW_A] },
    });
    const res = await PUT(json("PUT", { id: ID_A, club_slug: "kulup-b", name: "Ayşe Yılmaz" }));
    expect(res.status).toBe(403);
    expect(fake.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("kendi kulübünün kaydını günceller ve güncellemeyi kulüp filtresiyle sınırlar", async () => {
    const fake = setup({
      memberships: [membership("kulup-a", "coach")],
      rows: { club_roster_entries: [ROW_A] },
    });
    const res = await PUT(json("PUT", { id: ID_A, name: "Yeni İsim" }));
    expect(res.status).toBe(200);
    const upd = fake.calls.find((c) => c.op === "update");
    expect(upd?.filters).toMatchObject({ id: ID_A, club_slug: "kulup-a" });
  });

  it("olmayan kayıt, üye olmayan birine 403 (varlık sızdırılmaz)", async () => {
    setup({ memberships: [], rows: { club_roster_entries: [] } });
    const res = await DELETE(json("DELETE", { id: ID_A }));
    expect(res.status).toBe(403);
  });

  it("geçersiz id 400", async () => {
    setup({ memberships: [membership("kulup-a", "manager")] });
    const res = await DELETE(json("DELETE", { id: "1 or 1=1" }));
    expect(res.status).toBe(400);
  });

  it("yetkili silme kulüp filtresiyle yapılır", async () => {
    const fake = setup({ memberships: [membership("kulup-a", "manager")], rows: { club_roster_entries: [ROW_A] } });
    const res = await DELETE(json("DELETE", { id: ID_A }));
    expect(res.status).toBe(200);
    expect(fake.calls.find((c) => c.op === "delete")?.filters).toMatchObject({ id: ID_A, club_slug: "kulup-a" });
  });
});

describe("GET /api/panel/roster", () => {
  it("üye olmayan okuyamaz", async () => {
    setup({ memberships: [] });
    const res = await GET(new Request("https://site.test/api/panel/roster?club=kulup-a"));
    expect(res.status).toBe(403);
  });
  it("üye listeyi alır ve yanıt önbelleğe alınmaz", async () => {
    setup({ memberships: [membership("kulup-a", "coach")], rows: { club_roster_entries: [ROW_A] } });
    const res = await GET(new Request("https://site.test/api/panel/roster?club=kulup-a"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

describe("duyuru ve notlar", () => {
  it("antrenör duyuru yayınlayamaz (403), yönetici yayınlayabilir (201)", async () => {
    setup({ memberships: [membership("kulup-a", "coach")] });
    const body = { club_slug: "kulup-a", title: "Antrenman", body: "Salı 18:00" };
    expect((await announcements.POST(json("POST", body))).status).toBe(403);
    setup({ memberships: [membership("kulup-a", "manager")] });
    expect((await announcements.POST(json("POST", body))).status).toBe(201);
  });

  it("maç notu varsayılan olarak kulüp içidir", async () => {
    const fake = setup({ memberships: [membership("kulup-a", "coach")] });
    const res = await notes.POST(json("POST", { club_slug: "kulup-a", body: "Servis kabulü zayıftı" }));
    expect(res.status).toBe(201);
    expect(fake.calls.find((c) => c.op === "insert")?.payload).toMatchObject({ visibility: "club" });
  });
});
