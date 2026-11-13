import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

function loadLocalEnv() {
  for (const fileName of [".env", ".env.local"]) {
    const envFile = path.join(process.cwd(), fileName);
    if (!fs.existsSync(envFile)) continue;
    for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (key && !process.env[key]) process.env[key] = val;
      }
    }
  }
}

async function listAllAuthUsers(supabaseClient) {
  const users = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await supabaseClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw new Error(`auth.admin.listUsers: ${error.message}`);
    }
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

/**
 * Inspects public.user_roles synchronization and verifies whether
 * 008_authoritative_roles.sql (STABLE sql get_user_role) is applied.
 */
export async function inspectSupabaseRoles({
  url,
  serviceRoleKey,
  supabaseClient,
  fetchImpl = fetch,
  syncMissing = false,
}) {
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL (veya SUPABASE_URL) ve SUPABASE_SERVICE_ROLE_KEY zorunludur.");
  }

  const client =
    supabaseClient ||
    createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

  const { data: roleRows, error: roleError } = await client
    .from("user_roles")
    .select("user_id, role");
  if (roleError) {
    throw new Error(`user_roles query: ${roleError.message}`);
  }

  const roleCounts = { admin: 0, editor: 0, viewer: 0, other: 0 };
  const roleMap = new Map();
  for (const row of roleRows || []) {
    roleMap.set(row.user_id, row.role);
    if (row.role === "admin" || row.role === "editor" || row.role === "viewer") {
      roleCounts[row.role] += 1;
    } else {
      roleCounts.other += 1;
    }
  }

  const authUsers = await listAllAuthUsers(client);
  const missingPrivilegedUsers = [];
  for (const user of authUsers) {
    const metaRole = user?.app_metadata?.role ?? user?.user_metadata?.role;
    if ((metaRole === "admin" || metaRole === "editor") && !roleMap.has(user.id)) {
      missingPrivilegedUsers.push({ user_id: user.id, role: metaRole });
    }
  }

  let syncedCount = 0;
  if (syncMissing && missingPrivilegedUsers.length > 0) {
    const now = new Date().toISOString();
    const payload = missingPrivilegedUsers.map((entry) => ({
      user_id: entry.user_id,
      role: entry.role,
      updated_at: now,
    }));
    const { error: upsertError } = await client
      .from("user_roles")
      .upsert(payload, { onConflict: "user_id" });
    if (upsertError) {
      throw new Error(`user_roles sync: ${upsertError.message}`);
    }
    syncedCount = payload.length;
    for (const entry of missingPrivilegedUsers) {
      roleCounts[entry.role] += 1;
    }
  }

  const baseUrl = url.replace(/\/$/, "");
  const headers = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
  };

  const getRes = await fetchImpl(`${baseUrl}/rest/v1/rpc/get_user_role`, {
    method: "GET",
    headers,
  });

  let migration008Applied = false;
  let legacy003Detected = false;

  if (getRes.status === 200) {
    migration008Applied = true;
  } else {
    const postRes = await fetchImpl(`${baseUrl}/rest/v1/rpc/get_user_role`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: "{}",
    });
    if (postRes.status === 200) {
      legacy003Detected = true;
    }
  }

  return {
    totalAuthUsers: authUsers.length,
    totalUserRoleRows: (roleRows || []).length + syncedCount,
    roleCounts,
    missingPrivilegedCount: missingPrivilegedUsers.length,
    syncedMissingCount: syncedCount,
    migration008Applied,
    legacy003Detected,
    getRpcStatus: getRes.status,
  };
}

async function main() {
  loadLocalEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const syncMissing = process.argv.includes("--sync-missing");

  const summary = await inspectSupabaseRoles({ url, serviceRoleKey, syncMissing });
  console.log(JSON.stringify(summary, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Supabase role check failed:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  });
}
