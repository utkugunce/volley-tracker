// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import { inspectSupabaseRoles } from "../../../scripts/check_supabase_roles.mjs";

function createMockSupabase({ roleRows = [], authUsers = [], onUpsert }: {
  roleRows?: Array<{ user_id: string; role: string }>;
  authUsers?: Array<{ id: string; app_metadata?: { role?: string }; user_metadata?: { role?: string } }>;
  onUpsert?: (rows: unknown[]) => void;
}) {
  return {
    from: (table: string) => {
      if (table !== "user_roles") throw new Error(`Unexpected table ${table}`);
      return {
        select: async () => ({ data: roleRows, error: null }),
        upsert: async (rows: unknown[]) => {
          onUpsert?.(rows);
          return { error: null };
        },
      };
    },
    auth: {
      admin: {
        listUsers: async () => ({ data: { users: authUsers }, error: null }),
      },
    },
  };
}

describe("inspectSupabaseRoles", () => {
  it("reports migration008Applied: true when GET /rest/v1/rpc/get_user_role returns 200", async () => {
    const supabaseClient = createMockSupabase({
      roleRows: [{ user_id: "u1", role: "admin" }],
      authUsers: [{ id: "u1", user_metadata: { role: "admin" } }],
    });
    const fetchImpl = vi.fn(async () => new Response('"viewer"', { status: 200 }));

    const result = await inspectSupabaseRoles({
      url: "https://example.supabase.co",
      serviceRoleKey: "service-key",
      supabaseClient,
      fetchImpl,
    });

    expect(result.migration008Applied).toBe(true);
    expect(result.legacy003Detected).toBe(false);
    expect(result.getRpcStatus).toBe(200);
    expect(result.roleCounts).toEqual({ admin: 1, editor: 0, viewer: 0, other: 0 });
    expect(result.missingPrivilegedCount).toBe(0);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://example.supabase.co/rest/v1/rpc/get_user_role",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("detects legacy 003 VOLATILE function when GET returns 405 and POST returns 200, and backfills missing roles when syncMissing is true", async () => {
    const upserted: unknown[] = [];
    const supabaseClient = createMockSupabase({
      roleRows: [{ user_id: "u1", role: "viewer" }],
      authUsers: [
        { id: "u1", user_metadata: { role: "viewer" } },
        { id: "u2", user_metadata: { role: "admin" } },
      ],
      onUpsert: (rows) => upserted.push(...rows),
    });

    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === "GET") {
        return new Response("Method Not Allowed", { status: 405 });
      }
      return new Response('"viewer"', { status: 200 });
    });

    const result = await inspectSupabaseRoles({
      url: "https://example.supabase.co/",
      serviceRoleKey: "service-key",
      supabaseClient,
      fetchImpl,
      syncMissing: true,
    });

    expect(result.migration008Applied).toBe(false);
    expect(result.legacy003Detected).toBe(true);
    expect(result.getRpcStatus).toBe(405);
    expect(result.missingPrivilegedCount).toBe(1);
    expect(result.syncedMissingCount).toBe(1);
    expect(result.totalUserRoleRows).toBe(2);
    expect(result.roleCounts).toEqual({ admin: 1, editor: 0, viewer: 1, other: 0 });
    expect(upserted).toHaveLength(1);
    expect(upserted[0]).toMatchObject({ user_id: "u2", role: "admin" });
  });
});
