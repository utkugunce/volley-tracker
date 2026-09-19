import fs from "fs";
import path from "path";
import { Match } from "@/types/fixture";
import { put, list } from "@vercel/blob";

export interface MatchOverride {
  match_id: string;
  home_score: number | null;
  away_score: number | null;
  set_scores?: string[];
  status?: Match["status"];
  updated_at: string;
  updated_by: string;
  reason: string;
}

export interface AuditLogEntry {
  id: string;
  match_id: string;
  action: "create" | "update" | "delete";
  timestamp: string;
  updated_by: string;
  reason: string;
  old_value?: Partial<MatchOverride> | null;
  new_value?: Partial<MatchOverride> | null;
}

export interface OverridesData {
  overrides: Record<string, MatchOverride>;
  audit_log: AuditLogEntry[];
}

const OVERRIDES_FILE = path.join(process.cwd(), "data", "manual-overrides.json");
const BLOB_FILENAME = "manual-overrides.json";

// Sunucu instance'ı içinde hızlı erişim ve senkron fallback için in-memory önbellek
let memoryOverridesCache: OverridesData | null = null;

function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Senkron olarak mevcut önbellekten veya yerel dosya sisteminden okur.
 * Senkron bileşenler ve geriye dönük uyumluluk için kullanılır.
 */
export function getOverridesDataSync(): OverridesData {
  if (memoryOverridesCache) {
    return memoryOverridesCache;
  }
  try {
    if (fs.existsSync(OVERRIDES_FILE)) {
      const content = fs.readFileSync(OVERRIDES_FILE, "utf-8").trim();
      if (!content) return { overrides: {}, audit_log: [] };
      const parsed = JSON.parse(content);
      const data: OverridesData = {
        overrides: parsed.overrides || {},
        audit_log: Array.isArray(parsed.audit_log) ? parsed.audit_log : [],
      };
      memoryOverridesCache = data;
      return data;
    }
  } catch (e) {
    console.error("Error reading manual-overrides.json synchronously:", e);
  }
  return { overrides: {}, audit_log: [] };
}

/**
 * Asenkron olarak Vercel Blob (eğer yapılandırılmışsa) veya yerel dosya sisteminden okur.
 * Vercel sunucusuz fonksiyonlar arası kalıcılığı garanti eder.
 */
export async function getOverridesData(): Promise<OverridesData> {
  // 1. Vercel Blob yapılandırılmışsa doğrudan Blob üzerinden oku
  if (isBlobConfigured()) {
    try {
      const { blobs } = await list({ prefix: BLOB_FILENAME });
      const targetBlob = blobs.find((b) => b.pathname === BLOB_FILENAME) || blobs[0];

      if (targetBlob && targetBlob.url) {
        const response = await fetch(targetBlob.url, { cache: "no-store" });
        if (response.ok) {
          const parsed = await response.json();
          const data: OverridesData = {
            overrides: parsed.overrides || {},
            audit_log: Array.isArray(parsed.audit_log) ? parsed.audit_log : [],
          };
          memoryOverridesCache = data;
          return data;
        }
      }
    } catch (err) {
      console.warn("Vercel Blob okuma uyarısı (yerel önbelleğe/dosyaya dönülüyor):", err);
    }
  }

  // 2. Fallback: Yerel dosya sistemi veya in-memory önbellek
  return getOverridesDataSync();
}

/**
 * Asenkron olarak Vercel Blob'a (varsa) ve yerel dosya sistemine yazar.
 * Vercel sunucusuz salt-okunur disk hatası (EROFS) durumunda sessizce Blob ve bellek önbelleğini günceller.
 */
export async function saveOverridesData(data: OverridesData): Promise<void> {
  // Bellek önbelleğini hemen güncelle
  memoryOverridesCache = data;

  let blobSaved = false;

  // 1. Vercel Blob'a yaz
  if (isBlobConfigured()) {
    try {
      await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: true,
      });
      blobSaved = true;
    } catch (err: any) {
      console.error("Vercel Blob yazma hatası:", err);
      // Eğer Vercel ortamındaysak ve Blob yazılamadıysa kullanıcıyı bilgilendir
      if (process.env.VERCEL) {
        throw new Error(`Vercel Blob depolamasına yazılamadı: ${err.message}`);
      }
    }
  }

  // 2. Yerel dosya sistemine yazmayı dene (yerel dev veya yazılabilir fs)
  try {
    const dir = path.dirname(OVERRIDES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (fsErr: any) {
    // Vercel'de disk salt okunur olduğundan (EROFS), Blob başarıyla yazıldıysa bu beklenen bir durumdur.
    if (blobSaved) {
      return;
    }
    // Yerel geliştirme ortamındayken yazma hatası alındıysa fırlat
    if (!process.env.VERCEL) {
      console.error("Error writing manual-overrides.json:", fsErr);
      throw new Error("Manuel düzeltmeler dosyasına yazılamadı");
    }
  }
}

/**
 * Verilen maç listesine override skor ve durumlarını uygular.
 */
function internalApply(matches: Match[], overrides: Record<string, MatchOverride>): Match[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return matches;
  }

  return matches.map((m) => {
    const override = overrides[m.id];
    if (!override) return m;

    return {
      ...m,
      home_score: override.home_score !== undefined ? (override.home_score ?? undefined) : m.home_score,
      away_score: override.away_score !== undefined ? (override.away_score ?? undefined) : m.away_score,
      set_scores: override.set_scores !== undefined ? override.set_scores : (m as any).set_scores,
      status: override.status || m.status,
      manual_override: true,
      override_meta: {
        updated_at: override.updated_at,
        updated_by: override.updated_by,
        reason: override.reason,
      },
    } as Match;
  });
}

/**
 * Senkron maç skor ezme (Mevcut senkron kodların ve testlerin bozulmaması için)
 */
export function applyOverridesToMatches(matches: Match[], customOverrides?: Record<string, MatchOverride>): Match[] {
  const overrides = customOverrides || getOverridesDataSync().overrides;
  return internalApply(matches, overrides);
}

/**
 * Asenkron maç skor ezme (Vercel Blob üzerinden en taze veriyi çekip uygular)
 */
export async function applyOverridesToMatchesAsync(matches: Match[]): Promise<Match[]> {
  const data = await getOverridesData();
  return internalApply(matches, data.overrides);
}
