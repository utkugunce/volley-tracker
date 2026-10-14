import fs from "fs";
import path from "path";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";
import { loadKadinlar2LigWithFallback } from "./supabaseData";

/**
 * Sunucu tarafında Kadınlar 2. Ligi JSON verisini diskten okur.
 * Yalnızca sunucu bileşenlerinde (Server Components / Route Handlers) kullanılmalıdır.
 */
export function getKadinlar2LigData(): Kadinlar2LigData {
  const filePath = path.join(process.cwd(), "data", "kadinlar_2_lig.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "data/kadinlar_2_lig.json dosyası bulunamadı. Lütfen önce scraper'ı çalıştırın."
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

/**
 * Önce Supabase'den önbellekli okur; erişilemezse data/kadinlar_2_lig.json disk yedeğine düşer.
 */
export async function getKadinlar2LigDataAsync(): Promise<Kadinlar2LigData> {
  return loadKadinlar2LigWithFallback();
}
