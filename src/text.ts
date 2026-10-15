// Emojis aus einem Text entfernen (z. B. aus Texten vom Server oder Mitteilungen) – die App nutzt eigene Symbole.
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2728}\u{FE0F}\u{200D}]/gu;

export function stripEmoji(text: string): string {
  return text.replace(EMOJI, '').replace(/\s{2,}/g, ' ').trim();
}
