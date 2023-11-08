import { TypeEffectifNominatif } from "./indicateurs";

// Permissions Profils d'organisation vs Fonctionnalités de l'organisation (= 1er niveau d'onglet)
export type PermissionOrganisation =
  | "IndicateursEffectifsParDepartement" // /api/v1/indicateurs/effectifs/par-departement
  | "IndicateursOrganismesParDepartement" // /api/v1/indicateurs/organismes/par-departement
  | "ListeOrganismes" // /api/v1/organisation/organismes
  | "IndicateursEffectifsParOrganisme" // /api/v1/indicateurs/effectifs/par-organisme
  | "TéléchargementListesNominatives"; // /api/v1/indicateurs/effectifs/{type}

// Permissions Profils d'organisation vs Fonctionnalités pour visualiser les données d'un OFA cible (= 2e niveau d'onglet)
export type PermissionsOrganisme = {
  viewContacts: boolean;
  infoTransmissionEffectifs: boolean;
  indicateursEffectifs: boolean; // pourrait peut-être être false | "partial" (restriction réseau/territoire) | "full"
  effectifsNominatifs: boolean | TypeEffectifNominatif[];
  manageEffectifs: boolean;
};

export type PermissionOrganisme = keyof PermissionsOrganisme;
