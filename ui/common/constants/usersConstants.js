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

export const USER_STATUS_LABELS = {
  PENDING_EMAIL_VALIDATION: "en attente de validation utilisateur",
  PENDING_PASSWORD_SETUP: "création mdp en cours",
  PENDING_PERMISSIONS_SETUP: "à valider administrateur",
  PENDING_ADMIN_VALIDATION: "accès ouvert - en attente de 1ère utilisation",
  DIRECT_PENDING_PASSWORD_SETUP: "direct - mdp à définir",
  CONFIRMED: "accès confirmé",
};
