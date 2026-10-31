// Formatted by hand rather than with Intl ranges, whose spacing varies by ICU
// version and would differ between server and browser renders.
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

type DateParts = { year: number; month: string; day: number; time: number };

function parseIsoDate(value: string | null | undefined): DateParts | null {
  const match = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const time = Date.UTC(year, month - 1, day);
  const check = new Date(time);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;
  return { year, month: MONTHS[month - 1]!, day, time };
}

/**
 * Formats an ISO date range compactly, e.g. "Mar 3 – 6, 2026".
 * Returns null when neither date is set.
 */
export function formatTripDates(
  startDate?: string | null,
  endDate?: string | null,
): string | null {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (start && end && end.time > start.time) {
    if (start.year !== end.year) {
      return `${start.month} ${start.day}, ${start.year} – ${end.month} ${end.day}, ${end.year}`;
    }
    if (start.month !== end.month) {
      return `${start.month} ${start.day} – ${end.month} ${end.day}, ${end.year}`;
    }
    return `${start.month} ${start.day} – ${end.day}, ${end.year}`;
  }
  const single = start ?? end;
  return single ? `${single.month} ${single.day}, ${single.year}` : null;
}

export function formatPlaceCount(count: number): string {
  return count === 1 ? "1 place" : `${count} places`;
}
