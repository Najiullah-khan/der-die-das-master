function stripUmlauts(s: string): string {
  return s.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u");
}

/** A brief, templated explanation of a noun's plural pattern (blueprint §8.3). */
export function describePluralPattern(noun: string, plural: string): string {
  if (plural === noun) {
    return `${noun} doesn't change in the plural: die ${plural}.`;
  }

  const hasNewUmlaut = /[äöü]/.test(plural) && !/[äöü]/.test(noun);
  const flatNoun = stripUmlauts(noun);
  const flatPlural = stripUmlauts(plural);
  const suffix = flatPlural.startsWith(flatNoun) ? flatPlural.slice(flatNoun.length) : null;

  if (suffix === "") {
    return `The plural just takes ${hasNewUmlaut ? "an umlaut, no extra ending" : "no extra ending"}: die ${plural}.`;
  }
  if (suffix && ["e", "en", "n", "er", "s"].includes(suffix)) {
    const umlautNote = hasNewUmlaut ? "an umlaut and " : "";
    return `The plural takes ${umlautNote}the ending "-${suffix}": die ${plural}.`;
  }
  return `The plural form is die ${plural} — irregular, worth memorizing separately.`;
}
