const WORDS_PER_MINUTE = 220;

export function readingTimeFromText(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}
