import fs from "fs";
import path from "path";
import { Kadinlar2LigData } from "@/types/kadinlar2Lig";

export type SultanlarLigiData = Kadinlar2LigData;

/**
 * Sunucu tarafında Vodafone Sultanlar Ligi JSON verisini diskten okur.
 * Yalnızca sunucu bileşenlerinde (Server Components / Route Handlers) kullanılmalıdır.
 */
export function getSultanlarLigiData(): SultanlarLigiData {
  const filePath = path.join(process.cwd(), "data", "sultanlar_ligi.json");
  if (!fs.existsSync(filePath)) {
    throw new Error(
      "data/sultanlar_ligi.json dosyası bulunamadı. Lütfen önce scripts/scrape_sultanlar_ligi.py çalıştırın."
    );
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}
