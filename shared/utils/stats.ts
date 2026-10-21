/** Évolution de `current` par rapport à `previous`, en pourcentage de `previous` (vide si `previous` est nul). */
export function calculatePercentage(current: number, previous: number): string {
  if (previous === 0 && current === 0) return "0%";
  if (previous === 0) return "";
  const percentage = ((current - previous) / previous) * 100;
  if (Math.round(percentage) === 0) return "0%";
  const sign = percentage > 0 ? "+" : "";
  return `${sign}${Math.round(percentage)}%`;
}
