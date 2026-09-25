import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";

const refreshLimiter = new RateLimiter({
  windowMs: 120 * 1000,
  maxRequests: 3,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get("refresh");
    const groupParam = searchParams.get("grup");
    const searchParam = searchParams.get("q")?.toLowerCase();

    const dataPath = path.join(process.cwd(), "data", "kadinlar_2_lig.json");

    if (refresh === "1" || refresh === "true") {
      const clientIp = getClientIp(request);
      if (!refreshLimiter.check(clientIp)) {
        return NextResponse.json(
          { error: "Çok fazla yenileme isteği gönderildi. Lütfen biraz bekleyin." },
          { status: 429 }
        );
      }

      try {
        const venvPython = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
        const pythonExe = fs.existsSync(venvPython) ? venvPython : "python";
        const scriptPath = path.join(process.cwd(), "scripts", "scrape_kadinlar_2_lig.py");
        execFileSync(pythonExe, [scriptPath], {
          timeout: 45000,
          cwd: process.cwd(),
          encoding: "utf-8",
        });
      } catch (err) {
        console.error("Scraper refresh error:", err);
      }
    }

    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: "Kadınlar 2. Ligi verisi henüz oluşturulmamış." },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);

    // Filter by group if requested
    if (groupParam) {
      const gNum = parseInt(groupParam, 10);
      const groupData = data.gruplar.find((g: { grup_no: number }) => g.grup_no === gNum);
      if (groupData) {
        return NextResponse.json({
          metadata: data.metadata,
          secili_grup: groupData,
          tum_gruplar: data.gruplar.map((g: { grup_no: number; grup_adi: string; takim_sayisi: number; mac_sayisi: number }) => ({
            grup_no: g.grup_no,
            grup_adi: g.grup_adi,
            takim_sayisi: g.takim_sayisi,
            mac_sayisi: g.mac_sayisi,
          })),
        });
      }
    }

    // Filter matches if search requested
    if (searchParam) {
      const filteredMatches = data.tum_maclar.filter((m: { takim_a: string; takim_b: string; sehir: string; salon: string }) =>
        m.takim_a.toLowerCase().includes(searchParam) ||
        m.takim_b.toLowerCase().includes(searchParam) ||
        m.sehir.toLowerCase().includes(searchParam) ||
        m.salon.toLowerCase().includes(searchParam)
      );
      return NextResponse.json({
        ...data,
        tum_maclar: filteredMatches,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error in kadinlar-2-ligi:", error);
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
