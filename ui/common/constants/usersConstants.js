/**
 * Noms des types d'organismes d'appartenance des utilisateurs possibles
 */
const ORGANISMES_APPARTENANCE = {
  TETE_DE_RESEAU: "tête de réseau",
  ACADEMIE: "académie",
  DRAAF: "DRAAF",
  CARIF_OREF: "CARIF OREF",
  DREETS: "DREETS",
  DEETS: "DEETS",
  DDETS: "DDETS",
  CONSEIL_REGIONAL: "conseil régional",
  OPCO: "OPCO",
  ERP: "ERP",
  AUTRE: "autre",
  POLE_EMPLOI: "pôle emploi",
  MISSION_LOCALE: "mission locale",
  CELLULE_APPRENTISSAGE: "cellule apprentissage",
  ORGANISME_FORMATION: "OF",
};

export function getUserOrganisationLabel(user) {
  const labels = {
    ...ORGANISMES_APPARTENANCE,
    TETE_DE_RESEAU: `réseau ${user?.reseau}`,
    ERP: user?.erp,
  };
  return labels[user?.organisation] || user?.organisation;
}
