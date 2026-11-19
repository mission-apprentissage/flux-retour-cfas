export type Ventilation = Record<string, Record<string, number>>;

export const ventiler = (
  ventilation: Ventilation,
  anneeScolaire: string | null | undefined,
  source: string | null | undefined
) => {
  const annee = anneeScolaire || "inconnue";
  const origine = source || "inconnue";
  ventilation[annee] ??= {};
  ventilation[annee][origine] = (ventilation[annee][origine] ?? 0) + 1;
};
