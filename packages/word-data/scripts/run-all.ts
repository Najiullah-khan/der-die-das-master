import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STEPS = [
  "01-fetch-kaikki.ts",
  "02-parse-nouns.ts",
  "03-fetch-frequency.ts",
  "04-merge.ts",
  "05-fetch-tatoeba.ts",
  "06-assign-emoji.ts",
  "07-validate.ts",
];

for (const step of STEPS) {
  console.log(`\n=== Running ${step} ===`);
  execFileSync("npx", ["tsx", path.join(__dirname, step)], { stdio: "inherit" });
}

console.log("\n=== Pipeline complete ===");
