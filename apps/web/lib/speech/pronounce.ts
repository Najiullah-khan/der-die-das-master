/** Speaks "{article} {noun}" via the Web Speech API, configured for German pronunciation.
 * No-ops outside the browser or when SpeechSynthesis isn't available (SSR, unsupported browsers). */
export function pronounceWord(article: string, noun: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(`${article} ${noun}`);
  utterance.lang = "de-DE";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
