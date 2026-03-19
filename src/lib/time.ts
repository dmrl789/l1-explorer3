export function normalizeIntegerMicros(raw: unknown): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? Math.trunc(raw) : undefined;
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) return undefined;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function microsToDate(raw: unknown): Date | undefined {
  const micros = normalizeIntegerMicros(raw);
  if (micros === undefined) return undefined;
  return new Date(Math.trunc(micros / 1000));
}
