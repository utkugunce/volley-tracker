// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAuthenticatedUser } from "../supabaseAuth";
import { getSupabaseAdmin } from "../supabaseAdmin";
vi.mock("../supabaseAdmin");
const role = vi.fn();
const getUser = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "user", app_metadata: { role: "admin" } } }, error: null });
  vi.mocked(getSupabaseAdmin).mockReturnValue({ auth: { getUser }, from: () => ({ select: () => ({ eq: () => ({ maybeSingle: role }) }) }) } as unknown as NonNullable<ReturnType<typeof getSupabaseAdmin>>);
});
describe("authoritative roles", () => {
  it("applies a demotion despite stale admin metadata", async () => {
    role.mockResolvedValue({ data: { role: "viewer" }, error: null });
    expect((await getAuthenticatedUser(new Request("http://localhost", { headers: { authorization: "Bearer jwt" } })))?.role).toBe("viewer");
  });
  it("does not restore privileges when a role is removed or unavailable", async () => {
    for (const result of [{ data: null, error: null }, { data: null, error: new Error("offline") }]) {
      role.mockResolvedValue(result);
      expect((await getAuthenticatedUser(new Request("http://localhost", { headers: { authorization: "Bearer jwt" } })))?.role).toBe("viewer");
    }
  });
  it("rejects query-string tokens without contacting authentication", async () => {
    expect(await getAuthenticatedUser(new Request("http://localhost?token=jwt"))).toBeNull();
    expect(getUser).not.toHaveBeenCalled();
  });
});
