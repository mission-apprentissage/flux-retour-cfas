export function calculateVariation(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "+100%";

  const percentage = ((current - previous) / previous) * 100;
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${Math.round(percentage)}%`;
}

export function calculatePercentage(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (current === 0 && previous > 0) return "-100%";
  if (current === 0) return "0%";
  const percentage = ((current - previous) / current) * 100;
  if (percentage === 0) return "0%";
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${Math.round(percentage)}%`;
}
