export const formatTraitementDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Aujourd'hui";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Hier";
  } else {
    return date.toLocaleDateString("fr-FR");
  }
};

export const formatMoisLabel = (mois: string): string => {
  const [year, month] = mois.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("fr-FR", { year: "numeric", month: "long" });
};

export const formatMoisLabelTraite = (mois: string): string => {
  const [year, month] = mois.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  const monthName = date.toLocaleDateString("fr-FR", { month: "long" });
  const yearNum = date.toLocaleDateString("fr-FR", { year: "numeric" });
  return `Traité en ${monthName} ${yearNum}`;
};
