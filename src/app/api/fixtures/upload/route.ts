import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    const rawDir = path.join(process.cwd(), "data", "raw");
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(rawDir, safeName);

      fs.writeFileSync(filePath, buffer);

      // Python scraper'ı dosya ile çalıştır
      const command = `python scripts/run_scraper.py --city istanbul --file "${filePath}"`;
      await execAsync(command);
    } else if (url && url.trim().startsWith("http")) {
      // Python scraper'ı URL ile çalıştır
      const command = `python scripts/run_scraper.py --city istanbul --url "${url.trim()}"`;
      await execAsync(command);
    } else {
      // Varsayılan bülteni yeniden parse et
      const command = `python scripts/run_scraper.py --city istanbul`;
      await execAsync(command);
    }

    // Güncellenmiş fixtures.json oku ve dön
    const fixturesPath = path.join(process.cwd(), "data", "fixtures.json");
    if (fs.existsSync(fixturesPath)) {
      const content = fs.readFileSync(fixturesPath, "utf-8");
      return NextResponse.json(JSON.parse(content));
    }

    return NextResponse.json({ success: true, message: "Fikstür güncellendi" });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: `Bülten işlenirken hata oluştu: ${error.message}` },
      { status: 500 }
    );
  }
}
