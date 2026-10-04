import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import {
  fetchMemberships,
  getSessionUser,
  isAuthConfigured,
  isMissingSchemaError,
} from "@/utils/club/server";

export const dynamic = "force-dynamic";

/** Panel durumu: kurulum eksik mi, giriş var mı, hangi kulüplere üyelik var. Gizli anahtar döndürmez. */
export async function GET() {
  const noStore = { headers: { "Cache-Control": "private, no-store" } };
  const db = getSupabaseAdmin();
  if (!db || !isAuthConfigured()) {
    return NextResponse.json({ state: "not_configured" }, noStore);
  }

  const user = await getSessionUser().catch(() => null);
  if (!user) return NextResponse.json({ state: "unauthenticated" }, noStore);

  const { memberships, error } = await fetchMemberships(db, user.id);
  if (error) {
    if (isMissingSchemaError(error)) {
      return NextResponse.json({ state: "setup_required", user: { email: user.email ?? null } }, noStore);
    }
    console.error("[club] me lookup", error);
    return NextResponse.json({ error: "Durum alınamadı." }, { status: 500 });
  }

  return NextResponse.json(
    {
      state: "ready",
      user: { email: user.email ?? null },
      memberships: memberships.map((m) => ({
        id: m.id,
        club_slug: m.club_slug,
        member_role: m.member_role,
        status: m.status,
      })),
    },
    noStore
  );
}
