import type { Article } from "@ddd/shared";

/**
 * "reliable" = no known counterexamples in standard German (or the rare counterexamples are
 * homographs of a *different* word/suffix, not violations of the pattern itself — noted inline).
 * "tendency" = a genuine statistical lean with real, commonly-cited counterexamples. Shared by
 * `/der-die-das` (all three genders) and `/der`, `/die`, `/das` (their own gender only) so the
 * two never drift apart on what counts as reliable — the linguistic-accuracy bar the whole
 * flagship guide is built around.
 */
export type Reliability = "reliable" | "tendency";

export interface SuffixRule {
  suffix: string;
  reliability: Reliability;
  examples: string[];
  note?: string;
}

export interface SemanticCategory {
  label: string;
  reliability: Reliability;
  examples: string[];
  note?: string;
}

export const SUFFIX_RULES: Record<Article, SuffixRule[]> = {
  der: [
    { suffix: "-ling", reliability: "reliable", examples: ["der Lehrling", "der Frühling", "der Schmetterling"] },
    { suffix: "-or", reliability: "reliable", examples: ["der Motor", "der Doktor", "der Direktor"] },
    { suffix: "-ismus", reliability: "reliable", examples: ["der Tourismus", "der Optimismus", "der Kapitalismus"] },
    {
      suffix: "-ist",
      reliability: "reliable",
      examples: ["der Polizist", "der Tourist", "der Artist"],
      note: "The female form of the person takes -in instead (die Polizistin) — that's a different word, not an exception to this one.",
    },
    {
      suffix: "-er",
      reliability: "tendency",
      examples: ["der Lehrer", "der Computer", "der Fahrer"],
      note: "Common exceptions: die Mutter, die Butter, das Wasser, das Fenster, das Messer.",
    },
    {
      suffix: "-en",
      reliability: "tendency",
      examples: ["der Garten", "der Wagen", "der Boden"],
      note: "Nouns made from an infinitive (das Essen, das Leben, das Schreiben) are always neuter instead — a competing, equally systematic pattern.",
    },
  ],
  die: [
    { suffix: "-ung", reliability: "reliable", examples: ["die Zeitung", "die Übung", "die Meinung"] },
    { suffix: "-heit", reliability: "reliable", examples: ["die Freiheit", "die Gesundheit", "die Einheit"] },
    { suffix: "-keit", reliability: "reliable", examples: ["die Möglichkeit", "die Wichtigkeit", "die Höflichkeit"] },
    { suffix: "-schaft", reliability: "reliable", examples: ["die Freundschaft", "die Wissenschaft", "die Mannschaft"] },
    { suffix: "-tät", reliability: "reliable", examples: ["die Universität", "die Qualität", "die Realität"] },
    { suffix: "-ion", reliability: "reliable", examples: ["die Nation", "die Aktion", "die Region"] },
    {
      suffix: "-ik",
      reliability: "reliable",
      examples: ["die Musik", "die Politik", "die Technik"],
      note: "Exception: der Katholik — a person-noun (\"a Catholic\"), not this abstract-noun suffix.",
    },
    {
      suffix: "-ei",
      reliability: "reliable",
      examples: ["die Bäckerei", "die Polizei", "die Metzgerei"],
      note: "Applies to the place/activity suffix on a longer stem. Short root words that merely end in the same letters (das Ei, \"egg\") aren't this suffix.",
    },
  ],
  das: [
    {
      suffix: "-chen",
      reliability: "reliable",
      examples: ["das Mädchen", "das Brötchen", "das Kaninchen"],
      note: "Diminutives are always neuter regardless of the base word's own gender (die Frau → das Fräulein).",
    },
    {
      suffix: "-lein",
      reliability: "reliable",
      examples: ["das Fräulein", "das Büchlein", "das Tischlein"],
      note: "Same rule as -chen: diminutive suffixes override the base word's gender.",
    },
    { suffix: "-ment", reliability: "reliable", examples: ["das Instrument", "das Dokument", "das Experiment"] },
    {
      suffix: "-um",
      reliability: "reliable",
      examples: ["das Museum", "das Zentrum", "das Visum", "das Album"],
      note: "Not the same suffix as -tum below, despite the shared final letters.",
    },
    {
      suffix: "-tum",
      reliability: "tendency",
      examples: ["das Königtum", "das Christentum", "das Eigentum", "das Wachstum"],
      note: "Two well-known masculine exceptions: der Reichtum, der Irrtum.",
    },
    {
      suffix: "-o",
      reliability: "tendency",
      examples: ["das Auto", "das Foto", "das Kino", "das Büro"],
      note: "Common exception: der Euro.",
    },
  ],
};

export const SEMANTIC_CATEGORIES: Record<Article, SemanticCategory[]> = {
  der: [
    { label: "Days of the week", reliability: "reliable", examples: ["der Montag", "der Dienstag", "der Mittwoch"] },
    { label: "Months", reliability: "reliable", examples: ["der Januar", "der Februar", "der März"] },
    { label: "Seasons", reliability: "reliable", examples: ["der Frühling", "der Sommer", "der Herbst", "der Winter"] },
    { label: "Compass directions", reliability: "reliable", examples: ["der Norden", "der Süden", "der Osten", "der Westen"] },
  ],
  die: [
    {
      label: "Trees",
      reliability: "tendency",
      examples: ["die Eiche", "die Birke", "die Tanne", "die Kiefer"],
      note: "Exception: der Ahorn (maple).",
    },
    {
      label: "Flowers",
      reliability: "tendency",
      examples: ["die Rose", "die Tulpe", "die Nelke"],
      note: "Exception: der Mohn (poppy).",
    },
  ],
  das: [
    {
      label: "Metals & chemical elements",
      reliability: "reliable",
      examples: ["das Gold", "das Silber", "das Eisen", "das Kupfer", "das Aluminium"],
      note: "Alloys like der Stahl (steel) aren't pure elements, so they simply fall outside this category rather than breaking it.",
    },
    { label: "Letters of the alphabet", reliability: "reliable", examples: ["das A", "das B", "das C"] },
  ],
};

export const GENDER_LABEL: Record<Article, string> = { der: "masculine", die: "feminine", das: "neuter" };
