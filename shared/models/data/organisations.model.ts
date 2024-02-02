import type { CreateIndexesOptions, IndexSpecification } from "mongodb";

import {
  REGIONS,
  DEPARTEMENTS,
  ACADEMIES,
  ACADEMIES_BY_CODE,
  DEPARTEMENTS_BY_CODE,
  REGIONS_BY_CODE,
  TETE_DE_RESEAUX,
  TETE_DE_RESEAUX_BY_ID,
  ORGANISATIONS_NATIONALES,
  SIRET_REGEX_PATTERN,
  UAI_REGEX_PATTERN,
  date,
  object,
  objectId,
  string,
  stringOrNull,
  IRegionCode,
  IDepartmentCode,
  IAcademieCode,
} from "shared";

// types en doublon avec l'UI
export const organisationTypes = [
  "ORGANISME_FORMATION",
  "TETE_DE_RESEAU",
  "DREETS",
  "DRAAF",
  "CONSEIL_REGIONAL",
  "CARIF_OREF_REGIONAL",
  "DDETS",
  "ACADEMIE",
  "OPERATEUR_PUBLIC_NATIONAL",
  "CARIF_OREF_NATIONAL",
  "ADMINISTRATEUR",
  "DRAFPIC",
];

export type NewOrganisation =
  | OrganisationOrganismeFormation
  | OrganisationTeteReseau
  | OrganisationOperateurPublicRegion
  | OrganisationOperateurPublicDepartement
  | OrganisationOperateurPublicAcademie
  | OrganisationOperateurPublicNational
  | OrganisationCarifOrefNational
  | OrganisationAdministrateur;

export type Organisation = NewOrganisation & { created_at: Date };

export type OrganisationType = (typeof organisationTypes)[number];

export interface OrganisationOrganismeFormation {
  type: "ORGANISME_FORMATION";
  siret: string;
  uai: string | null;
}

export interface OrganisationTeteReseau {
  type: "TETE_DE_RESEAU";
  reseau: (typeof TETE_DE_RESEAUX)[number]["key"];
}

export interface OrganisationOperateurPublicNational {
  type: "OPERATEUR_PUBLIC_NATIONAL";
  nom: (typeof ORGANISATIONS_NATIONALES)[number]["key"];
}

export interface OrganisationCarifOrefNational {
  type: "CARIF_OREF_NATIONAL";
}

export interface OrganisationOperateurPublicRegion {
  type: "DREETS" | "DRAAF" | "CONSEIL_REGIONAL" | "CARIF_OREF_REGIONAL" | "DRAFPIC";
  code_region: string;
}

export interface OrganisationOperateurPublicDepartement {
  type: "DDETS";
  code_departement: string;
}

export interface OrganisationOperateurPublicAcademie {
  type: "ACADEMIE";
  code_academie: string;
}

export interface OrganisationAdministrateur {
  type: "ADMINISTRATEUR";
}

// types structurés pour faciliter les permissions
export type OrganisationByType = {
  ORGANISME_FORMATION: OrganisationOrganismeFormation;
  TETE_DE_RESEAU: OrganisationTeteReseau;
  DREETS: OrganisationOperateurPublicRegion;
  DRAAF: OrganisationOperateurPublicRegion;
  CONSEIL_REGIONAL: OrganisationOperateurPublicRegion;
  CARIF_OREF_REGIONAL: OrganisationOperateurPublicRegion;
  DRAFPIC: OrganisationOperateurPublicRegion;
  DDETS: OrganisationOperateurPublicDepartement;
  ACADEMIE: OrganisationOperateurPublicAcademie;
  ADMINISTRATEUR: OrganisationAdministrateur;
  OPERATEUR_PUBLIC_NATIONAL: OrganisationOperateurPublicNational;
  CARIF_OREF_NATIONAL: OrganisationCarifOrefNational;
};

export function getOrganisationLabel(organisation: NewOrganisation): string {
  switch (organisation.type) {
    case "ORGANISME_FORMATION": {
      return `OFA UAI : ${organisation.uai || "Inconnu"} - SIRET : ${organisation.siret}`;
    }

    case "TETE_DE_RESEAU":
      return `Réseau ${TETE_DE_RESEAUX_BY_ID[organisation.reseau]?.nom}`;

    case "DREETS":
    case "DRAAF":
      return `${organisation.type} ${
        REGIONS_BY_CODE[organisation.code_region as IRegionCode]?.nom || organisation.code_region
      }`;
    case "CONSEIL_REGIONAL":
      return `Conseil régional ${
        REGIONS_BY_CODE[organisation.code_region as IRegionCode]?.nom || organisation.code_region
      }`;
    case "CARIF_OREF_REGIONAL":
      return `CARIF OREF ${REGIONS_BY_CODE[organisation.code_region as IRegionCode]?.nom || organisation.code_region}`;
    case "DRAFPIC":
      return `DRAFPIC ${REGIONS_BY_CODE[organisation.code_region as IRegionCode]?.nom || organisation.code_region}`;
    case "DDETS":
      return `DDETS ${
        DEPARTEMENTS_BY_CODE[organisation.code_departement as IDepartmentCode]?.nom || organisation.code_departement
      }`;
    case "ACADEMIE":
      return `Académie ${
        ACADEMIES_BY_CODE[organisation.code_academie as IAcademieCode]?.nom || organisation.code_academie
      }`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;
    case "CARIF_OREF_NATIONAL":
      return "CARIF OREF national";
    case "ADMINISTRATEUR":
      return "Administrateur";
  }
}

function isPublicOrganisation(organisation: NewOrganisation): boolean {
  return [
    "DREETS",
    "DRAAF",
    "CONSEIL_REGIONAL",
    "CARIF_OREF_REGIONAL",
    "DDETS",
    "ACADEMIE",
    "OPERATEUR_PUBLIC_NATIONAL",
    "CARIF_OREF_NATIONAL",
    "ADMINISTRATEUR",
    "DRAFPIC",
  ].includes(organisation.type);
}

export function getWarningOnEmail(email: string, organisation: Organisation & { domains: [string] }) {
  let warning;
  if (!isPublicOrganisation(organisation)) {
    return;
  }
  if (
    [
      "DREETS",
      "DRAAF",
      "CONSEIL_REGIONAL",
      "CARIF_OREF_REGIONAL",
      "DDETS",
      "ACADEMIE",
      "OPERATEUR_PUBLIC_NATIONAL",
      "CARIF_OREF_NATIONAL",
    ].includes(organisation.type) &&
    !email.endsWith(".gouv.fr")
  ) {
    warning = "Cet email n'appartient pas à un compte public finissant par .gouv.fr.";
  } else if ("ACADEMIE" === organisation.type && !/ac-\.fr/.test(email)) {
    warning = "Cet email n'appartient pas à une académie.";
  } else if (organisation.domains && !organisation.domains.some((domain) => email.endsWith(domain))) {
    warning = "Cet email n'a pas le même nom de domaine que les emails déclarés sur cet organisme.";
  }

  return warning;
}

const collectionName = "organisations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const schema = object(
  {
    _id: objectId(),

    type: string({
      description: "Type d'organisation (exemple DREETS, ACADEMIE, etc)",
      enum: organisationTypes,
    }),

    // si OFRF, OFR, OFF
    siret: string({ description: "N° SIRET", pattern: SIRET_REGEX_PATTERN, maxLength: 14, minLength: 14 }),
    uai: stringOrNull({
      description: "Code UAI de l'organisme (seulement pour les utilisateurs OF)",
      pattern: UAI_REGEX_PATTERN,
      maxLength: 8,
      minLength: 8,
    }),

    // si tête de réseau
    reseau: string({ enum: TETE_DE_RESEAUX.map((r) => r.key), description: "Nom du réseau" }),

    // si DREETS, DRAAF, CONSEIL_REGIONAL, CARIF_OREF_REGIONAL, DRAFPIC
    code_region: string({
      enum: REGIONS.map(({ code }) => code),
      description: "Code région",
    }),

    // si DDETS
    code_departement: string({
      example: "1 Ain, 99 Étranger",
      pattern: "^([0-9][0-9]|2[AB]|9[012345]|97[1234678]|98[46789])$",
      enum: DEPARTEMENTS.map(({ code }) => code),
      maxLength: 3,
      minLength: 1,
      description: "Code département",
    }),

    // si académie
    code_academie: string({
      enum: ACADEMIES.map(({ code }) => code),
      description: "Code académie",
    }),

    // si opérateur public national
    nom: string({
      enum: ORGANISATIONS_NATIONALES.map(({ key }) => key),
      description: "Nom de l'organisation nationale",
    }),

    created_at: date({ description: "Date de création en base de données" }),
  },
  { required: ["type"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
