import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import {
  checkMutationRate,
  dbErrorResponse,
  fetchMemberships,
  getSessionUser,
  guardMutation,
  isAuthConfigured,
  notConfiguredResponse,
  readJsonBody,
} from "@/utils/club/server";
import { validateApplicationInput } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

const MAX_OPEN_APPLICATIONS = 3;

/** Giriş yapmış kullanıcı bir kulüp için başvuru oluşturur; onayı yalnızca yönetici verir. */
export async function POST(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;

  const db = getSupabaseAdmin();
  if (!db || !isAuthConfigured()) return notConfiguredResponse();

  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Giriş yapmanız gerekiyor." }, { status: 401 });

  const limited = await checkMutationRate(user.id);
  if (limited) return limited;

  const parsed = validateApplicationInput(await readJsonBody(request, 4_000));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });

  const { memberships, error: listError } = await fetchMemberships(db, user.id);
  if (listError) return dbErrorResponse(listError, "apply list");

  const existing = memberships.find((m) => m.club_slug === parsed.value.club_slug);
  if (existing && existing.status !== "rejected") {
    return NextResponse.json(
      { error: existing.status === "approved" ? "Bu kulübe zaten üyesiniz." : "Bu kulüp için başvurunuz zaten var." },
      { status: 409 }
    );
  }
  if (memberships.filter((m) => m.status === "pending").length >= MAX_OPEN_APPLICATIONS) {
    return NextResponse.json({ error: "En fazla 3 bekleyen başvurunuz olabilir." }, { status: 409 });
  }

  const row = {
    user_id: user.id,
    email: user.email ?? null,
    club_slug: parsed.value.club_slug,
    member_role: parsed.value.member_role,
    note: parsed.value.note,
    status: "pending",
    requested_at: new Date().toISOString(),
    decided_at: null,
    decided_by: null,
  };

  const query = existing
    ? db.from("club_members").update(row).eq("id", existing.id).eq("user_id", user.id)
    : db.from("club_members").insert(row);
  const { error } = await query;
  if (error) return dbErrorResponse(error, "apply write");

  return NextResponse.json({ ok: true }, { status: 201 });
}
