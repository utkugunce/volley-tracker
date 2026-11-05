import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export type AppRole = "admin" | "editor" | "viewer";

export interface AuthenticatedUser {
  user: User;
  role: AppRole;
}

function getAccessToken(request: Request): string | null {
  const legacyHeader = request.headers.get("x-admin-token");
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearerToken) return bearerToken;
  if (legacyHeader) return legacyHeader;
  return null;
}

function isAppRole(value: unknown): value is AppRole {
  return value === "admin" || value === "editor" || value === "viewer";
}

export async function getAuthenticatedUser(
  request: Request
): Promise<AuthenticatedUser | null> {
  const token = getAccessToken(request);
  const supabase = getSupabaseAdmin();
  if (!token || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const { data: roleRow, error: roleError } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!roleError && isAppRole(roleRow?.role)) {
    return { user: data.user, role: roleRow.role };
  }

  return { user: data.user, role: "viewer" };
}