// Kullanım: node scripts/gen-theme-vars.mjs  (Node >= 22.18; TypeScript türlerini otomatik soyar)
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildThemeVarsCss } from "../src/theme/palettes.ts";

const out = fileURLToPath(new URL("../src/theme/theme-vars.css", import.meta.url));
writeFileSync(out, buildThemeVarsCss());
console.log("Yazıldı:", out);
