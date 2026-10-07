/**
 * Kulüp kaynakları (kadro / duyuru / maç notu) için ortak, yetkilendirmesi sunucuda yapılan
 * CRUD route üreticisi. Her mutasyon: CSRF koruması -> oturum -> onaylı üyelik + rol izni ->
 * girdi doğrulama -> kullanıcı başına hız sınırı -> veritabanı.
 *
 * Kayıt güncellenirken/silinirken kulüp bilgisi istemciden DEĞİL, veritabanındaki satırdan alınır;
 * böylece başka kulübün kaydına kimlik uydurularak erişilemez.
 */
import { NextResponse } from "next/server";
import type { ClubAction } from "./permissions";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import {
  authorizeClubAction,
  isAuthConfigured,
  notConfiguredResponse,
  checkMutationRate,
  dbErrorResponse,
  guardMutation,
  readJsonBody,
} from "./server";
import { validateClubSlug, validateUuid, type ValidationResult } from "./validation";

export interface ClubResourceConfig<TInput extends object> {
  table: string;
  label: string;
  readAction: ClubAction;
  writeAction: ClubAction;
  maxRowsPerClub: number;
  columns: string;
  orderBy: { column: string; ascending: boolean }[];
  validate: (input: unknown) => ValidationResult<TInput>;
}

const PAGE_LIMIT = 300;

type AuthorizedOk = Extract<Awaited<ReturnType<typeof authorizeClubAction>>, { ok: true }>;
type Target = { ok: false; response: NextResponse } | { ok: true; auth: AuthorizedOk; id: string; clubSlug: string };

function bad(error: string, status = 400): NextResponse {
  return NextResponse.json({ error }, { status });
}

export function createClubResourceHandlers<TInput extends object>(config: ClubResourceConfig<TInput>) {
  async function GET(request: Request) {
    const club = validateClubSlug(new URL(request.url).searchParams.get("club"));
    if (!club.ok) return bad(club.error);

    const auth = await authorizeClubAction(club.value, config.readAction);
    if (!auth.ok) return auth.response;

    let query = auth.db.from(config.table).select(config.columns).eq("club_slug", club.value);
    for (const order of config.orderBy) query = query.order(order.column, { ascending: order.ascending });
    const { data, error } = await query.limit(PAGE_LIMIT);
    if (error) return dbErrorResponse(error, `${config.label} list`);

    const res = NextResponse.json({ items: data ?? [] });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  }

  async function POST(request: Request) {
    const blocked = guardMutation(request);
    if (blocked) return blocked;
    const body = (await readJsonBody(request)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return bad("Geçersiz istek gövdesi.");

    const club = validateClubSlug(body.club_slug);
    if (!club.ok) return bad(club.error);

    const auth = await authorizeClubAction(club.value, config.writeAction);
    if (!auth.ok) return auth.response;

    const limited = await checkMutationRate(auth.user.id);
    if (limited) return limited;

    const parsed = config.validate(body);
    if (!parsed.ok) return bad(parsed.error, 422);

    const { count, error: countError } = await auth.db
      .from(config.table)
      .select("id", { count: "exact", head: true })
      .eq("club_slug", club.value);
    if (countError) return dbErrorResponse(countError, `${config.label} count`);
    if ((count ?? 0) >= config.maxRowsPerClub) {
      return bad(`${config.label} için en fazla ${config.maxRowsPerClub} kayıt eklenebilir.`, 409);
    }

    const { data, error } = await auth.db
      .from(config.table)
      .insert({ ...parsed.value, club_slug: club.value, created_by: auth.user.id })
      .select(config.columns)
      .single();
    if (error) return dbErrorResponse(error, `${config.label} insert`);
    return NextResponse.json({ item: data }, { status: 201 });
  }

  /**
   * İstemcinin gönderdiği kayıt kimliğinin gerçek kulübünü DB'den çözer ve yetkiyi o kulüpte arar.
   * Kayıt yoksa, olmayan bir kulüp için yetki denenir: giriş yapmamışsa 401, üye değilse 403 döner;
   * böylece kayıt varlığı yetkisiz kişilere sızdırılmaz.
   */
  async function resolveTarget(body: Record<string, unknown>): Promise<Target> {
    const id = validateUuid(body.id);
    if (!id.ok) return { ok: false, response: bad(id.error) };

    const db = getSupabaseAdmin();
    if (!db || !isAuthConfigured()) return { ok: false, response: notConfiguredResponse() };

    const { data: row, error } = await db
      .from(config.table)
      .select("id, club_slug")
      .eq("id", id.value)
      .maybeSingle();
    if (error) return { ok: false, response: dbErrorResponse(error, `${config.label} lookup`) };

    const clubSlug = typeof row?.club_slug === "string" ? row.club_slug : "";
    const auth = await authorizeClubAction(clubSlug, config.writeAction);
    if (!auth.ok) return { ok: false, response: auth.response };
    if (!row) return { ok: false, response: bad("Kayıt bulunamadı.", 404) };
    return { ok: true, auth, id: id.value, clubSlug };
  }

  async function PUT(request: Request): Promise<NextResponse> {
    const blocked = guardMutation(request);
    if (blocked) return blocked;
    const body = (await readJsonBody(request)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return bad("Geçersiz istek gövdesi.");

    const target = await resolveTarget(body);
    if (!target.ok) return target.response;

    const limited = await checkMutationRate(target.auth.user.id);
    if (limited) return limited;

    const parsed = config.validate(body);
    if (!parsed.ok) return bad(parsed.error, 422);

    const { data, error } = await target.auth.db
      .from(config.table)
      .update({ ...parsed.value, updated_at: new Date().toISOString() })
      .eq("id", target.id)
      .eq("club_slug", target.clubSlug)
      .select(config.columns)
      .maybeSingle();
    if (error) return dbErrorResponse(error, `${config.label} update`);
    if (!data) return bad("Kayıt bulunamadı.", 404);
    return NextResponse.json({ item: data });
  }

  async function DELETE(request: Request): Promise<NextResponse> {
    const blocked = guardMutation(request);
    if (blocked) return blocked;
    const body = (await readJsonBody(request)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") return bad("Geçersiz istek gövdesi.");

    const target = await resolveTarget(body);
    if (!target.ok) return target.response;

    const limited = await checkMutationRate(target.auth.user.id);
    if (limited) return limited;

    const { error } = await target.auth.db
      .from(config.table)
      .delete()
      .eq("id", target.id)
      .eq("club_slug", target.clubSlug);
    if (error) return dbErrorResponse(error, `${config.label} delete`);
    return NextResponse.json({ ok: true });
  }

  return { GET, POST, PUT, DELETE };
}
