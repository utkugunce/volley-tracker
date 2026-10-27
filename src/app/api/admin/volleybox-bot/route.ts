import fs from "fs";
import path from "path";
import { spawn, spawnSync, type ChildProcess } from "child_process";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
import { normalizeGithubRepo } from "@/utils/scrapeTrigger";
import mappingsJson from "../../../../../data/volleybox-mappings.json";

export interface VolleyboxBotLogEntry {
  id: number;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  text: string;
}

export interface VolleyboxBotJobState {
  status: "idle" | "running" | "completed" | "failed" | "stopped";
  mode: "push" | "dry-run" | "login";
  city: string;
  limit: number;
  delay: number;
  addedCount: number;
  skippedCount: number;
  currentStep: string;
  currentMatch: string | null;
  startedAt: string | null;
  updatedAt: string | null;
  logs: VolleyboxBotLogEntry[];
}

export interface MissingMatchPreviewItem {
  id: string;
  city: string;
  city_slug: string;
  category: string;
  group: string;
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  score: string;
  hall: string;
  forfeit: boolean;
  tournament_url: string;
}

export interface TournamentMissingSummary {
  tournament_url: string;
  tournament_slug: string;
  city: string;
  city_slug: string;
  category: string;
  missing_count: number;
  matches: MissingMatchPreviewItem[];
}

interface InternalBotRunner {
  state: VolleyboxBotJobState;
  proc: ChildProcess | null;
  nextLogId: number;
}

const globalForVbBot = globalThis as unknown as {
  __volleyboxBotRunner?: InternalBotRunner;
};

function getRunner(): InternalBotRunner {
  if (!globalForVbBot.__volleyboxBotRunner) {
    globalForVbBot.__volleyboxBotRunner = {
      state: {
        status: "idle",
        mode: "push",
        city: "all",
        limit: 25,
        delay: 8,
        addedCount: 0,
        skippedCount: 0,
        currentStep: "Hazır — Başlatmak için il/turnuva seçip 'Botu Başlat' düğmesine tıklayın.",
        currentMatch: null,
        startedAt: null,
        updatedAt: null,
        logs: [],
      },
      proc: null,
      nextLogId: 1,
    };
  }
  return globalForVbBot.__volleyboxBotRunner;
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function isAuthorizedAdmin(request: Request): Promise<boolean> {
  const expectedToken = process.env.ADMIN_TOKEN;
  const authHeader =
    request.headers.get("x-admin-token") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
    new URL(request.url).searchParams.get("token") ||
    "";

  if (expectedToken && authHeader && safeCompare(authHeader, expectedToken)) {
    return true;
  }

  const user = await getAuthenticatedUser(request);
  if (user && (user.role === "admin" || user.role === "editor")) {
    return true;
  }

  return false;
}

function normTr(s: string): string {
  return (s || "")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .toLowerCase()
    .replace(/\u0307/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();
}

function collectMissingMatchesPreview(cityFilter?: string): TournamentMissingSummary[] {
  const leagues = (
    mappingsJson as {
      leagues?: Array<{
        internal_name?: string;
        city?: string;
        city_slug?: string;
        volleybox_url?: string;
        age_category?: string;
        season?: string;
      }>;
    }
  ).leagues || [];

  const lookup = new Map<string, string>();
  for (const l of leagues) {
    const url = (l.volleybox_url || "").trim();
    const season = (l.season || "").trim();
    if (!url || (season && season !== "2026/27")) continue;
    if (url.includes("-2025-26-") || url.includes("-2024-25-")) continue;

    const city = (l.city || "").trim();
    const internalName = (l.internal_name || "").trim();
    const ageCat = (l.age_category || "").trim().toLowerCase();
    if (city && internalName) {
      lookup.set(`${normTr(internalName)}::${normTr(city)}`, url);
      if (normTr(city) === "aydin" && ageCat === "u18") {
        lookup.set(`${normTr("Genç Kızlar 1. Ligi")}::${normTr(city)}`, url);
        lookup.set(`${normTr("Genç Kızlar Süper Lig")}::${normTr(city)}`, url);
      }
      if (ageCat) {
        const ageKey = `${normTr(city)}::${ageCat}`;
        if (!lookup.has(ageKey)) lookup.set(ageKey, url);
      }
    }
  }

  const byTourn = new Map<string, TournamentMissingSummary>();
  const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  const filesToRead: Array<{ filePath: string; fallbackCity: string }> = [
    { filePath: path.join(dataDir, "fixtures.json"), fallbackCity: "İstanbul" },
  ];

  const citiesDir = path.join(dataDir, "cities");
  if (fs.existsSync(citiesDir)) {
    for (const f of fs.readdirSync(citiesDir).sort()) {
      if (f.endsWith(".json")) {
        filesToRead.push({
          filePath: path.join(citiesDir, f),
          fallbackCity: f.replace(/\.json$/i, ""),
        });
      }
    }
  }

  const filterNorm = cityFilter && cityFilter !== "all" ? normTr(cityFilter) : "";

  for (const { filePath, fallbackCity } of filesToRead) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const cityName = String(raw.city || fallbackCity);
      const citySlug = String(raw.slug || path.basename(filePath, ".json")).toLowerCase();

      if (filterNorm && filterNorm !== normTr(cityName) && filterNorm !== normTr(citySlug)) {
        continue;
      }

      const matches = Array.isArray(raw.matches) ? raw.matches : [];
      for (const m of matches) {
        if (m?.volleybox?.synced) continue;
        const mDate = String(m?.date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(mDate)) continue;

        const cat = String(m?.category || "");
        const grp = String(m?.group || "");
        const ageGroup = String(m?.age_group || "");
        const ageCode =
          /genç|genc|u18/i.test(ageGroup) || /genç|genc|u18/i.test(cat)
            ? "u18"
            : /yıldız|yildiz|u16/i.test(ageGroup) || /yıldız|yildiz|u16/i.test(cat)
              ? "u16"
              : "";

        const tUrl =
          (grp && lookup.get(`${normTr(grp)}::${normTr(cityName)}`)) ||
          (cat && lookup.get(`${normTr(cat)}::${normTr(cityName)}`)) ||
          (ageCode && lookup.get(`${normTr(cityName)}::${ageCode}`)) ||
          null;

        if (!tUrl) continue;

        const slug = tUrl.replace(/\/+$/, "").split("/").pop() || tUrl;
        if (!byTourn.has(tUrl)) {
          byTourn.set(tUrl, {
            tournament_url: tUrl,
            tournament_slug: slug,
            city: cityName,
            city_slug: citySlug,
            category: cat || "Altyapı Ligi",
            missing_count: 0,
            matches: [],
          });
        }

        const entry = byTourn.get(tUrl)!;
        const hScore = m?.home_score != null ? Number(m.home_score) : 0;
        const aScore = m?.away_score != null ? Number(m.away_score) : 0;
        const scoreStr = hScore > 0 || aScore > 0 ? `${hScore}-${aScore}` : "0-0";
        const isForfeit =
          Boolean(m?.forfeit) ||
          /[\(\[]\s*h\s*[\)\]]|hükmen|hukmen/i.test(`${m?.home_team || ""} ${m?.away_team || ""} ${m?.score || ""}`);

        const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());
        const isPast = mDate < todayStr;
        const hasScore = hScore > 0 || aScore > 0 || isForfeit;
        if (isPast && !hasScore) {
          // Volleybox geçmişte oynanan maçların skorsuz girilmesine izin vermez
          continue;
        }

        entry.matches.push({
          id: String(m?.id || `${citySlug}-${entry.matches.length}`),
          city: cityName,
          city_slug: citySlug,
          category: cat,
          group: grp || "-",
          date: mDate,
          time: m?.time && m.time !== "--:--" ? String(m.time) : "--:--",
          home_team: String(m?.home_team || ""),
          away_team: String(m?.away_team || ""),
          score: scoreStr,
          hall: m?.hall && m.hall !== "TBD" ? String(m.hall) : "-",
          forfeit: isForfeit,
          tournament_url: tUrl,
        });
        entry.missing_count = entry.matches.length;
      }
    } catch {
      // ignore malformed city json
    }
  }

  return Array.from(byTourn.values()).filter((t) => t.missing_count > 0);
}

function resolvePythonCommand(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN;
  const venvPyWin = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
  const venvPyNix = path.join(process.cwd(), ".venv", "bin", "python");
  if (fs.existsSync(venvPyWin)) return venvPyWin;
  if (fs.existsSync(venvPyNix)) return venvPyNix;
  return process.platform === "win32" ? "python" : "python3";
}

function isPythonAvailable(): boolean {
  try {
    const cmd = resolvePythonCommand();
    const res = spawnSync(cmd, ["--version"], {
      encoding: "utf-8",
      timeout: 2500,
      windowsHide: true,
    });
    return res.status === 0;
  } catch {
    return false;
  }
}

export const VOLLEYBOX_BOT_WORKFLOW_FILE = "volleybox-bot.yml";

export async function dispatchVolleyboxBotWorkflow(params: {
  city?: string;
  limit?: number;
  delay?: number;
  dry_run?: boolean;
}): Promise<{ status: "dispatched" | "not_configured" | "failed"; error?: string }> {
  const ghToken = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN)?.trim();
  const repo = normalizeGithubRepo(process.env.GITHUB_REPOSITORY) || "utkugunce/volley-tracker";
  if (!ghToken) {
    return { status: "not_configured" };
  }

  try {
    const dispatchRes = await fetch(
      `https://api.github.com/repos/${repo}/actions/workflows/${VOLLEYBOX_BOT_WORKFLOW_FILE}/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "VolleyTracker-App",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            city: params.city || "all",
            limit: String(params.limit || 25),
            delay: String(params.delay || 8),
            dry_run: Boolean(params.dry_run),
          },
        }),
      }
    );

    if (dispatchRes.ok || dispatchRes.status === 204) {
      return { status: "dispatched" };
    }
    const errBody = await dispatchRes.text();
    return { status: "failed", error: `HTTP ${dispatchRes.status}: ${errBody}` };
  } catch (e) {
    return { status: "failed", error: e instanceof Error ? e.message : String(e) };
  }
}

function appendLog(runner: InternalBotRunner, rawLine: string) {
  const line = rawLine.trim();
  if (!line) return;

  let level: VolleyboxBotLogEntry["level"] = "info";
  if (line.includes("✅") || line.includes("🎉") || line.includes("💾")) {
    level = "success";
  } else if (line.includes("⚠️") || line.includes("⏭️")) {
    level = "warn";
  } else if (line.includes("❌") || line.toLowerCase().includes("hata")) {
    level = "error";
  }

  runner.state.logs.push({
    id: runner.nextLogId++,
    timestamp: new Date().toLocaleTimeString("tr-TR"),
    level,
    text: line,
  });
  if (runner.state.logs.length > 300) {
    runner.state.logs = runner.state.logs.slice(-300);
  }
  runner.state.updatedAt = new Date().toISOString();

  if (line.includes("🌐 Turnuva sayfası açılıyor:")) {
    runner.state.currentStep = line;
  } else if (line.includes("🔎 Kontrol ediliyor:")) {
    runner.state.currentMatch = line.replace(/^.*🔎 Kontrol ediliyor:\s*/, "");
    runner.state.currentStep = `Maç kontrol ediliyor: ${runner.state.currentMatch}`;
  } else if (line.includes("📝 Form dolduruldu ->")) {
    runner.state.currentStep = line.replace(/^.*📝\s*/, "");
  } else if (line.includes("✅") && line.includes("Eklendi:")) {
    runner.state.addedCount += 1;
    runner.state.currentStep = line;
  } else if (line.includes("⚠️ Atlandı") || line.includes("⏭️ Zaten Volleybox'ta mevcut")) {
    runner.state.skippedCount += 1;
    runner.state.currentStep = line;
  } else if (line.includes("⏳ Hız sınırı koruması:")) {
    runner.state.currentStep = line;
  } else if (line.includes("🔐 Volleybox")) {
    runner.state.currentStep = "Tarayıcıda Volleybox kullanıcı girişi bekleniyor...";
  } else if (line.includes("🔄 Yeni eklenen maçların")) {
    runner.state.currentStep = "Yeni eklenen maçların Volleybox linkleri sitemizle senkronize ediliyor...";
  } else if (line.includes("🎉 İşlem tamamlandı")) {
    runner.state.currentStep = line;
  }
}

function killChildProcess(proc: ChildProcess | null) {
  if (!proc) return;
  try {
    if (process.platform === "win32" && proc.pid) {
      const killer = spawn("taskkill", ["/pid", String(proc.pid), "/T", "/F"], {
        windowsHide: true,
        stdio: "ignore",
      });
      killer.unref();
    }
    proc.kill("SIGTERM");
  } catch {
    // ignore
  }
}

export async function GET(request: Request) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "status";
  const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");
  const screenshotPath = path.join(dataDir, ".volleybox_bot_live.png");
  const authFile = path.join(dataDir, ".volleybox_auth.json");
  const profileDir = path.join(dataDir, ".volleybox_browser_profile");

  if (action === "screenshot") {
    if (!fs.existsSync(screenshotPath)) {
      return new NextResponse(null, { status: 404 });
    }
    try {
      const imgBuffer = fs.readFileSync(screenshotPath);
      return new NextResponse(imgBuffer, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    } catch {
      return new NextResponse(null, { status: 404 });
    }
  }

  if (action === "preview") {
    const city = searchParams.get("city") || "all";
    const tournaments = collectMissingMatchesPreview(city);
    const totalMissing = tournaments.reduce((acc, t) => acc + t.missing_count, 0);
    return NextResponse.json({
      total_tournaments: tournaments.length,
      total_missing: totalMissing,
      has_saved_auth: fs.existsSync(authFile),
      tournaments,
    });
  }

  const runner = getRunner();
  const hasScreenshot = fs.existsSync(screenshotPath);
  const screenshotMtime = hasScreenshot ? fs.statSync(screenshotPath).mtimeMs : 0;

  return NextResponse.json({
    ...runner.state,
    hasScreenshot,
    screenshotMtime,
    hasSavedAuth:
      fs.existsSync(authFile) ||
      Boolean(
        process.env.VOLLEYBOX_COOKIE ||
        process.env.VOLLEYBOX_COOKIES ||
        (process.env.VOLLEYBOX_USERNAME && process.env.VOLLEYBOX_PASSWORD)
      ),
    isLocalRuntime: process.env.NODE_ENV === "development",
  });
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "start");
  const runner = getRunner();

  if (action === "stop") {
    if (runner.proc) {
      killChildProcess(runner.proc);
      runner.proc = null;
    }
    runner.state.status = "stopped";
    appendLog(runner, "⏹️ Bot yönetici tarafından durduruldu.");
    runner.state.currentStep = "Bot yönetici tarafından durduruldu.";
    return NextResponse.json({ ok: true, state: runner.state });
  }

  if (runner.state.status === "running" && runner.proc) {
    return NextResponse.json(
      { error: "Volleybox botu şu anda zaten çalışıyor.", state: runner.state },
      { status: 409 }
    );
  }

  const mode: "push" | "dry-run" | "login" =
    body.mode === "dry-run" || body.mode === "login" ? body.mode : "push";
  const city = String(body.city || "all").trim();
  const limit = Math.max(1, Math.min(200, Number(body.limit) || 25));
  const delay = Math.max(3, Math.min(60, Number(body.delay) || 8));
  const isServerWithoutDisplay = process.platform !== "win32" && !process.env.DISPLAY;
  const headless = isServerWithoutDisplay ? true : Boolean(body.headless);

  const scriptPath = path.join(
    /*turbopackIgnore: true*/ process.cwd(),
    "scripts",
    "push_volleybox_matches.py"
  );
  const args: string[] = [scriptPath];

  if (mode === "login") {
    args.push("--login");
    if (headless) {
      args.push("--headless");
    }
  } else {
    if (city && city !== "all") {
      args.push("--city", city);
    }
    args.push("--limit", String(limit));
    args.push("--delay", String(delay));
    if (mode === "dry-run") {
      args.push("--dry-run");
    }
    if (headless) {
      args.push("--headless");
    }
  }

  const nowIso = new Date().toISOString();
  runner.state = {
    status: "running",
    mode,
    city,
    limit,
    delay,
    addedCount: 0,
    skippedCount: 0,
    currentStep:
      mode === "login"
        ? "Volleybox giriş penceresi açılıyor..."
        : mode === "dry-run"
          ? "Eksik maçlar taranıyor (Önizleme)..."
          : "Volleybox botu başlatılıyor...",
    currentMatch: null,
    startedAt: nowIso,
    updatedAt: nowIso,
    logs: [],
  };
  runner.nextLogId = 1;

  if (!isPythonAvailable()) {
    const ghRes = await dispatchVolleyboxBotWorkflow({
      city,
      limit,
      delay,
      dry_run: mode === "dry-run",
    });

    if (ghRes.status === "dispatched") {
      runner.state.status = "running";
      runner.state.mode = mode;
      runner.state.currentStep = "🚀 Bot GitHub Actions bulut ortamında tetiklendi...";
      appendLog(
        runner,
        "ℹ️ Render web sunucusunda Python motoru bulunmadığı için bot GitHub Actions bulut ortamında başlatıldı."
      );
      appendLog(
        runner,
        `🚀 İşlem Parametreleri: İl=${city}, Limit=${limit}, Gecikme=${delay}s, Mod=${mode}`
      );
      appendLog(
        runner,
        "☁️ GitHub Actions üzerinde Playwright & Chromium ile maçlar otomatik taranıp eklenecektir."
      );
      appendLog(
        runner,
        "🔗 Canlı çalışma akışını GitHub deponuzun 'Actions' sekmesinden takip edebilirsiniz."
      );
      return NextResponse.json({ ok: true, state: runner.state, dispatchedToGithub: true });
    }

    runner.state.status = "failed";
    const msg = "Render sunucusunda Python motoru bulunamadı.";
    runner.state.currentStep = msg;
    appendLog(runner, `❌ ${msg}`);
    appendLog(runner, "");
    appendLog(
      runner,
      "💡 Render varsayılan olarak yalnızca Node.js barındırdığı için botu çalıştırmanın 2 kolay yolu:"
    );
    appendLog(runner, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    appendLog(runner, "1️⃣ BİLGİSAYARINIZDAN ÇALIŞTIRIN (Önerilen & En Kolayı):");
    appendLog(runner, "   Kendi bilgisayarınızda terminal açıp şu komutu çalıştırabilirsiniz:");
    appendLog(
      runner,
      `   npm run push:volleybox${city && city !== "all" ? ` -- --city ${city}` : ""}`
    );
    appendLog(
      runner,
      "   (Böylece tarayıcı bilgisayarınızda açılır, Cloudflare engeline takılmaz ve eklenen maçlar otomatik siteye senkronize edilir)"
    );
    appendLog(runner, "");
    appendLog(runner, "2️⃣ BULUTTA PANEL ÜZERİNDEN ÇALIŞTIRIN (GitHub Actions):");
    appendLog(runner, "   Render Dashboard -> Environment Variables bölümüne GITHUB_TOKEN tanımlayın.");
    appendLog(
      runner,
      "   Token eklendiğinde paneldeki 'Botu Başlat' butonu arka planda GitHub Actions bulut işini otomatik tetikleyecektir."
    );
    appendLog(runner, "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return NextResponse.json(
      {
        error:
          "Render sunucusunda Python motoru bulunamadı. Panelden bulutta çalıştırmak için Render Dashboard'a GITHUB_TOKEN ekleyebilir veya yerel terminalinizden 'npm run push:volleybox' komutunu çalıştırabilirsiniz.",
        state: runner.state,
      },
      { status: 400 }
    );
  }

  const pyCmd = resolvePythonCommand();
  appendLog(
    runner,
    `🚀 Komut başlatıldı: ${pyCmd} scripts/push_volleybox_matches.py ${args.slice(1).join(" ")}`
  );
  if (isServerWithoutDisplay && (mode === "push" || mode === "login")) {
    appendLog(
      runner,
      "ℹ️ Sunucu ortamında tarayıcı arka planda (headless) çalışıyor. Ekran görüntülerini sağdaki canlı pencereden anlık izleyebilirsiniz."
    );
  }

  const child = spawn(pyCmd, args, {
    cwd: process.cwd(),
    windowsHide: false,
    env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" },
  });

  runner.proc = child;

  let stdoutRemaining = "";
  child.stdout?.on("data", (chunk: Buffer) => {
    stdoutRemaining += chunk.toString("utf-8");
    const lines = stdoutRemaining.split(/\r?\n/);
    stdoutRemaining = lines.pop() || "";
    for (const line of lines) {
      appendLog(runner, line);
    }
  });

  let stderrRemaining = "";
  child.stderr?.on("data", (chunk: Buffer) => {
    stderrRemaining += chunk.toString("utf-8");
    const lines = stderrRemaining.split(/\r?\n/);
    stderrRemaining = lines.pop() || "";
    for (const line of lines) {
      appendLog(runner, `⚠️ ${line}`);
    }
  });

  child.on("error", (err) => {
    runner.proc = null;
    runner.state.status = "failed";
    const msg = `❌ Bot başlatılamadı (${pyCmd}): ${err.message}. Render/sunucu üzerinde Python ve Playwright kurulu olduğundan emin olun.`;
    appendLog(runner, msg);
    runner.state.currentStep = msg;
    runner.state.updatedAt = new Date().toISOString();
  });

  child.on("close", (code) => {
    if (stdoutRemaining.trim()) appendLog(runner, stdoutRemaining);
    if (stderrRemaining.trim()) appendLog(runner, `⚠️ ${stderrRemaining}`);
    runner.proc = null;
    if (runner.state.status === "stopped") return;
    if (code === 0) {
      runner.state.status = "completed";
      if (!runner.state.currentStep.includes("tamamlandı")) {
        runner.state.currentStep = `İşlem başarıyla tamamlandı (${runner.state.addedCount} maç eklendi).`;
      }
    } else {
      runner.state.status = "failed";
      runner.state.currentStep = `Bot hata kodu ile sonlandı (Çıkış kodu: ${code}).`;
    }
    runner.state.updatedAt = new Date().toISOString();
  });

  return NextResponse.json({ ok: true, state: runner.state });
}
