import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (process.env.NODE_ENV === "test" || !supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }

  try {
    const parsedUrl = new URL(supabaseUrl);
    return (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") && Boolean(parsedUrl.hostname);
  } catch {
    return false;
  }
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  cachedClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  return cachedClient;
}