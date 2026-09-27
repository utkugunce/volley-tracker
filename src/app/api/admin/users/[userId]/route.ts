import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
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
    const { role } = body;

    if (!["admin", "editor", "viewer"].includes(role)) {
      return NextResponse.json(
        { error: "Geçersiz rol. admin, editor veya viewer olmalı" },
        { status: 400 }
      );
    }

    const userId = params.userId;

    // Prevent admin from changing their own role
    if (userId === authenticatedUser.user.id) {
      return NextResponse.json(
        { error: "Kendi rolünüzü değiştiremezsiniz" },
        { status: 400 }
      );
    }

    // Update role in user_roles table
    const { data: existingRole, error: selectError } = await supabase
      .from("user_roles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from("user_roles")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("user_id", userId);

      if (updateError) throw updateError;
    } else {
      // Insert new role
      const { error: insertError } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
      });

      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error("Rol güncelleme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Rol güncellenemedi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const authenticatedUser = await getAuthenticatedUser(request);
  if (!authenticatedUser || authenticatedUser.role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase yapılandırılmamış" }, { status: 503 });
  }

  try {
    const userId = params.userId;

    // Prevent admin from deleting themselves
    if (userId === authenticatedUser.user.id) {
      return NextResponse.json(
        { error: "Kendi hesabınızı silemezsiniz" },
        { status: 400 }
      );
    }

    // Delete user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Kullanıcı silme hatası:", error);
    return NextResponse.json(
      { error: error.message || "Kullanıcı silinemedi" },
      { status: 500 }
    );
  }
}
