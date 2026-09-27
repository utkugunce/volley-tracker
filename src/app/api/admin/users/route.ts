import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export async function GET(request: Request) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser || authenticatedUser.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase yapılandırılmamış" }, { status: 503 });
  }

  try {
    // Get all users with their roles
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    // Get user roles
    const { data: userRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role, created_at, updated_at");
    if (rolesError) throw rolesError;

    // Merge users with roles
    const usersWithRoles = users.users.map((user) => {
      const roleData = userRoles?.find((r) => r.user_id === user.id);
      return {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        role: roleData?.role || user.app_metadata?.role || "viewer",
        role_updated_at: roleData?.updated_at,
      };
    });

    return NextResponse.json({ users: usersWithRoles });
  } catch (error: any) {
    console.error("Kullanıcı listesi hatası:", error);
    return NextResponse.json(
      { error: error.message || "Kullanıcı listesi alınamadı" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser || authenticatedUser.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase yapılandırılmamış" }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, password, role = "viewer" } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email ve şifre gerekli" },
        { status: 400 }
      );
    }

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Geçersiz rol. admin, editor veya viewer olmalı" },
        { status: 400 }
      );
    }

    // Create user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError) throw userError;

    // Set role in user_roles table
    if (userData.user) {
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: userData.user.id,
        role,
      });

      if (roleError) throw roleError;
    }

    return NextResponse.json({
      user: {
        id: userData.user?.id,
        email: userData.user?.email,
        role,
      },
    });
  } catch (error: any) {
    console.error("Kullanıcı oluşturma hatası:", error);
    return NextResponse.json(
      { error: error.message || "Kullanıcı oluşturulamadı" },
      { status: 500 }
    );
  }
}
