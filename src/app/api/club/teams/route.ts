import { NextResponse } from "next/server";
import { getAllTeamsList } from "@/utils/teamData";

// Derleme sırasında üretilir (çalışma zamanında dosya okunmaz); başvuru formundaki takım seçimi içindir.
export const dynamic = "force-static";

export async function GET() {
  const teams = getAllTeamsList().map((t) => ({ name: t.name, slug: t.slug, city: t.city }));
  return NextResponse.json({ teams });
}
