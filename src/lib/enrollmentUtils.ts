import { differenceInDays } from "date-fns";

/**
 * Suggest the number of sessions allowed for an enrollment.
 *
 * @param enrollmentDate  - First day of the enrollment period
 * @param expiryDate      - Last day of the enrollment period
 * @param weeklyFrequency - How many sessions the group holds per week (e.g. 2)
 * @returns Suggested session count, or null if any input is missing/invalid
 */
export function suggestSessionsAllowed(
  enrollmentDate: Date | undefined,
  expiryDate: Date | undefined,
  weeklyFrequency: number | null | undefined,
): number | null {
  if (!enrollmentDate || !expiryDate || !weeklyFrequency || weeklyFrequency < 1) {
    return null;
  }

  const days = differenceInDays(expiryDate, enrollmentDate);
  if (days <= 0) return null;

  const weeks = days / 7;
  return Math.max(1, Math.round(weeks * weeklyFrequency));
}
