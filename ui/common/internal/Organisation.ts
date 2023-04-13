// types en doublon avec le serveur
export const organisationTypes = [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_RESPONSABLE",
  "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
  "TETE_DE_RESEAU",
  "DREETS",
  "DRAAF",
  "CONSEIL_REGIONAL",
  "DDETS",
  "ACADEMIE",
  "OPERATEUR_PUBLIC_NATIONAL",
  "ADMINISTRATEUR",
  "AUTRE", // UI uniquement
] as const;

export type Organisation = { _id: string } & (
  | OrganisationOrganismeFormation
  | OrganisationTeteReseau
  | OrganisationOperateurPublicRegion
  | OrganisationOperateurPublicDepartement
  | OrganisationOperateurPublicAcademie
  | OrganisationOperateurPublicNational
  | OrganisationAdministrateur
  | OrganisationAutre
);

export type OrganisationType = (typeof organisationTypes)[number];

interface AbstractOrganisation {
  type: OrganisationType;
  created_at: Date;
}

// OFRF, OFR, OFF
export interface OrganisationOrganismeFormation extends AbstractOrganisation {
  type:
    | "ORGANISME_FORMATION_FORMATEUR"
    | "ORGANISME_FORMATION_RESPONSABLE"
    | "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR";
  siret: string;
  uai: string;
}

export interface OrganisationTeteReseau extends AbstractOrganisation {
  type: "TETE_DE_RESEAU";
  reseau: string;
}

export interface OrganisationOperateurPublicNational extends AbstractOrganisation {
  type: "OPERATEUR_PUBLIC_NATIONAL";
  nom: string;
}

export interface OrganisationOperateurPublicRegion extends AbstractOrganisation {
  type: "DREETS" | "DRAAF" | "CONSEIL_REGIONAL";
  code_region: string;
}

export interface OrganisationOperateurPublicDepartement extends AbstractOrganisation {
  type: "DDETS";
  code_departement: string;
}

export interface OrganisationOperateurPublicAcademie extends AbstractOrganisation {
  type: "ACADEMIE";
  code_academie: string;
}

export interface OrganisationAdministrateur extends AbstractOrganisation {
  type: "ADMINISTRATEUR";
}

export interface OrganisationAutre extends AbstractOrganisation {
  type: "AUTRE";
  nom: string;
}
