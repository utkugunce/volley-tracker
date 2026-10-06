import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

function getValidSupabaseUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  const withProtocol = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withProtocol);
    return (parsed.protocol === "https:" || parsed.protocol === "http:") && Boolean(parsed.hostname)
      ? withProtocol
      : null;
  } catch {
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  if (process.env.NODE_ENV === "test" || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return false;
  }
  return Boolean(getValidSupabaseUrl());
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (cachedClient) return cachedClient;

  const validUrl = getValidSupabaseUrl();
  if (!validUrl) return null;

  cachedClient = createClient(
    validUrl,
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