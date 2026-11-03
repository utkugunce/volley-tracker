import fs from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/utils/supabaseAuth";
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

export interface ProLeagueConfig {
  file: string;
  name: string;
  slug: string;
  category: string;
  url: string;
  aliases: string[];
}

export const PRO_LEAGUES_CONFIG: ProLeagueConfig[] = [
  {
    file: "kadinlar_2_lig.json",
    name: "TVF Kadınlar 2. Ligi",
    slug: "kadinlar-2-ligi",
    category: "Kadınlar 2. Ligi",
    url: "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-2-ligi-2026-27-o45047",
    aliases: ["kadinlar-2-ligi", "kadinlar-2-lig", "kadinlar-2", "2-lig", "2.lig", "2lig"],
  },
  {
    file: "kadinlar_1_lig.json",
    name: "KFC Kadınlar 1. Ligi",
    slug: "kadinlar-1-ligi",
    category: "KFC Kadınlar 1. Ligi",
    url: "https://women.volleybox.net/tr/women-turkiye-kadnlar-voleybol-1-ligi-2026-27-o45210",
    aliases: ["kadinlar-1-ligi", "kadinlar-1-lig", "kadinlar-1", "1-lig", "1.lig", "1lig", "kfc-kadinlar-1-ligi"],
  },
  {
    file: "sultanlar_ligi.json",
    name: "Vodafone Sultanlar Ligi",
    slug: "sultanlar-ligi",
    category: "Vodafone Sultanlar Ligi",
    url: "https://women.volleybox.net/tr/women-vodafone-sultanlar-ligi-2026-27-o45086",
    aliases: ["sultanlar-ligi", "sultanlar_ligi", "sultanlar", "vodafone-sultanlar-ligi"],
  },
];

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
  const filesToRead: Array<{ filePath: string; fallbackCity: string }> = [];

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
  // Eğer cities dizini yoksa veya boşsa geriye dönük uyumluluk için fixtures.json oku
  if (filesToRead.length === 0) {
    const legacyFixtures = path.join(dataDir, "fixtures.json");
    if (fs.existsSync(legacyFixtures)) {
      filesToRead.push({ filePath: legacyFixtures, fallbackCity: "İstanbul" });
    }
  }

  const seenMatchIds = new Set<string>();
  const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(new Date());

  const filterNorm = cityFilter && cityFilter !== "all" ? normTr(cityFilter) : "";
  const allProAliases = new Set<string>(["pro", "pro-leagues", "profesyonel"]);
  for (const p of PRO_LEAGUES_CONFIG) {
    allProAliases.add(normTr(p.slug));
    allProAliases.add(normTr(p.name));
    for (const a of p.aliases) allProAliases.add(normTr(a));
  }
  const isProOnlyFilter = filterNorm !== "" && allProAliases.has(filterNorm);

  if (!isProOnlyFilter) {
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

          const isPast = mDate < todayStr;
          const hasScore = hScore > 0 || aScore > 0 || isForfeit;
          if (isPast && !hasScore) {
            // Volleybox geçmişte oynanan maçların skorsuz girilmesine izin vermez
            continue;
          }

          const matchId = String(m?.id || `${citySlug}-${entry.matches.length}`);
          if (seenMatchIds.has(matchId)) continue;
          seenMatchIds.add(matchId);

          entry.matches.push({
            id: matchId,
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
  }

  // Profesyonel Ligleri Ekle (Kadınlar 2. Ligi, KFC Kadınlar 1. Ligi, Vodafone Sultanlar Ligi)
  const shouldScanPro = filterNorm === "" || isProOnlyFilter;
  if (shouldScanPro) {
    for (const pConfig of PRO_LEAGUES_CONFIG) {
      if (filterNorm && filterNorm !== "pro" && filterNorm !== "pro-leagues" && filterNorm !== "profesyonel") {
        const matchesThis =
          filterNorm === normTr(pConfig.slug) ||
          filterNorm === normTr(pConfig.name) ||
          pConfig.aliases.some((a) => normTr(a) === filterNorm);
        if (!matchesThis) continue;
      }

      const pPath = path.join(dataDir, pConfig.file);
      if (!fs.existsSync(pPath)) continue;

      try {
        const pRaw = JSON.parse(fs.readFileSync(pPath, "utf-8"));
        const matches = Array.isArray(pRaw.tum_maclar) ? pRaw.tum_maclar : [];

        for (const m of matches) {
          if (m?.volleybox?.synced) continue;

          let mDate = String(m?.tarih || m?.date || "").trim();
          if (mDate.includes(".")) {
            const parts = mDate.split(".");
            if (parts.length === 3) {
              const year = parts[2].length === 4 ? parts[2] : `20${parts[2]}`;
              mDate = `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
            }
          }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(mDate)) continue;

          let hScore = 0;
          let aScore = 0;
          if (m?.set_a != null && m?.set_b != null) {
            hScore = Number(m.set_a) || 0;
            aScore = Number(m.set_b) || 0;
          } else if (m?.home_score != null && m?.away_score != null) {
            hScore = Number(m.home_score) || 0;
            aScore = Number(m.away_score) || 0;
          }

          const isForfeit =
            Boolean(m?.forfeit) ||
            m?.mac_durumu_kod === "H" ||
            /hükmen|hukmen/i.test(
              `${m?.durum || ""} ${m?.takim_a || ""} ${m?.takim_b || ""} ${m?.home_team || ""} ${m?.away_team || ""}`
            );

          const hasScore = hScore > 0 || aScore > 0 || isForfeit;
          const isPast = mDate < todayStr;
          if (isPast && !hasScore) {
            // Volleybox geçmişte oynanan maçların skorsuz girilmesine izin vermez
            continue;
          }

          const matchId = String(m?.id || `${pConfig.slug}-${byTourn.get(pConfig.url)?.matches.length || 0}`);
          if (seenMatchIds.has(matchId)) continue;
          seenMatchIds.add(matchId);

          if (!byTourn.has(pConfig.url)) {
            const slug = pConfig.url.replace(/\/+$/, "").split("/").pop() || pConfig.slug;
            byTourn.set(pConfig.url, {
              tournament_url: pConfig.url,
              tournament_slug: slug,
              city: pConfig.name,
              city_slug: pConfig.slug,
              category: pConfig.category,
              missing_count: 0,
              matches: [],
            });
          }

          const entry = byTourn.get(pConfig.url)!;
          const scoreStr = m?.skor || (hasScore ? `${hScore}-${aScore}` : "0-0");
          const groupName = String(m?.grup_adi || (m?.hafta ? `${m.hafta}. Hafta` : "-"));
          const hallName = String(m?.salon || m?.hall || "-");
          const homeName = String(m?.takim_a || m?.home_team || "");
          const awayName = String(m?.takim_b || m?.away_team || "");
          const timeStr =
            m?.saat && m.saat !== "--:--"
              ? String(m.saat)
              : m?.time && m.time !== "--:--"
                ? String(m.time)
                : "--:--";

          entry.matches.push({
            id: matchId,
            city: String(m?.sehir || pConfig.name),
            city_slug: pConfig.slug,
            category: pConfig.category,
            group: groupName,
            date: mDate,
            time: timeStr,
            home_team: homeName,
            away_team: awayName,
            score: scoreStr,
            hall: hallName !== "TBD" ? hallName : "-",
            forfeit: isForfeit,
            tournament_url: pConfig.url,
          });
          entry.missing_count = entry.matches.length;
        }
      } catch {
        // ignore malformed pro json
      }
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

  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "Volleybox tarayıcı botu Playwright tarayıcı otomasyonu kullandığı için yalnızca yerel geliştirme ortamında (localhost:3000) veya bilgisayarınızın terminalinde (npm run push:volleybox) çalıştırılabilir. Canlı sunucuda (Render) tarayıcı açılamaz.",
      },
      { status: 400 }
    );
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

  if (action === "health") {
    const reportFile = path.join(dataDir, "bot_health_report.json");
    const quarantineFile = path.join(dataDir, "bot_quarantine.json");
    let report: unknown = null;
    let quarantine: Record<string, unknown> = {};

    if (fs.existsSync(reportFile)) {
      try {
        report = JSON.parse(fs.readFileSync(reportFile, "utf-8"));
      } catch {
        // ignore
      }
    }
    if (fs.existsSync(quarantineFile)) {
      try {
        quarantine = JSON.parse(fs.readFileSync(quarantineFile, "utf-8"));
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      ok: true,
      report,
      quarantine,
    });
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
    hasSavedAuth: fs.existsSync(authFile) || fs.existsSync(profileDir),
    isLocalRuntime: process.env.NODE_ENV === "development",
  });
}

export async function POST(request: Request) {
  if (!(await isAuthorizedAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 401 });
  }

  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      {
        error:
          "Volleybox tarayıcı botu Playwright tarayıcı otomasyonu kullandığı için yalnızca yerel geliştirme ortamında (localhost:3000) veya bilgisayarınızın terminalinde (npm run push:volleybox) çalıştırılabilir. Canlı sunucuda (Render) tarayıcı açılamaz.",
      },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action || "start");
  const runner = getRunner();

  // 1. JSON & Veri Yönetim Aksiyonları (Tarayıcı gerektirmez)
  if (action === "health_check") {
    const pyCmd = resolvePythonCommand();
    const scriptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "check_bot_health.py");
    try {
      const child = spawn(pyCmd, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" },
      });
      await new Promise<void>((resolve, reject) => {
        child.on("close", (code) => {
          if (code === 0) resolve();
          else reject(new Error(`Check exited with code ${code}`));
        });
        child.on("error", reject);
      });
      const reportFile = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "bot_health_report.json");
      const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf-8")) : null;
      return NextResponse.json({ ok: true, report });
    } catch (err) {
      return NextResponse.json(
        { error: `Sağlık denetimi çalıştırılamadı: ${err instanceof Error ? err.message : String(err)}` },
        { status: 500 }
      );
    }
  }

  if (action === "add_alias") {
    const teamName = String(body.team_name || "").trim();
    const targetTeamId = String(body.target_team_id || "").trim();
    if (!teamName || !targetTeamId) {
      return NextResponse.json({ error: "team_name ve target_team_id zorunludur." }, { status: 400 });
    }

    const mappingsPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "volleybox-mappings.json");
    if (!fs.existsSync(mappingsPath)) {
      return NextResponse.json({ error: "volleybox-mappings.json bulunamadı." }, { status: 404 });
    }

    try {
      const rawData = JSON.parse(fs.readFileSync(mappingsPath, "utf-8"));
      interface TeamMappingEntry {
        team_id?: string | number;
        volleybox_url?: string;
        matched_as?: string;
        internal_name?: string;
        aliases?: string[];
      }
      let targetMapping: TeamMappingEntry | null = null;
      for (const m of (rawData.mappings || []) as TeamMappingEntry[]) {
        const url = m.volleybox_url || "";
        const mId = m.team_id ? String(m.team_id) : (url.match(/[-/]t(\d+)/)?.[1] ?? "");
        if (mId === targetTeamId) {
          targetMapping = m;
          break;
        }
      }

      if (!targetMapping) {
        return NextResponse.json(
          { error: `ID (${targetTeamId}) ile eşleşen Volleybox takımı bulunamadı.` },
          { status: 404 }
        );
      }

      if (!Array.isArray(targetMapping.aliases)) {
        targetMapping.aliases = [];
      }
      if (!targetMapping.aliases.includes(teamName)) {
        targetMapping.aliases.push(teamName);
      }

      fs.writeFileSync(mappingsPath, JSON.stringify(rawData, null, 2), "utf-8");

      // Raporu arka planda hızlıca güncelle
      const pyCmd = resolvePythonCommand();
      const scriptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts", "check_bot_health.py");
      try {
        const child = spawn(pyCmd, [scriptPath], {
          cwd: process.cwd(),
          env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" },
        });
        await new Promise<void>((resolve) => {
          child.on("close", () => resolve());
          child.on("error", () => resolve());
        });
      } catch {
        // ignore
      }

      const reportFile = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "bot_health_report.json");
      const report = fs.existsSync(reportFile) ? JSON.parse(fs.readFileSync(reportFile, "utf-8")) : null;

      return NextResponse.json({
        ok: true,
        message: `"${teamName}" takımı "${targetMapping.matched_as || targetMapping.internal_name}" profiline başarıyla eklendi.`,
        report,
      });
    } catch (e) {
      return NextResponse.json(
        { error: `Eşleştirme eklenemedi: ${e instanceof Error ? e.message : String(e)}` },
        { status: 500 }
      );
    }
  }

  if (action === "quarantine_remove") {
    const matchId = String(body.match_id || "").trim();
    if (!matchId) {
      return NextResponse.json({ error: "match_id zorunludur." }, { status: 400 });
    }
    const qFile = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "bot_quarantine.json");
    if (fs.existsSync(qFile)) {
      try {
        const qData = JSON.parse(fs.readFileSync(qFile, "utf-8"));
        delete qData[matchId];
        fs.writeFileSync(qFile, JSON.stringify(qData, null, 2), "utf-8");
      } catch {
        // ignore
      }
    }
    return NextResponse.json({ ok: true, match_id: matchId });
  }

  if (action === "quarantine_clear") {
    const qFile = path.join(/*turbopackIgnore: true*/ process.cwd(), "data", "bot_quarantine.json");
    if (fs.existsSync(qFile)) {
      fs.unlinkSync(qFile);
    }
    return NextResponse.json({ ok: true, cleared: true });
  }

  if (action === "mark_synced") {
    const citySlug = String(body.city_slug || "").trim().toLowerCase();
    const matchId = body.match_id ? String(body.match_id) : null;
    const tournamentUrl = body.tournament_url ? String(body.tournament_url) : null;

    if (!citySlug) {
      return NextResponse.json({ error: "İl/Lig slug parametresi zorunludur." }, { status: 400 });
    }

    const dataDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "data");

    // 1. Profesyonel Lig Kontrolü
    const matchedPro = PRO_LEAGUES_CONFIG.find(
      (p) => p.slug === citySlug || p.aliases.map((a) => normTr(a)).includes(normTr(citySlug))
    );

    if (matchedPro) {
      const proFilePath = path.join(dataDir, matchedPro.file);
      if (!fs.existsSync(proFilePath)) {
        return NextResponse.json({ error: `${matchedPro.name} veri dosyası bulunamadı.` }, { status: 404 });
      }

      try {
        const pData = JSON.parse(fs.readFileSync(proFilePath, "utf-8"));
        let updatedCount = 0;
        let syncedCount = 0;

        interface MatchLike {
          id?: string;
          tarih?: string;
          date?: string;
          saat?: string;
          time?: string;
          takim_a?: string;
          home_team?: string;
          takim_b?: string;
          away_team?: string;
          skor?: string;
          score?: string;
          set_a?: string | number;
          set_b?: string | number;
          salon?: string;
          hall?: string;
          volleybox?: Record<string, unknown>;
        }

        const updateMatchList = (list: unknown) => {
          if (!Array.isArray(list)) return;
          for (const m of list as MatchLike[]) {
            const isTarget = matchId ? String(m.id) === matchId : true;
            if (isTarget && !m.volleybox?.synced) {
              m.volleybox = {
                synced: true,
                match_id: m.volleybox?.match_id || "",
                url: tournamentUrl || m.volleybox?.url || matchedPro.url,
                host_name: m.takim_a || m.home_team || "",
                guest_name: m.takim_b || m.away_team || "",
                score: m.skor || (m.set_a != null ? `${m.set_a}-${m.set_b}` : "0-0"),
                has_score: Boolean(m.set_a || m.set_b),
                vb_date: m.tarih || m.date || "",
                vb_time: m.saat || m.time || "",
                vb_hall: m.salon || m.hall || "",
              };
              updatedCount++;
            }
            if (m.volleybox?.synced) {
              syncedCount++;
            }
          }
        };

        updateMatchList(pData.tum_maclar);
        if (Array.isArray(pData.gruplar)) {
          for (const g of pData.gruplar) {
            updateMatchList(g.fikstur);
          }
        }

        if (!pData.metadata) pData.metadata = {};
        pData.metadata.volleybox_synced_matches = syncedCount;
        pData.metadata.volleybox_sync_updated_at = new Date().toISOString();
        fs.writeFileSync(proFilePath, JSON.stringify(pData, null, 2), "utf-8");

        return NextResponse.json({
          ok: true,
          updatedCount,
          syncedCount,
          tournaments: collectMissingMatchesPreview("all"),
        });
      } catch (e) {
        return NextResponse.json(
          { error: `Pro lig dosyası güncellenirken hata: ${e instanceof Error ? e.message : String(e)}` },
          { status: 500 }
        );
      }
    }

    // 2. Altyapı Şehir Dosyası Kontrolü
    const cityFile = path.join(dataDir, "cities", `${citySlug}.json`);
    if (!fs.existsSync(cityFile)) {
      return NextResponse.json({ error: "Şehir veri dosyası bulunamadı." }, { status: 404 });
    }

    try {
      const cityData = JSON.parse(fs.readFileSync(cityFile, "utf-8"));
      let updatedCount = 0;
      let syncedCount = 0;

      for (const m of cityData.matches || []) {
        let shouldMark = false;
        if (matchId && m.id === matchId) {
          shouldMark = true;
        } else if (!matchId) {
          shouldMark = true;
        }

        if (shouldMark && !m.volleybox?.synced) {
          m.volleybox = {
            synced: true,
            match_id: m.volleybox?.match_id || "",
            url: tournamentUrl || m.volleybox?.url || "https://women.volleybox.net",
            host_name: m.home_team || "",
            guest_name: m.away_team || "",
            score: m.score || "0-0",
            has_score: (m.home_score || 0) > 0 || (m.away_score || 0) > 0,
            vb_date: m.date,
            vb_time: m.time || "",
            vb_hall: m.hall || "",
          };
          updatedCount++;
        }

        if (m.volleybox?.synced) {
          syncedCount++;
        }
      }

      cityData.volleybox_synced_matches = syncedCount;
      cityData.volleybox_sync_updated_at = new Date().toISOString();
      fs.writeFileSync(cityFile, JSON.stringify(cityData, null, 2), "utf-8");

      return NextResponse.json({
        ok: true,
        updatedCount,
        syncedCount,
        tournaments: collectMissingMatchesPreview("all"),
      });
    } catch (e) {
      return NextResponse.json(
        { error: `Dosya güncellenirken hata: ${e instanceof Error ? e.message : String(e)}` },
        { status: 500 }
      );
    }
  }

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
  const headless = Boolean(body.headless);

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
    } else if (city === "all") {
      args.push("--include-pro");
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

  const pyCmd = resolvePythonCommand();
  appendLog(
    runner,
    `🚀 Komut başlatıldı: ${pyCmd} scripts/push_volleybox_matches.py ${args.slice(1).join(" ")}`
  );
  

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
    const msg = `❌ Bot başlatılamadı (${pyCmd}): ${err.message}. Bilgisayarınızda Python ve Playwright kurulu olduğundan emin olun.`;
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
