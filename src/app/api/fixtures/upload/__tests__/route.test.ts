import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { POST } from "../route";

describe("Upload Route Security & ADMIN_TOKEN Authentication", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return 503 Service Unavailable when ADMIN_TOKEN is not defined in env", async () => {
    delete process.env.ADMIN_TOKEN;
    delete (process.env as any).UPLOAD_SECRET;

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
      headers: {
        "x-admin-token": "any-token",
      },
    });

    const res = await POST(request);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toContain("yükleme özelliği şu anda kullanılamıyor");
  });

  it("should reject the old leaked token 'volley-admin-secret-2026' with 503 if ADMIN_TOKEN is not configured", async () => {
    delete process.env.ADMIN_TOKEN;
    delete (process.env as any).UPLOAD_SECRET;

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
      headers: {
        "x-admin-token": "volley-admin-secret-2026",
      },
    });

    const res = await POST(request);
    expect(res.status).toBe(503);
  });

  it("should return 401 Unauthorized when ADMIN_TOKEN is set but x-admin-token header is missing", async () => {
    process.env.ADMIN_TOKEN = "super-secret-token-1234567890abcdef";

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Yetkisiz erişim");
  });

  it("should return 401 Unauthorized when ADMIN_TOKEN is set but wrong token is provided", async () => {
    process.env.ADMIN_TOKEN = "super-secret-token-1234567890abcdef";

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
      headers: {
        "x-admin-token": "wrong-token",
      },
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Yetkisiz erişim");
  });

  it("should return 401 Unauthorized when token is same length but different bytes (timing safe)", async () => {
    process.env.ADMIN_TOKEN = "super-secret-token-1234567890abcdef";

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
      headers: {
        "x-admin-token": "super-secret-token-1234567890abcdeg", // last char differs
      },
    });

    const res = await POST(request);
    expect(res.status).toBe(401);
  });

  it("should authorize successfully when valid token is provided and proceed into handler", async () => {
    process.env.ADMIN_TOKEN = "super-secret-token-1234567890abcdef";

    const formData = new FormData();
    formData.append("url", "https://unauthorized-domain.com");

    const request = new Request("http://localhost:3000/api/fixtures/upload", {
      method: "POST",
      headers: {
        "x-admin-token": "super-secret-token-1234567890abcdef",
      },
      body: formData,
    });

    const res = await POST(request);
    // Verified: Bypasses auth completely (neither 503 nor 401) and reaches URL allowlist check (400)
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Geçersiz veya yetkisiz URL");
  });
});
