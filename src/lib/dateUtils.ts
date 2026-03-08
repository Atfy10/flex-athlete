import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isTomorrow,
  differenceInCalendarDays,
  parseISO,
  isValid,
} from "date-fns";

/**
 * Safely parse a date string or Date into a valid Date object.
 * Returns null if invalid.
 */
function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return isValid(value) ? value : null;
  const d = parseISO(value);
  return isValid(d) ? d : new Date(value);
}

/**
 * Returns a human-readable relative label for a date.
 *
 * Rules:
 *  - "Today"
 *  - "Yesterday"
 *  - "Tomorrow"
 *  - "X days ago" / "In X days"   (within ±6 days)
 *  - "Last Tuesday" / "Next Tuesday" (within ±13 days)
 *  - Falls back to formatted absolute date (e.g. "Jan 10, 2024")
 */
export function formatRelativeDate(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";

  if (isToday(date))     return "Today";
  if (isYesterday(date)) return "Yesterday";
  if (isTomorrow(date))  return "Tomorrow";

  const diff = differenceInCalendarDays(date, new Date());

  if (diff > 0 && diff <= 6)  return `In ${diff} day${diff === 1 ? "" : "s"}`;
  if (diff < 0 && diff >= -6) return `${Math.abs(diff)} day${diff === -1 ? "" : "s"} ago`;

  if (diff > 0 && diff <= 13) return `Next ${format(date, "EEEE")}`;
  if (diff < 0 && diff >= -13) return `Last ${format(date, "EEEE")}`;

  return format(date, "MMM d, yyyy");
}

/**
 * Returns a relative label for a datetime (includes time distance).
 *
 * Rules:
 *  - Within 24 h: "X minutes ago", "2 hours ago", etc. (date-fns)
 *  - Same calendar day (>24 h edge): "Today at HH:mm"
 *  - Yesterday: "Yesterday at HH:mm"
 *  - Within ±6 days: "Monday at HH:mm"
 *  - Older: "Jan 10 · HH:mm" or "Jan 10, 2024 · HH:mm" (different year)
 */
export function formatRelativeDateTime(value: string | Date): string {
  const date = toDate(value);
  if (!date) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60_000);

  // ── Within the last hour ──────────────────────────────────────────────────
  if (diffMins < 1)   return "Just now";
  if (diffMins < 60)  return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;

  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  // ── Calendar-day based labels ─────────────────────────────────────────────
  const timeStr = format(date, "HH:mm");

  if (isToday(date))     return `Today at ${timeStr}`;
  if (isYesterday(date)) return `Yesterday at ${timeStr}`;

  const diff = differenceInCalendarDays(date, now);
  if (diff >= -6 && diff < 0) return `${format(date, "EEEE")} at ${timeStr}`;

  // ── Absolute fallback ─────────────────────────────────────────────────────
  const sameYear = date.getFullYear() === now.getFullYear();
  const datePart = sameYear
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");

  return `${datePart} · ${timeStr}`;
}

/**
 * Returns both a relative label AND an absolute date string.
 * Useful for "3 days ago" tooltip / title attributes.
 *
 * For dates older than 14 days the relative portion is omitted since
 * the absolute date is already self-explanatory.
 */
export function formatSmartDate(value: string | Date): {
  label: string;
  absolute: string;
  title: string;
} {
  const date = toDate(value);
  if (!date) return { label: "", absolute: "", title: "" };

  const now = new Date();
  const sameYear = date.getFullYear() === now.getFullYear();
  const absolute = sameYear
    ? format(date, "MMM d")
    : format(date, "MMM d, yyyy");

  const diff = Math.abs(differenceInCalendarDays(date, now));
  const relative = formatRelativeDate(value);

  // For old/far-out dates, show absolute with relative in parens
  if (diff > 14) {
    const distance = formatDistanceToNow(date, { addSuffix: true });
    return {
      label: `${absolute} (${distance})`,
      absolute,
      title: format(date, "PPPp"),
    };
  }

  return {
    label: relative,
    absolute,
    title: format(date, "PPPp"),
  };
}
