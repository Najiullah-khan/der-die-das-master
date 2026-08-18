import { inArray } from "drizzle-orm";
import { db } from "../lib/db/client";
import { wordRelations, words } from "../lib/db/schema";

/**
 * Curated `same_topic` vocabulary groups (Phase 4 quality constraint: only well-established
 * topic membership, never an invented or random pairing). Each list is standard beginner/
 * intermediate German curriculum vocabulary (Goethe-Institut-style topic sets) for the five
 * topics named in the implementation plan. Matching against the seeded `words.noun` column is
 * exact-string and one-directional-safe: a listed noun that isn't in the dataset (different
 * source, different spelling) is simply skipped — this never invents a word or asserts its
 * gender, since `words.article` is always the DB's own value for whatever actually matched.
 *
 * Every noun appears in exactly one list, so no pair gets double-categorized.
 */
const TOPIC_VOCABULARY: Record<string, string[]> = {
  "Essen & Trinken": [
    "Brot", "Butter", "Milch", "Käse", "Wurst", "Fleisch", "Fisch", "Ei", "Zucker", "Salz",
    "Pfeffer", "Kaffee", "Tee", "Wasser", "Saft", "Wein", "Bier", "Apfel", "Birne", "Banane",
    "Orange", "Zitrone", "Erdbeere", "Kartoffel", "Tomate", "Gurke", "Zwiebel", "Karotte", "Reis",
    "Nudel", "Suppe", "Salat", "Kuchen", "Schokolade", "Marmelade", "Honig", "Joghurt", "Sahne",
    "Frühstück", "Restaurant", "Löffel", "Gabel", "Messer", "Teller", "Tasse", "Glas", "Flasche",
    "Brötchen", "Pizza",
  ],
  "Reisen & Verkehr": [
    "Zug", "Bus", "Auto", "Fahrrad", "Flugzeug", "Schiff", "Taxi", "Bahnhof", "Flughafen",
    "Haltestelle", "Fahrkarte", "Koffer", "Gepäck", "Reisepass", "Ausweis", "Straße", "Autobahn",
    "Kreuzung", "Ampel", "Parkplatz", "Führerschein", "Fahrer", "Reise", "Urlaub", "Hotel",
    "Richtung", "Abfahrt", "Ankunft", "Gleis", "Ausflug", "Karte", "Ticket", "Motorrad", "Brücke",
    "Tunnel",
  ],
  "Wohnen & Möbel": [
    "Haus", "Wohnung", "Zimmer", "Küche", "Bad", "Badezimmer", "Schlafzimmer", "Wohnzimmer",
    "Flur", "Keller", "Dach", "Garten", "Balkon", "Tisch", "Stuhl", "Sofa", "Bett", "Schrank",
    "Regal", "Lampe", "Spiegel", "Teppich", "Vorhang", "Fenster", "Tür", "Wand", "Boden", "Decke",
    "Miete", "Vermieter", "Mieter", "Nachbar", "Herd", "Kühlschrank", "Waschmaschine", "Ofen",
    "Toilette", "Dusche", "Badewanne", "Kissen",
  ],
  "Natur & Tiere": [
    "Baum", "Wald", "Blume", "Gras", "Wiese", "Berg", "Fluss", "See", "Meer", "Strand", "Sonne",
    "Mond", "Stern", "Himmel", "Wolke", "Regen", "Schnee", "Wind", "Wetter", "Hund", "Katze",
    "Vogel", "Pferd", "Kuh", "Schwein", "Huhn", "Maus", "Bär", "Löwe", "Elefant", "Affe",
    "Schmetterling", "Biene", "Blatt", "Insel", "Tal", "Ente", "Schaf", "Ziege", "Spinne",
  ],
  "Arbeit & Beruf": [
    "Arbeit", "Beruf", "Firma", "Büro", "Chef", "Kollege", "Mitarbeiter", "Gehalt", "Lohn",
    "Vertrag", "Bewerbung", "Lebenslauf", "Termin", "Besprechung", "Projekt", "Aufgabe", "Kunde",
    "Lehrer", "Arzt", "Ingenieur", "Anwalt", "Polizist", "Koch", "Verkäufer", "Kellner", "Bäcker",
    "Fabrik", "Werkstatt", "Karriere", "Ausbildung", "Praktikum", "Rente", "Sekretär",
    "Handwerker",
  ],
};

async function main() {
  let totalMatched = 0;
  let totalRelations = 0;

  for (const [topic, nouns] of Object.entries(TOPIC_VOCABULARY)) {
    const rows = await db.select({ id: words.id, noun: words.noun }).from(words).where(inArray(words.noun, nouns));

    if (rows.length < 2) {
      console.log(`${topic}: only ${rows.length}/${nouns.length} curated noun(s) found in the dataset — skipping.`);
      continue;
    }

    const relations: (typeof wordRelations.$inferInsert)[] = [];
    for (const a of rows) {
      for (const b of rows) {
        if (a.id === b.id) continue;
        relations.push({ wordId: a.id, relatedWordId: b.id, relationType: "same_topic" });
      }
    }

    await db.insert(wordRelations).values(relations).onConflictDoNothing();
    console.log(`${topic}: matched ${rows.length}/${nouns.length} curated nouns -> ${relations.length} directed relations`);
    totalMatched += rows.length;
    totalRelations += relations.length;
  }

  console.log(`Done. ${totalMatched} words matched across ${Object.keys(TOPIC_VOCABULARY).length} topics, ${totalRelations} same_topic relations inserted (idempotent — safe to re-run).`);
}

main().catch((err) => {
  console.error("seed-word-relations failed:", err);
  process.exit(1);
});
