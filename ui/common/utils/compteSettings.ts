import type { IOrganisationJson } from "shared";

import { isCfaWithMlBeta } from "./cfaUtils";

/**
 * Liens vers les onglets du hub unifié /compte.
 * On utilise un query param (et non un hash #) afin que l'onglet soit lisible côté serveur
 * (useSearchParams) : le bon onglet est rendu dès le SSR, sans flash « Mon compte » au chargement.
 */
export const COMPTE_ACCOUNT_HREF = "/compte";
export const COMPTE_SETTINGS_HREF = "/compte?onglet=parametres";
/** Nom du query param d'onglet et valeur pour l'onglet Paramètres. */
export const COMPTE_TAB_PARAM = "onglet";
export const COMPTE_SETTINGS_TAB = "parametres";

export type CompteSettingsTab = {
  /** Quel panneau de paramètres afficher dans le hub /compte. */
  kind: "mission-locale" | "cfa-erp";
  /** Libellé court (menu latéral du hub, colonne étroite). */
  shortLabel: string;
  /** Libellé long (entrée du menu utilisateur du header). */
  label: string;
};

/**
 * Source unique de vérité : l'onglet « Paramètres » géré par le hub /compte selon la typologie.
 * Renvoie `null` pour les typologies sans paramètres dans le hub. Le cas legacy de l'OF non-beta
 * (page Pages Router /parametres) reste géré séparément par le menu du header.
 */
export function getCompteSettingsTab(organisation?: IOrganisationJson | null): CompteSettingsTab | null {
  if (!organisation) return null;
  if (organisation.type === "MISSION_LOCALE") {
    return { kind: "mission-locale", shortLabel: "Paramètres de la ML", label: "Paramètres de la Mission Locale" };
  }
  if (isCfaWithMlBeta(organisation)) {
    return { kind: "cfa-erp", shortLabel: "Paramètres de connexion ERP", label: "Paramètres de connexion ERP" };
  }
  return null;
}
