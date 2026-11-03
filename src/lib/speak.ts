// Runs in the browser: reads a Quest aloud with the device's speech synthesis, in the Quest's language.

export function guessLanguage(text: string): string {
  if (/[؀-ۿ]/.test(text)) return "ar";
  if (/\b(dan|yang|ayo|lalu|cari|dengan|untuk|di|ini|itu|kamu|ya)\b/i.test(text)) return "id-ID";
  return "en";
}

export function speak(text: string) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = guessLanguage(text);
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}
