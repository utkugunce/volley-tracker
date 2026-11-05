// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { POST } from "./route";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { dispatchScrapeWorkflow } from "@/utils/scrapeTrigger";
vi.mock("@/utils/supabaseAuth");
vi.mock("@/utils/scrapeTrigger", () => ({ verifySyncPasswordFromValue: () => false, extractSyncPasswordFromRequest: () => null, isLocalScrapeAllowed: () => false, dispatchScrapeWorkflow: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
it("denies viewers and throttles repeated unauthorized attempts before dispatch", async () => {
  vi.mocked(getAuthenticatedUser).mockResolvedValue({ user: { id: "viewer" }, role: "viewer" } as Awaited<ReturnType<typeof getAuthenticatedUser>>);
  for (let i = 0; i < 5; i++) {
    const response = await POST(new Request("http://localhost/api/sync/trigger", { method: "POST", headers: { "x-forwarded-for": "192.0.2.91" } }));
    expect(response.status).toBe(401);
  }
  const limited = await POST(new Request("http://localhost/api/sync/trigger", { method: "POST", headers: { "x-forwarded-for": "192.0.2.91" } }));
  expect(limited.status).toBe(429);
  expect(limited.headers.get("Retry-After")).toBeTruthy();
  expect(dispatchScrapeWorkflow).not.toHaveBeenCalled();
});
it("denies cross-origin mutation before authentication", async () => {
  const response = await POST(new Request("http://localhost/api/sync/trigger", { method: "POST", headers: { origin: "https://foreign.example" } }));
  expect(response.status).toBe(403);
  expect(getAuthenticatedUser).not.toHaveBeenCalled();
});
