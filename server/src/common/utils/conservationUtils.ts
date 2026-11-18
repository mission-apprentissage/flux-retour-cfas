import { subYears } from "date-fns";
import { estAnneeScolaireActive, getFinAnneeScolaire } from "shared/utils/anneeScolaire";

export const DUREE_CONSERVATION_EN_ANNEES = 2;

type DateDeFin = Date | null | undefined;

export type DossierConservation = {
  annee_scolaire: string;
  datesDeFin: DateDeFin[];
};

export const getDateLimiteConservation = (maintenant: Date): Date => subYears(maintenant, DUREE_CONSERVATION_EN_ANNEES);

export const getDateDeFinConservation = ({ annee_scolaire, datesDeFin }: DossierConservation): Date | null => {
  const dates = datesDeFin.filter((date): date is Date => date instanceof Date && !Number.isNaN(date.getTime()));
  if (dates.length > 0) {
    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }
  return getFinAnneeScolaire(annee_scolaire);
};

export const estHorsConservation = (dossier: DossierConservation, maintenant: Date = new Date()): boolean => {
  if (estAnneeScolaireActive(dossier.annee_scolaire, maintenant)) {
    return false;
  }
  const fin = getDateDeFinConservation(dossier);
  return fin !== null && fin.getTime() < getDateLimiteConservation(maintenant).getTime();
};

type EffectifDates = {
  formation?: { date_fin?: DateDeFin } | null;
  contrats?: Array<{ date_fin?: DateDeFin; date_rupture?: DateDeFin }> | null;
};

export const getDatesDeFinEffectif = (effectif: EffectifDates): DateDeFin[] => [
  effectif.formation?.date_fin,
  ...(effectif.contrats ?? []).flatMap((contrat) => [contrat.date_fin, contrat.date_rupture]),
];

export const getDatesDeFinEffectifDeca = (effectif: Pick<EffectifDates, "contrats">): DateDeFin[] =>
  (effectif.contrats ?? []).map((contrat) => contrat.date_fin);
