import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "../route";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { getSupabaseAdmin } from "@/utils/supabaseAdmin";

vi.mock("@/utils/supabaseAuth");
vi.mock("@/utils/supabaseAdmin");

describe("Users API", () => {
  const mockSupabaseAdmin = {
    auth: {
      admin: {
        listUsers: vi.fn(),
        createUser: vi.fn(),
        deleteUser: vi.fn(),
      },
    },
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabaseAdmin as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/admin/users", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const response = await GET(new Request("http://localhost"));
      expect(response.status).toBe(401);
    });

    it("should return 401 if not admin", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: "123" } as any,
        role: "editor",
      });

      const response = await GET(new Request("http://localhost"));
      expect(response.status).toBe(401);
    });

    it("should return users with roles if admin", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: "123" } as any,
        role: "admin",
      });

      const mockUsers = {
        users: [
          { id: "1", email: "admin@test.com", created_at: "2024-01-01" },
          { id: "2", email: "editor@test.com", created_at: "2024-01-02" },
        ],
      };

      const mockRoles = [
        { user_id: "1", role: "admin", created_at: "2024-01-01", updated_at: "2024-01-01" },
        { user_id: "2", role: "editor", created_at: "2024-01-02", updated_at: "2024-01-02" },
      ];

      mockSupabaseAdmin.auth.admin.listUsers.mockResolvedValue({ data: mockUsers, error: null });
      mockSupabaseAdmin.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: mockRoles, error: null }),
      } as any);

      const response = await GET(new Request("http://localhost"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.users).toHaveLength(2);
      expect(data.users[0].role).toBe("admin");
      expect(data.users[1].role).toBe("editor");
    });
  });

  describe("POST /api/admin/users", () => {
    it("should return 401 if not authenticated", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue(null);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "password" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should return 401 if not admin", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: "123" } as any,
        role: "editor",
      });

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "password" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("should create user with role", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: "123" } as any,
        role: "admin",
      });

      const mockUser = { id: "456", email: "test@test.com" };
      mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabaseAdmin.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
      } as any);

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "password", role: "editor" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.email).toBe("test@test.com");
      expect(data.user.role).toBe("editor");
    });

    it("should return 400 for invalid role", async () => {
      vi.mocked(getAuthenticatedUser).mockResolvedValue({
        user: { id: "123" } as any,
        role: "admin",
      });

      const request = new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ email: "test@test.com", password: "password", role: "invalid" }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});
