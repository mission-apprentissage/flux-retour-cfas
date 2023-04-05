import { date, object, objectId, string, stringOrNull } from "./json-schema/jsonSchemaTypes.js";
import { TETE_DE_RESEAUX, TETE_DE_RESEAUX_BY_ID } from "../constants/networksConstants.js";
import {
  REGIONS,
  DEPARTEMENTS,
  ACADEMIES,
  ACADEMIES_BY_ID,
  DEPARTEMENTS_BY_ID,
  REGIONS_BY_ID,
} from "../constants/territoiresConstants.js";
import { CreateIndexesOptions, IndexSpecification, WithId } from "mongodb";
import { ORGANISATIONS_NATIONALES } from "../constants/organisations.js";

// types en doublon avec l'UI
export const organisationTypes = [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_RESPONSABLE",
  "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR",
  "TETE_DE_RESEAU",
  "DREETS",
  "DEETS",
  "DRAAF",
  "CONSEIL_REGIONAL",
  "DDETS",
  "ACADEMIE",
  "OPERATEUR_PUBLIC_NATIONAL",
  "ADMINISTRATEUR",
] as const;

export type Organisation = WithId<
  | OrganisationOrganismeFormation
  | OrganisationTeteReseau
  | OrganisationOperateurPublicRegion
  | OrganisationOperateurPublicDepartement
  | OrganisationOperateurPublicAcademie
  | OrganisationOperateurPublicNational
  | OrganisationAdministrateur
>;

export type OrganisationType = typeof organisationTypes[number];

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
  type: "DREETS" | "DEETS" | "DRAAF" | "CONSEIL_REGIONAL";
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
    case "DEETS":
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
}

function isPublicOrganisation(organisation: Organisation): boolean {
  return [
    "DREETS",
    "DEETS",
    "DRAAF",
    "CONSEIL_REGIONAL",
    "DDETS",
    "ACADEMIE",
    "OPERATEUR_PUBLIC_NATIONAL",
    "ADMINISTRATEUR",
  ].includes(organisation.type);
}

export function getWarningOnEmail(email: string, organisation: Organisation & { domains: [string] }) {
  let warning;
  if (!isPublicOrganisation(organisation)) {
    return;
  }
  if (
    ["DREETS", "DEETS", "DRAAF", "CONSEIL_REGIONAL", "DDETS", "ACADEMIE"].includes(organisation.type) &&
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
    siret: string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
    uai: stringOrNull({
      description: "Code UAI de l'organisme (seulement pour les utilisateurs OF)",
      pattern: "^[0-9]{7}[a-zA-Z]$",
      maxLength: 8,
      minLength: 8,
    }),

    // si tête de réseau
    reseau: string({ enum: TETE_DE_RESEAUX.map((r) => r.key), description: "Nom du réseau" }),

    // si DREETS, DEETS, DRAAF, CONSEIL_REGIONAL
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
      enum: Object.values(ACADEMIES).map(({ code }) => `${code}`),
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
