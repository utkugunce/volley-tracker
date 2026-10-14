import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

vi.mock("@/utils/teamData", () => ({
  getTeamDetailsBySlug: vi.fn((slug: string) => {
    if (slug === "vakifbank-u18") {
      return {
        teamName: "VakıfBank U18",
        slug: "vakifbank-u18",
        matches: [
          {
            id: "m-1",
            home_team: "VakıfBank U18",
            away_team: "Fenerbahçe U18",
            date: "2026-10-25",
            time: "14:00",
            hall: "VakıfBank Spor Sarayı",
            city: "İstanbul",
            category: "Genç Kızlar Süper Lig",
            status: "upcoming",
          },
        ],
      };
    }
    return null;
  }),
}));

vi.mock("@/utils/team/loaders", () => ({
  loadAllCityData: vi.fn(() => ({
    matches: [
      {
        id: "m-cat-1",
        home_team: "Eczacıbaşı",
        away_team: "Galatasaray",
        date: "2026-10-30",
        time: "15:00",
        hall: "Burhan Felek",
        city: "İstanbul",
        category: "Genç Kızlar Süper Lig",
        status: "upcoming",
      },
    ],
    standingsByCity: {},
  })),
}));

describe("GET /api/ics", () => {
  it("parametre verilmediğinde 400 döner", async () => {
    const req = new NextRequest("https://altyapivoleybol.com.tr/api/ics");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("geçersiz takım için 404 döner", async () => {
    const req = new NextRequest("https://altyapivoleybol.com.tr/api/ics?team=olmayan-takim");
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it("geçerli takım için 200 ve RFC 5545 uyumlu text/calendar döner", async () => {
    const req = new NextRequest("https://altyapivoleybol.com.tr/api/ics?team=vakifbank-u18");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/calendar");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");

    const text = await res.text();
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("VakıfBank U18");
    expect(text).toContain("Fenerbahçe U18");
    expect(text).toContain("END:VCALENDAR");
  });

  it("kategori parametresi verildiğinde ilgili lig maçlarını döner", async () => {
    const req = new NextRequest("https://altyapivoleybol.com.tr/api/ics?category=genc-kizlar-super-lig");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("BEGIN:VCALENDAR");
    expect(text).toContain("Eczacıbaşı");
    expect(text).toContain("END:VCALENDAR");
  });
});
