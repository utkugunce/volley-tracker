import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  authorizeAdmin,
  dbErrorResponse,
  guardMutation,
  readJsonBody,
} from "@/utils/club/server";
import {
  canTransitionStatus,
  isMemberRole,
  isMemberStatus,
  type MemberStatus,
} from "@/utils/club/permissions";
import { normalizeEmail, validateClubSlug, validateUuid } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

const COLUMNS = "id, user_id, email, club_slug, member_role, status, note, requested_at, decided_at, decided_by";

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** Yönetici: kulüp üyeliği başvurularını listeler. */
export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const statusParam = new URL(request.url).searchParams.get("status");
  let query = auth.db.from("club_members").select(COLUMNS).order("requested_at", { ascending: false }).limit(500);
  if (statusParam) {
    if (!isMemberStatus(statusParam)) return bad("Geçersiz durum filtresi.");
    query = query.eq("status", statusParam);
  }
  const { data, error } = await query;
  if (error) return dbErrorResponse(error, "admin list");
  return NextResponse.json({ members: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

async function findUserIdByEmail(db: SupabaseClient, email: string): Promise<string | null> {
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

/** Yönetici: e-posta ile mevcut bir kullanıcıyı doğrudan bir kulübe bağlar (onaylı). */
export async function POST(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const body = (await readJsonBody(request, 4_000)) as Record<string, unknown> | null;
  if (!body) return bad("Geçersiz istek gövdesi.");
  const email = normalizeEmail(body.email);
  if (!email.ok) return bad(email.error);
  const club = validateClubSlug(body.club_slug);
  if (!club.ok) return bad(club.error);
  if (!isMemberRole(body.member_role)) return bad("Rol 'manager' veya 'coach' olmalı.");

  try {
    const userId = await findUserIdByEmail(auth.db, email.value);
    if (!userId) return bad("Bu e-posta ile kayıtlı kullanıcı yok. Önce /giris sayfasından giriş yapmasını isteyin.", 404);

    const { data, error } = await auth.db
      .from("club_members")
      .upsert(
        {
          user_id: userId,
          email: email.value,
          club_slug: club.value,
          member_role: body.member_role,
          status: "approved",
          decided_at: new Date().toISOString(),
          decided_by: auth.actor,
        },
        { onConflict: "user_id,club_slug" }
      )
      .select(COLUMNS)
      .single();
    if (error) return dbErrorResponse(error, "admin link");
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (error) {
    return dbErrorResponse(error, "admin link user lookup");
  }
}

/** Yönetici: başvuruyu onayla / reddet / iptal et, rolü veya bağlı kulübü değiştir. */
export async function PATCH(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const body = (await readJsonBody(request, 4_000)) as Record<string, unknown> | null;
  if (!body) return bad("Geçersiz istek gövdesi.");
  const id = validateUuid(body.id);
  if (!id.ok) return bad(id.error);

  const updates: Record<string, unknown> = {};
  if (body.member_role !== undefined) {
    if (!isMemberRole(body.member_role)) return bad("Rol 'manager' veya 'coach' olmalı.");
    updates.member_role = body.member_role;
  }
  if (body.club_slug !== undefined) {
    const club = validateClubSlug(body.club_slug);
    if (!club.ok) return bad(club.error);
    updates.club_slug = club.value;
  }

  const { data: current, error: findError } = await auth.db
    .from("club_members")
    .select("id, status")
    .eq("id", id.value)
    .maybeSingle();
  if (findError) return dbErrorResponse(findError, "admin find");
  if (!current) return bad("Kayıt bulunamadı.", 404);

  if (body.status !== undefined) {
    if (!isMemberStatus(body.status)) return bad("Geçersiz durum.");
    const from = current.status as MemberStatus;
    if (body.status !== from && !canTransitionStatus(from, body.status)) {
      return bad(`'${from}' durumundan '${body.status}' durumuna geçilemez.`, 409);
    }
    updates.status = body.status;
    updates.decided_at = new Date().toISOString();
    updates.decided_by = auth.actor;
  }
  if (Object.keys(updates).length === 0) return bad("Değiştirilecek alan yok.");

  const { data, error } = await auth.db
    .from("club_members")
    .update(updates)
    .eq("id", id.value)
    .select(COLUMNS)
    .maybeSingle();
  if (error) return dbErrorResponse(error, "admin update");
  if (!data) return bad("Kayıt bulunamadı.", 404);
  return NextResponse.json({ member: data });
}

export async function DELETE(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;
  const auth = await authorizeAdmin(request);
  if (!auth.ok) return auth.response;

  const body = (await readJsonBody(request, 2_000)) as Record<string, unknown> | null;
  const id = validateUuid(body?.id);
  if (!id.ok) return bad(id.error);

  const { error } = await auth.db.from("club_members").delete().eq("id", id.value);
  if (error) return dbErrorResponse(error, "admin delete");
  return NextResponse.json({ ok: true });
}
