/**
 * Normalize CV free-text dates to Postgres-friendly ISO dates (YYYY-MM-DD).
 * Month/year values use day 01. Unparseable input becomes null.
 */
export function normalizeCvDate(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;

  const raw = value.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // YYYY-MM-DD
  const isoDay = lower.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDay) {
    return toIsoDate(
      Number(isoDay[1]),
      Number(isoDay[2]),
      Number(isoDay[3]),
    );
  }

  // YYYY-MM
  const isoMonth = lower.match(/^(\d{4})-(\d{1,2})$/);
  if (isoMonth) {
    return toIsoDate(Number(isoMonth[1]), Number(isoMonth[2]), 1);
  }

  // MM/YYYY or MM-YYYY
  const slashMonth = lower.match(/^(\d{1,2})[/-](\d{4})$/);
  if (slashMonth) {
    return toIsoDate(Number(slashMonth[2]), Number(slashMonth[1]), 1);
  }

  // Month name + year: "Oct 2025", "October 2025"
  const namedMonth = lower.match(/^([a-z]+)\s+(\d{4})$/);
  if (namedMonth) {
    const month = monthFromName(namedMonth[1]);
    if (month) return toIsoDate(Number(namedMonth[2]), month, 1);
  }

  // Year + month name: "2025 Oct", "2025 October"
  const yearNamedMonth = lower.match(/^(\d{4})\s+([a-z]+)$/);
  if (yearNamedMonth) {
    const month = monthFromName(yearNamedMonth[2]);
    if (month) return toIsoDate(Number(yearNamedMonth[1]), month, 1);
  }

  // Year only: "2025"
  const yearOnly = lower.match(/^(\d{4})$/);
  if (yearOnly) {
    return toIsoDate(Number(yearOnly[1]), 1, 1);
  }

  return null;
}

function monthFromName(name: string): number | null {
  const key = name.toLowerCase().slice(0, 3);
  const months: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12,
  };
  return months[key] ?? null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || year < 1900 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
