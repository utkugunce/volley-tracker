import { NextResponse } from "next/server";
import { createSessionClient, guardMutation } from "@/utils/club/server";

export async function POST(request: Request) {
  const blocked = guardMutation(request);
  if (blocked) return blocked;

  const client = await createSessionClient();
  if (client) {
    await client.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
