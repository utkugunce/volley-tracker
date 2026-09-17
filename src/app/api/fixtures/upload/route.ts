import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
import { timingSafeEqual } from "crypto";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";

const execFileAsync = promisify(execFile);

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Maksimum dosya boyutu: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// İzin verilen resmi TVF alan adları allowlist deseni
const ALLOWED_DOMAIN_REGEX = /^([a-z0-9-]+\.)*(voleyboliltemsilciligi\.com|tvf\.org\.tr)$/i;

// In-memory rate limiting (IP başına dakikada maksimum 5 istek)
const uploadLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 5,
});

function isValidAllowedUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    return ALLOWED_DOMAIN_REGEX.test(parsed.hostname);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // 1. Admin Token Doğrulaması (x-admin-token header)
    const expectedToken = process.env.ADMIN_TOKEN;

    if (!expectedToken) {
      console.error("ADMIN_TOKEN ortam değişkeni tanımlı değil — upload endpoint devre dışı.");
      return NextResponse.json(
        { error: "Sunucu yapılandırma hatası: yükleme özelliği şu anda kullanılamıyor." },
        { status: 503 }
      );
    }

    const providedToken = request.headers.get("x-admin-token");
    if (!providedToken || !safeCompare(providedToken, expectedToken)) {
      return NextResponse.json(
        { error: "Yetkisiz erişim: Geçersiz veya eksik admin token." },
        { status: 401 }
      );
    }

    // 2. Basit IP Bazlı Rate Limiting
    const clientIp = getClientIp(request);
    const limitCheck = uploadLimiter.check(clientIp);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: "Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin." },
        { status: 429, headers: { "Retry-After": String(limitCheck.retryAfterSeconds || 60) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const url = formData.get("url") as string | null;

    const rawDir = path.join(process.cwd(), "data", "raw");
    if (!fs.existsSync(rawDir)) {
      fs.mkdirSync(rawDir, { recursive: true });
    }

    if (file) {
      // 3. Dosya Boyutu ve Uzantı Doğrulaması (.xlsx ve maks 10MB)
      const ext = path.extname(file.name).toLowerCase();
      if (ext !== ".xlsx") {
        return NextResponse.json(
          { error: "Geçersiz dosya formatı. Yalnızca .xlsx uzantılı dosyalar kabul edilir." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Dosya boyutu çok büyük. Maksimum 10MB dosya yüklenebilir." },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      if (buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Dosya boyutu çok büyük. Maksimum 10MB dosya yüklenebilir." },
          { status: 400 }
        );
      }

      const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
      const safeName = `${safeBaseName}.xlsx`;
      const filePath = path.join(rawDir, safeName);

      fs.writeFileSync(filePath, buffer);

      // Python scraper'ı dosya ile güvenli execFile ile çalıştır (shell interpolation yok)
      await execFileAsync("python", [
        "scripts/run_scraper.py",
        "--city",
        "istanbul",
        "--file",
        filePath,
      ]);
    } else if (url && url.trim().length > 0) {
      const trimmedUrl = url.trim();

      // 4. URL Parse & Allowlist Doğrulaması
      if (!isValidAllowedUrl(trimmedUrl)) {
        return NextResponse.json(
          {
            error:
              "Geçersiz veya yetkisiz URL. Yalnızca resmi TVF alan adları (*.voleyboliltemsilciligi.com veya tvf.org.tr) kabul edilir.",
          },
          { status: 400 }
        );
      }

      // Python scraper'ı URL ile güvenli execFile ile çalıştır
      await execFileAsync("python", [
        "scripts/run_scraper.py",
        "--city",
        "istanbul",
        "--url",
        trimmedUrl,
      ]);
    } else {
      // Varsayılan bülteni yeniden parse et
      await execFileAsync("python", ["scripts/run_scraper.py", "--city", "istanbul"]);
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
