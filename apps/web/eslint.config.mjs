import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // opennextjs-cloudflare's generated build output (pnpm cf:build) — regenerated every build,
    // never hand-edited, same reasoning as the .next/out/build ignores above.
    ".open-next/**",
  ]),
]);

export default eslintConfig;
