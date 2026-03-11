export function formatIppanTimeUsToHashtimer(ippanTimeUs?: number): string {
  if (!ippanTimeUs || !Number.isFinite(ippanTimeUs)) return "—";

  // Simple, real, time-derived fallback:
  // show the seconds component as hex (matches the "time in hex" intuition),
  // while upstream nodes may later provide a full canonical HashTimer string.
  const seconds = Math.floor(ippanTimeUs / 1_000_000);
  const hex = seconds.toString(16);
  return `0x${hex}`;
}

export function formatIppanTimeUsToIso(ippanTimeUs?: number): string | undefined {
  if (!ippanTimeUs || !Number.isFinite(ippanTimeUs)) return undefined;
  const ms = Math.floor(ippanTimeUs / 1000);
  try {
    return new Date(ms).toISOString();
  } catch {
    return undefined;
  }
}

