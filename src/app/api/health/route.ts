import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { evaluateDataHealth } from "@/utils/dataHealth";
import { CITY_SLUGS } from "@/utils/citySlugs";

interface DataSnapshot {
  file: string;
  exists: boolean;
  updatedAt: string | null;
  matches: number;
  lastAttemptAt?: string | null;
  lastSuccessAt?: string | null;
  contentChangedAt?: string | null;
}

function readSnapshot(filePath: string, relativePath: string): DataSnapshot {
  if (!fs.existsSync(filePath)) {
    return { file: relativePath, exists: false, updatedAt: null, matches: 0 };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const matches = Array.isArray(parsed.matches)
      ? parsed.matches.length
      : Array.isArray(parsed.tum_maclar)
        ? parsed.tum_maclar.length
        : 0;
    return {
      file: relativePath,
      exists: true,
      updatedAt: parsed.last_success_at || parsed.updated_at || parsed.metadata?.guncelleme_tarihi || null,
      matches,
      lastAttemptAt: parsed.last_attempt_at || null,
      lastSuccessAt: parsed.last_success_at || null,
      contentChangedAt: parsed.content_changed_at || null,
    };
  } catch {
    return { file: relativePath, exists: false, updatedAt: null, matches: 0 };
  }
}

export async function GET() {
  const root = path.join(process.cwd(), "data");
  const citiesDir = path.join(root, "cities");
  const snapshots: DataSnapshot[] = [
    readSnapshot(path.join(root, "fixtures.json"), "data/fixtures.json"),
    readSnapshot(path.join(root, "cities.json"), "data/cities.json"),
  ];

  const citySnapshots: DataSnapshot[] = [];
  let cityFiles = 0;
  let cityMatches = 0;
  let latestUpdatedAt: string | null = null;

  if (fs.existsSync(citiesDir)) {
    for (const file of fs.readdirSync(citiesDir).filter((name) => name.endsWith(".json"))) {
      const snapshot = readSnapshot(path.join(citiesDir, file), `data/cities/${file}`);
      citySnapshots.push(snapshot);
      if (snapshot.exists) {
        cityFiles += 1;
        cityMatches += snapshot.matches;
        if (snapshot.updatedAt && (!latestUpdatedAt || snapshot.updatedAt > latestUpdatedAt)) {
          latestUpdatedAt = snapshot.updatedAt;
        }
      }
    }
  }

  const primarySnapshots = snapshots.filter((snapshot) => snapshot.exists);
  for (const snapshot of primarySnapshots) {
    if (snapshot.updatedAt && (!latestUpdatedAt || snapshot.updatedAt > latestUpdatedAt)) {
      latestUpdatedAt = snapshot.updatedAt;
    }
  }

  let expected: string[] = [];
  try {
    const index = JSON.parse(fs.readFileSync(path.join(root, "cities.json"), "utf-8"));
    expected = (index.cities || []).filter((c: { data_file?: string; excluded?: boolean }) => c.data_file && !c.excluded).map((c: { data_file: string }) => c.data_file);
  } catch { /* Missing index is reported below. */ }
  const coverage = evaluateDataHealth([...snapshots, ...citySnapshots], ["data/fixtures.json", "data/cities.json", ...expected]);
  const healthy = cityFiles > 0 && expected.length > 0 && coverage.healthy;
  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      checkedAt: new Date().toISOString(),
      dataSource: "json-fallback",
      scope: "local-snapshot",
      data: {
        latestUpdatedAt,
        coverage,
        cityFiles,
        activeCityFiles: cityFiles,
        totalAllowedCities: CITY_SLUGS.length,
        cityMatches,
        snapshots,
      },
      integrations: {
        githubActions: Boolean(process.env.GITHUB_REPOSITORY),
        blobPersistence: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        pushNotifications: Boolean(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY
        ),
      },
    },
    { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
