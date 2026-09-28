import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/utils/supabaseClient";
import type { User, Session } from "@supabase/supabase-js";
import type { AppRole } from "@/utils/supabaseAuth";

export function useAuthSession() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>("viewer");
  const [loading, setLoading] = useState(true);

  const supabase = getSupabaseClient();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Get role from user metadata
      if (session?.user) {
        const userRole = session.user.app_metadata?.role as AppRole || "viewer";
        setRole(userRole);
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const userRole = session.user.app_metadata?.role as AppRole || "viewer";
        setRole(userRole);
      } else {
        setRole("viewer");
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const getAccessToken = async (): Promise<string | null> => {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  };

  const refreshSession = async (): Promise<void> => {
    if (!supabase) return;
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Session refresh failed:", error);
    }
  };

  const signOut = async (): Promise<void> => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
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
  };

  return {
    user,
    session,
    role,
    loading,
    getAccessToken,
    refreshSession,
    signOut,
    signIn,
  };
}
