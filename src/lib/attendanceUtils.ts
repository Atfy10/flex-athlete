/**
 * Returns Tailwind semantic color tokens for a given attendance rate.
 *  < 60% → destructive (red)
 * 60–80% → warning    (amber)
 *  > 80% → success    (green)
 */
export function getAttendanceColor(rate: number): {
  text: string;
  bar: string;
  badge: string;
} {
  if (rate < 60) {
    return {
      text: "text-destructive",
      bar: "bg-destructive",
      badge: "bg-destructive/10 text-destructive border-destructive/20",
    };
  }
  if (rate <= 80) {
    return {
      text: "text-warning",
      bar: "bg-warning",
      badge: "bg-warning/10 text-warning border-warning/20",
    };
  }
  return {
    text: "text-success",
    bar: "bg-success",
    badge: "bg-success/10 text-success border-success/20",
  };
}
