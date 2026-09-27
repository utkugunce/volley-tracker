#!/usr/bin/env node

/**
 * İlk Admin Kullanıcısını Oluşturma Scripti
 * 
 * Bu script Supabase Auth'da ilk admin kullanıcısını oluşturur.
 * Supabase service role key gerektirir.
 * 
 * Kullanım:
 * node scripts/create_admin_user.mjs --email admin@example.com --password securepassword
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "..", ".env");

try {
  const envContent = readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
} catch (error) {
  console.warn(".env dosyası bulunamadı veya okunamadı, ortam değişkenleri kullanılacak.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("HATA: NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY ortam değişkenleri gereklidir.");
  console.error("Bu script .env dosyasını okur veya ortam değişkenlerini kullanır.");
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const emailIndex = args.indexOf("--email");
const passwordIndex = args.indexOf("--password");

if (emailIndex === -1 || passwordIndex === -1) {
  console.error("Kullanım: node scripts/create_admin_user.mjs --email admin@example.com --password securepassword");
  process.exit(1);
}

const email = args[emailIndex + 1];
const password = args[passwordIndex + 1];

if (!email || !password) {
  console.error("HATA: Email ve şifre belirtilmelidir.");
  process.exit(1);
}

async function createAdminUser() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log("Admin kullanıcısı oluşturuluyor...");
  console.log(`Email: ${email}`);

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = existingUsers.users.find((u) => u.email === email);
    if (existingUser) {
      console.log("⚠️  Bu email ile bir kullanıcı zaten mevcut.");
      console.log(`User ID: ${existingUser.id}`);
      
      // Check role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", existingUser.id)
        .maybeSingle();
      
      if (!roleError && roleData) {
        console.log(`Mevcut rol: ${roleData.role}`);
        if (roleData.role === "admin") {
          console.log("✅ Kullanıcı zaten admin rolüne sahip.");
          return;
        }
      }

      // Update role to admin
      console.log("Rol admin olarak güncelleniyor...");
      const { error: updateError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: existingUser.id,
          role: "admin",
          updated_at: new Date().toISOString(),
        });
      
      if (updateError) throw updateError;
      console.log("✅ Kullanıcı rolü admin olarak güncellendi.");
      return;
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "admin",
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error("Kullanıcı oluşturulamadı.");
    }

    console.log(`✅ Kullanıcı başarıyla oluşturuldu.`);
    console.log(`User ID: ${data.user.id}`);
    console.log(`Email: ${data.user.email}`);

    // Set role in user_roles table
    const { error: roleError } = await supabase.from("user_roles").insert({
      user_id: data.user.id,
      role: "admin",
    });

    if (roleError) throw roleError;

    console.log("✅ Admin rolü atandı.");
    console.log("\n🎉 İlk admin kullanıcısı başarıyla oluşturuldu!");
    console.log("Artık admin paneline bu email ve şifre ile giriş yapabilirsiniz.");

  } catch (error) {
    console.error("❌ Hata:", error.message);
    process.exit(1);
  }
}

createAdminUser();
