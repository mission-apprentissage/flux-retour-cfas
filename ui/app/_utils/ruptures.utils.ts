import { format } from "date-fns/format";
import { fr } from "date-fns/locale";
import { API_EFFECTIF_LISTE, IMissionLocaleEffectifList } from "shared";
import { ML_DELAI_RELANCE_JOURS } from "shared/constants";

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

/**
 * Suffixe de tri reconstruit depuis l'URL de la fiche, pour que le précédent/suivant et le
 * retour à la liste conservent l'ordre affiché.
 */
export const triQueryDepuisUrl = (tri?: string | null, ordre?: string | null): string =>
  tri ? `&tri=${tri}&ordre=${ordre === "desc" ? "desc" : "asc"}` : "";

/**
 * Date du sous-texte de statut : « aujourd'hui » le jour même (maquette), « le JJ/MM/AAAA » sinon.
 */
export const formatDateSuivi = (
  date: string | Date | null | undefined,
  { relatif = true, now = new Date() }: { relatif?: boolean; now?: Date } = {}
): string => {
  if (!date) return "";
  const reference = new Date(date);
  if (Number.isNaN(reference.getTime())) return "";
  if (relatif && reference.toDateString() === now.toDateString()) return "aujourd'hui";
  return `le ${reference.toLocaleDateString("fr-FR")}`;
};

/**
 * Indique si un dossier reste sans action au-delà du délai de relance (RG9) : le sous-texte
 * daté du statut passe alors en gras et en orange. Comparaison en jours révolus, comme le
 * nudge de tri côté serveur.
 */
export const isDelaiRelanceDepasse = (date: string | Date | null | undefined, now: Date = new Date()): boolean => {
  if (!date) return false;
  const reference = new Date(date);
  if (Number.isNaN(reference.getTime())) return false;
  const joursEcoules = Math.floor((now.getTime() - reference.getTime()) / (24 * 60 * 60 * 1000));
  return joursEcoules > ML_DELAI_RELANCE_JOURS;
};
