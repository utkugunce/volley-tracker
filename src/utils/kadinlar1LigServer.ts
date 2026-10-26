import fs from "fs";
import path from "path";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";

export type Kadinlar1LigData = Kadinlar2LigData;

/**
 * Sunucu tarafında KFC Kadınlar 1. Ligi JSON verisini diskten okur.
 * Yalnızca sunucu bileşenlerinde (Server Components / Route Handlers) kullanılmalıdır.
 */
export function getKadinlar1LigData(): Kadinlar1LigData {
  const filePath = path.join(process.cwd(), "data", "kadinlar_1_lig.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "data/kadinlar_1_lig.json dosyası bulunamadı. Lütfen önce scripts/scrape_kadinlar_1_lig.py çalıştırın."
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
