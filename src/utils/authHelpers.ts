import { getSupabaseClient } from "@/utils/supabaseClient";

/**
 * Auth helper functions for client-side authentication
 */

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.refreshSession();
  if (error) {
    console.error("Token refresh failed:", error);
    return null;
  }

  return data.session?.access_token || null;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAccessToken();
  return token !== null;
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase yapılandırılmamış" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

export async function signUp(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { error: "Supabase yapılandırılmamış" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
