import { format } from "date-fns/format";
import { fr } from "date-fns/locale";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";

import { EffectifData, MonthItem } from "../../common/types/ruptures";

export const DEFAULT_ITEMS_TO_SHOW = 10;

export const formatMonthAndYear = (dateString: string): string => {
  const date = new Date(dateString);
  const raw = format(date, "MMMM yyyy", { locale: fr });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

export const sortDataByMonthDescending = (data: MonthItem[]): MonthItem[] => {
  return [...data].sort((a, b) => new Date(b.month).getTime() - new Date(a.month).getTime());
};

export const anchorFromLabel = (label: string): string => {
  return label.replace(/\s/g, "-").toLowerCase();
};

export const get180DaysAgo = () => {
  const now = new Date();
  return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
};

export const getPriorityLabel = (listType: IMissionLocaleEffectifList): string => {
  return listType === API_EFFECTIF_LISTE.INJOIGNABLE ? "À RECONTACTER EN PRIORITÉ" : "À TRAITER EN PRIORITÉ";
};

export type PostalCodeOption = { value: string; label: string };

/**
 * Indique si un effectif passe le filtre "Villes". Une sélection vide ne filtre rien (tout affiché).
 * Un effectif sans code postal est exclu dès qu'au moins un code postal est sélectionné.
 */
export const matchesPostalCodes = (effectif: EffectifData, selected: string[]): boolean => {
  if (selected.length === 0) return true;
  return !!effectif.code_postal && selected.includes(effectif.code_postal);
};

/**
 * Élide « de » devant un prénom commençant par une voyelle ou un h muet :
 * « de Enzo » → « d'Enzo ». Les prénoms à h aspiré (Hugo, Hector…) restent en « de ».
 */
export const dePrenom = (prenom: string): string => {
  const premiere = prenom?.trim().charAt(0).toLowerCase();
  return "aeiouyàâäéèêëîïôöùûü".includes(premiere) ? `d'${prenom}` : `de ${prenom}`;
};
