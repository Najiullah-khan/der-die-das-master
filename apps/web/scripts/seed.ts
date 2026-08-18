import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import type { Word } from "@ddd/shared";
import { db } from "../lib/db/client";
import { achievements, words } from "../lib/db/schema";
import { ACHIEVEMENTS } from "../lib/game-engine/achievements";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOUNS_FILE = path.resolve(__dirname, "../../../packages/word-data/processed/nouns.json");

async function main() {
  const nouns: Word[] = JSON.parse(await readFile(NOUNS_FILE, "utf-8"));

  console.log(`Seeding ${nouns.length} words...`);

  const now = new Date();
  const BATCH_SIZE = 500;
  for (let i = 0; i < nouns.length; i += BATCH_SIZE) {
    const batch = nouns.slice(i, i + BATCH_SIZE).map((w) => ({
      noun: w.noun,
      slug: w.slug,
      article: w.article,
      plural: w.plural,
      emoji: w.emoji,
      emojiSource: w.emojiSource,
      translation: w.translation,
      cefrLevel: w.cefrLevel,
      exampleDe: w.exampleDe,
      exampleEn: w.exampleEn,
      exampleSource: w.exampleSource,
      pronunciation: w.pronunciation,
      frequencyRank: w.frequencyRank,
      source: w.source,
      createdAt: now,
    }));
    await db.insert(words).values(batch).onConflictDoNothing();
    console.log(`  ${Math.min(i + BATCH_SIZE, nouns.length)}/${nouns.length}`);
  }

  console.log(`Seeding ${ACHIEVEMENTS.length} achievement definitions...`);
  await db
    .insert(achievements)
    .values(
      ACHIEVEMENTS.map((a) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        icon: a.icon,
        criteriaJson: JSON.stringify(a.criteria),
      })),
    )
    .onConflictDoUpdate({
      target: achievements.id,
      set: { title: sql`excluded.title`, description: sql`excluded.description`, icon: sql`excluded.icon`, criteriaJson: sql`excluded.criteria_json` },
    });

  console.log("Done.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
