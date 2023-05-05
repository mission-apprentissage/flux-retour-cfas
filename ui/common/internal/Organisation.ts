import { TETE_DE_RESEAUX_BY_ID } from "../constants/networksConstants";
import { ACADEMIES_BY_ID, DEPARTEMENTS_BY_ID, REGIONS_BY_ID } from "../constants/territoiresConstants";

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

const OFTypeLabelByType = {
  ORGANISME_FORMATION_FORMATEUR: "OF",
  ORGANISME_FORMATION_RESPONSABLE: "OFR",
  ORGANISME_FORMATION_RESPONSABLE_FORMATEUR: "OFRF",
};
export function getOrganisationLabel(organisation: Organisation): string {
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      return `${OFTypeLabelByType[organisation.type]} UAI : ${organisation.uai || "Inconnu"} - SIRET : ${
        organisation.siret
      }`;
    }

    case "TETE_DE_RESEAU":
      return `Réseau ${TETE_DE_RESEAUX_BY_ID[organisation.reseau]?.nom}`;

    case "DREETS":
    case "DRAAF":
      return `${organisation.type} ${REGIONS_BY_ID[organisation.code_region]?.nom || organisation.code_region}`;
    case "CONSEIL_REGIONAL":
      return `Conseil régional ${REGIONS_BY_ID[organisation.code_region]?.nom || organisation.code_region}`;
    case "DDETS":
      return `DDETS ${DEPARTEMENTS_BY_ID[organisation.code_departement]?.nom || organisation.code_departement}`;
    case "ACADEMIE":
      return `Académie ${ACADEMIES_BY_ID[organisation.code_academie]?.nom || organisation.code_academie}`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;
    case "ADMINISTRATEUR":
      return "Administrateur";
  }
  return ""; // cas autre
}
