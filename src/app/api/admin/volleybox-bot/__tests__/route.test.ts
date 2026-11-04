import { describe, it, expect } from "vitest";
import { GET } from "../route";

describe("Volleybox Bot Route", () => {
  it("yetkisiz isteklerde 401 döner", async () => {
    const req = new Request("http://localhost:3000/api/admin/volleybox-bot");
    const res = await GET(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Yetkisiz işlem");
  });
});
