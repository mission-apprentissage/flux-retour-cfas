import { TypeEffectifNominatif } from "./indicateurs";
import { ITeteDeReseauKey } from "./networks";

// Permissions Profils d'organisation vs Fonctionnalités pour visualiser les données d'un OFA cible (= 2e niveau d'onglet)
export type PermissionsOrganisme = {
  viewContacts: boolean;
  infoTransmissionEffectifs: boolean;
  indicateursEffectifs: boolean; // pourrait peut-être être false | "partial" (restriction réseau/territoire) | "full"
  effectifsNominatifs: boolean | TypeEffectifNominatif[];
  manageEffectifs: boolean;
  configurerModeTransmission: boolean;
};

export type PermissionOrganisme = keyof PermissionsOrganisme;

export type PermissionScope = {
  id?: { $in: ReadonlyArray<string> };
  reseau?: { $in: ReadonlyArray<ITeteDeReseauKey> };
  region?: { $in: ReadonlyArray<string> };
  departement?: { $in: ReadonlyArray<string> };
  academie?: { $in: ReadonlyArray<string> };
};

export type Acl = {
  viewContacts: PermissionScope | boolean;
  infoTransmissionEffectifs: PermissionScope | boolean;
  indicateursEffectifs: PermissionScope | true;
  effectifsNominatifs: { [key in TypeEffectifNominatif]: PermissionScope | boolean };
  manageEffectifs: PermissionScope | boolean;
  configurerModeTransmission: PermissionScope | boolean;
};
