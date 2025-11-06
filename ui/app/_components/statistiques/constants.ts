export const COLORS = {
  PRIMARY: "#000091",
  GREY: "var(--text-default-grey)",
  SUCCESS: "var(--text-default-success)",
  ERROR: "var(--text-default-error)",
  ML_INACTIVE: "#E3E3FD",
  ML_ACTIVE: "#6A6AF4",
} as const;

export function calculatePercentage(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";
  const percentage = ((current - previous) / previous) * 100;
  if (percentage === 0) return "0%";
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${Math.round(percentage)}%`;
}

export function getPercentageColor(current: number, previous: number): string {
  if (current === previous) return COLORS.GREY;
  return current > previous ? COLORS.SUCCESS : COLORS.ERROR;
}
