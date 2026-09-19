import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { timingSafeEqual } from "crypto";
import { applyOverridesToMatches, applyOverridesToMatchesAsync } from "@/utils/overrides";
import { RateLimiter, getClientIp } from "@/utils/rateLimit";

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

// Max 2 refresh triggers per 2 minutes per IP to prevent GitHub Actions / server load abuse
const refreshLimiter = new RateLimiter({
  windowMs: 120 * 1000,
  maxRequests: 2,
});

function normalizeCitySlug(str: string): string {
  return str
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCity = searchParams.get("city") || "istanbul";
    const citySlug = normalizeCitySlug(rawCity);
    const refresh = searchParams.get("refresh");
    const category = searchParams.get("category");
    const ageGroup = searchParams.get("age_group");
    const gender = searchParams.get("gender");
    const hall = searchParams.get("hall");
    const search = searchParams.get("q")?.toLowerCase();
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    let syncMeta:
      | { attempted: boolean; success: boolean; mode: string; message: string }
      | undefined;

    if (refresh === "1") {
      const adminToken = process.env.ADMIN_TOKEN;
      const xAdmin = request.headers.get("x-admin-token");
      const authHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      const providedToken = xAdmin || authHeader;

      // Sadece admin yetkisi olan kullanıcılar canlı taramayı tetikleyebilir
      const isAuthorized = Boolean(
        !adminToken || (providedToken && safeCompare(providedToken, adminToken))
      );

      if (adminToken && !isAuthorized) {
        syncMeta = {
          attempted: false,
          success: true,
          mode: "cached",
          message: "Canlı tarama tetikleme yetkisi yönetici paneli ile sınırlandırılmıştır.",
        };
      } else {
        const clientIp = getClientIp(request);
        const limitCheck = refreshLimiter.check(clientIp);

        if (!limitCheck.allowed) {
          syncMeta = {
            attempted: false,
            success: true,
            mode: "rate_limited",
            message: `Fikstür yenileme isteği yakın zamanda tetiklendi. Lütfen ${limitCheck.retryAfterSeconds || 60} saniye sonra tekrar deneyin. Önbellekteki güncel veriler gösteriliyor.`,
          };
        } else if (process.env.VERCEL) {
          const rawToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
          const ghToken = rawToken?.trim();
          const repo = process.env.GITHUB_REPOSITORY;
          if (ghToken && repo) {
            try {
              const dispatchRes = await fetch(
                `https://api.github.com/repos/${repo}/actions/workflows/scrape-sync.yml/dispatches`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${ghToken}`,
                    Accept: "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                    "User-Agent": "VolleyTracker-App",
                  },
                  body: JSON.stringify({ ref: "main" }),
                }
              );

              if (dispatchRes.ok || dispatchRes.status === 204) {
                syncMeta = {
                  attempted: true,
                  success: true,
                  mode: "github_actions_dispatch",
                  message:
                    "Canlı tarama GitHub Actions üzerinde başlatıldı! Yaklaşık 1-2 dakika içinde bülten ve Volleybox verileri güncellenecektir.",
                };
              } else {
                const errBody = await dispatchRes.text();
                console.error("GitHub Actions dispatch failed:", dispatchRes.status, errBody);
                syncMeta = {
                  attempted: true,
                  success: false,
                  mode: "github_actions_dispatch",
                  message: `Canlı tarama tetiklenemedi (Durum kodu: ${dispatchRes.status}). Lütfen daha sonra tekrar deneyin.`,
                };
              }
            } catch (e: any) {
              console.error("GitHub Actions dispatch error:", e);
              syncMeta = {
                attempted: true,
                success: false,
                mode: "github_actions_dispatch",
                message: "Canlı tarama servisine bağlanırken bir hata oluştu.",
              };
            }
          } else {
            syncMeta = {
              attempted: true,
              success: false,
              mode: "github_actions_cron",
              message:
                "Bulut ortamında canlı fikstür ve Volleybox taraması GitHub Actions ile periyodik çalışmaktadır.",
            };
          }
        } else {
          try {
            const venvPyWin = path.join(process.cwd(), ".venv", "Scripts", "python.exe");
            const venvPyNix = path.join(process.cwd(), ".venv", "bin", "python");
            const pythonBin = fs.existsSync(venvPyWin)
              ? venvPyWin
              : fs.existsSync(venvPyNix)
              ? venvPyNix
              : "python";

            // Kullanıcı tam tarama talep ettiği için her yenilemede 81 ilin tamamı ve Volleybox tam taranır
            execFileSync(pythonBin, ["scripts/scrape_all_provinces.py"], {
              cwd: process.cwd(),
              timeout: 120000,
              stdio: "ignore",
            });

            syncMeta = {
              attempted: true,
              success: true,
              mode: "local_python",
              message: "81 ilin bülteni ve Volleybox verileri tam tarama ile başarıyla senkronize edildi.",
            };
          } catch (err: any) {
            syncMeta = {
              attempted: true,
              success: false,
              mode: "local_python",
              message: "Tam tarama sırasında bağlantı hatası oluştu, önbellekteki veriler gösteriliyor.",
            };
            console.warn("Live scraper refresh warning (falling back to cached data):", err);
          }
        }
      }
    }

    // Doğru resmi il ismini bul (cities.json üzerinden)
    let officialCityName = citySlug;
    try {
      const citiesIndexPath = path.join(process.cwd(), "data", "cities.json");
      if (fs.existsSync(citiesIndexPath)) {
        const citiesData = JSON.parse(fs.readFileSync(citiesIndexPath, "utf-8"));
        const found = (citiesData.cities || []).find(
          (c: any) => c.slug === citySlug || c.ilid === rawCity || c.slug === rawCity.toLowerCase()
        );
        if (found) {
          officialCityName = found.name;
        }
      }
    } catch {
      // fallback
    }

    let data: any;

    if (citySlug === "all" || citySlug === "tumu" || citySlug === "turkiye") {
      const citiesDir = path.join(process.cwd(), "data", "cities");
      const allMatches: any[] = [];
      const allStandings: Record<string, any[]> = {};
      const categoriesSet = new Set<string>(["Tümü"]);
      const hallsSet = new Set<string>(["Tümü"]);
      let latestUpdated = new Date(0).toISOString();

      if (fs.existsSync(citiesDir)) {
        const files = fs.readdirSync(citiesDir).filter((f) => f.endsWith(".json"));
        for (const file of files) {
          try {
            const content = fs.readFileSync(path.join(citiesDir, file), "utf-8");
            const parsed = JSON.parse(content);
            const cityName = parsed.city || file.replace(".json", "");
            if (parsed.updated_at && parsed.updated_at > latestUpdated) {
              latestUpdated = parsed.updated_at;
            }
            if (Array.isArray(parsed.matches)) {
              for (const m of parsed.matches) {
                allMatches.push({
                  ...m,
                  city: m.city || cityName,
                });
                if (m.category) categoriesSet.add(m.category);
                if (m.hall) hallsSet.add(m.hall);
              }
            }
            if (parsed.standings && typeof parsed.standings === "object") {
              for (const [k, v] of Object.entries(parsed.standings)) {
                allStandings[`${cityName} - ${k}`] = v as any[];
              }
            }
          } catch (e) {
            console.warn(`Error reading city file ${file}:`, e);
          }
        }
      }

      data = {
        city: "Tüm İller",
        slug: "all",
        title: "TVF Tüm İller Genç & Yıldız Kızlar Süper Lig",
        updated_at: latestUpdated > new Date(0).toISOString() ? latestUpdated : new Date().toISOString(),
        total_matches: allMatches.length,
        source: "TVF İl Temsilcilikleri",
        filters: {
          categories: Array.from(categoriesSet),
          age_groups: ["Tümü", "Genç", "Yıldız"],
          genders: ["Kız"],
          halls: Array.from(hallsSet),
        },
        matches: allMatches,
        standings: allStandings,
      };
    } else {
      let filePath = path.join(process.cwd(), "data", "fixtures.json");
      if (citySlug && citySlug !== "istanbul") {
        const citySpecificPath = path.join(process.cwd(), "data", "cities", `${citySlug}.json`);
        if (fs.existsSync(citySpecificPath)) {
          filePath = citySpecificPath;
        } else {
          // İlgili ilde henüz fikstür açıklanmamış
          return NextResponse.json({
            city: officialCityName,
            slug: citySlug,
            title: `TVF ${officialCityName} Genç & Yıldız Kızlar Süper Lig`,
            updated_at: new Date().toISOString(),
            total_matches: 0,
            unfiltered_total: 0,
            source: `https://${citySlug}.voleyboliltemsilciligi.com`,
            filters: {
              categories: ["Tümü", "Genç Kızlar Süper Lig", "Genç Kızlar 1. Ligi", "Yıldız Kızlar Süper Lig"],
              age_groups: ["Tümü", "Genç", "Yıldız"],
              genders: ["Kız"],
              halls: ["Tümü"],
            },
            matches: [],
            standings: {},
            note: "Bu ilin TVF temsilciliği yeni sezon bültenini henüz girmemiştir.",
            sync: syncMeta,
          });
        }
      }

      if (!fs.existsSync(filePath)) {
        return NextResponse.json(
          {
            error: "fixtures.json bulunamadı. Lütfen önce scraper'ı çalıştırın.",
            matches: [],
            total_matches: 0,
          },
          { status: 404 }
        );
      }

      const fileContent = fs.readFileSync(filePath, "utf-8");
      data = JSON.parse(fileContent);
    }

    let rawMatches = data.matches || [];
    let matches = await applyOverridesToMatchesAsync(rawMatches);

    if (category && category !== "Tümü") {
      matches = matches.filter((m: any) => m.category === category);
    }

    if (ageGroup && ageGroup !== "Tümü") {
      matches = matches.filter((m: any) => m.age_group === ageGroup);
    }

    if (gender && gender !== "Tümü") {
      matches = matches.filter((m: any) => m.gender === gender);
    }

    if (hall && hall !== "Tümü") {
      matches = matches.filter((m: any) => m.hall === hall);
    }

    if (status && status !== "Tümü") {
      matches = matches.filter((m: any) => m.status === status);
    }

    if (date) {
      matches = matches.filter((m: any) => m.date === date);
    }

    if (search) {
      matches = matches.filter((m: any) => {
        const home = (m.home_team || "").toLowerCase();
        const away = (m.away_team || "").toLowerCase();
        const hallName = (m.hall || "").toLowerCase();
        const cat = (m.category || "").toLowerCase();
        return (
          home.includes(search) ||
          away.includes(search) ||
          hallName.includes(search) ||
          cat.includes(search)
        );
      });
    }

    const headers: Record<string, string> = {};
    if (refresh === "1") {
      headers["Cache-Control"] = "no-store, no-cache, must-revalidate";
    } else {
      headers["Cache-Control"] = "public, s-maxage=60, stale-while-revalidate=300";
    }

    return NextResponse.json(
      {
        city: data.city || "İstanbul",
        title: data.title || "TVF İstanbul Genç & Yıldız Kızlar Süper Lig",
        updated_at: data.updated_at,
        total_matches: matches.length,
        unfiltered_total: data.total_matches,
        source: data.source,
        filters: data.filters,
        matches,
        standings: data.standings || {},
        sync: syncMeta,
      },
      { headers }
    );
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Fikstür verisi okunurken hata oluştu." },
      { status: 500 }
    );
  }
}
