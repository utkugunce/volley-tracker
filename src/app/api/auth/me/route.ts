import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";

export async function GET(request: Request) {
  const authenticated = await getAuthenticatedUser(request);
  if (!authenticated) {
    return NextResponse.json({ error: "Geçersiz veya eksik oturum" }, { status: 401 });
  }

  return NextResponse.json({
    user: {
      id: authenticated.user.id,
      email: authenticated.user.email || null,
    },
    role: authenticated.role,
  });
}