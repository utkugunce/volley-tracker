import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";
import { isMissingSchemaError } from "@/utils/club/server";
import { validateClubSlug } from "@/utils/club/validation";

export const dynamic = "force-dynamic";

const limiter = new RateLimiter({ name: "club-public", windowMs: 60_000, maxRequests: 120 });

const EMPTY = { available: false, announcements: [], roster: [], notes: [] };

/**
 * Takım sayfasında gösterilen herkese açık kulüp içeriği: duyurular, görünür kadro satırları ve
 * "herkese açık" işaretli maç notları. Özel (club) notlar ASLA dönmez. Kurulum eksikse boş döner.
 */
export async function GET(request: Request) {
  const slug = validateClubSlug(new URL(request.url).searchParams.get("team"));
  if (!slug.ok) return NextResponse.json({ error: slug.error }, { status: 400 });

  const rate = await limiter.check(getClientIp(request));
  if (!rate.allowed) {
    return NextResponse.json(EMPTY, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds || 60) } });
  }

  const db = getSupabaseAdmin();
  const headers = { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" };
  if (!db) return NextResponse.json(EMPTY, { headers });

  const nowIso = `${new Date().toISOString().slice(0, 19)}Z`;
  const [ann, roster, notes] = await Promise.all([
    db
      .from("club_announcements")
      .select("id, title, body, pinned, created_at")
      .eq("club_slug", slug.value)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("club_roster_entries")
      .select("id, name, shirt_number, position, height_cm, birth_year, is_staff")
      .eq("club_slug", slug.value)
      .eq("is_visible", true)
      .order("is_staff", { ascending: true })
      .order("shirt_number", { ascending: true })
      .limit(100),
    db
      .from("match_notes")
      .select("id, opponent, match_date, body, created_at")
      .eq("club_slug", slug.value)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const error = ann.error || roster.error || notes.error;
  if (error) {
    if (!isMissingSchemaError(error)) console.error("[club] public content", error);
    return NextResponse.json(EMPTY, { headers: { "Cache-Control": "public, s-maxage=30" } });
  }

  return NextResponse.json(
    { available: true, announcements: ann.data ?? [], roster: roster.data ?? [], notes: notes.data ?? [] },
    { headers }
  );
}
