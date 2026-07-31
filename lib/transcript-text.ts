export function mergeTranscript(existing: string, transcript: string) {
  const next = transcript.trim();
  if (!next) return existing;

  const current = existing.trim();
  if (!current) return next;

  return `${current}\n\n${next}`;
}
