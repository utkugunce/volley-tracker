import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {
    rules: {
      "@next/next/no-page-custom-font": "off",
      // eslint-plugin-react-hooks v7 ile gelen React Compiler kuralları ESLint 8 yapılandırmasında
      // yoktu. Bu geçiş saf bir yapılandırma göçü olduğu için davranış değiştirecek refactor'lar
      // ayrı bir PR'a bırakıldı; şimdilik kapalı tutuluyor.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    ".venv/**",
  ]),
]);
