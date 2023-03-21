import { date, object, objectId, string } from "./json-schema/jsonSchemaTypes.js";
import { RESEAUX_CFAS } from "../constants/networksConstants.js";
import { REGIONS, DEPARTEMENTS, ACADEMIES } from "../constants/territoiresConstants.js";
import { WithId } from "mongodb";

export const organisationTypes = [
  "ORGANISME_FORMATION_FORMATEUR",
  "ORGANISME_FORMATION_REPONSABLE",
  "ORGANISME_FORMATION_REPONSABLE_FORMATEUR",
  "TETE_DE_RESEAU",
  "DGEFP",
  "DREETS",
  "DEETS",
  "DRAAF",
  "CONSEIL_REGIONAL",
  "DDETS",
  "ACADEMIE",
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

interface AbstractOrganisation {
  type: typeof organisationTypes[number];
  created_at: Date;
}

// OFRF, OFR, OFF
export interface OrganisationOrganismeFormation extends AbstractOrganisation {
  type: "ORGANISME_FORMATION_FORMATEUR" | "ORGANISME_FORMATION_REPONSABLE" | "ORGANISME_FORMATION_REPONSABLE_FORMATEUR";
  siret: string;
  uai: string;
  nature: string;
}

export interface OrganisationTeteReseau extends AbstractOrganisation {
  type: "TETE_DE_RESEAU";
  reseau: string;
}

export interface OrganisationOperateurPublicNational extends AbstractOrganisation {
  type: "DGEFP";
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

const collectionName = "organisations";

// FIXME compléter si besoin d'indexes
const indexes = () => {
  return [];
};

const schema = object(
  {
    _id: objectId(),

    type: string({
      description: "Type d'organisation (exemple DREETS, ACADEMIE, etc)",
      enum: organisationTypes,
    }),

    // si OFRF, OFR, OFF
    siret: string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
    uai: string({
      description: "Code UAI de l'organisme (seulement pour les utilisateurs OF)",
      pattern: "^[0-9]{7}[a-zA-Z]$",
      maxLength: 8,
      minLength: 8,
    }),

    // si tête de réseau
    reseau: string({ enum: Object.keys(RESEAUX_CFAS), description: "Nom du réseau" }),

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

    created_at: date({ description: "Date de création en base de données" }),
  },
  { required: ["type"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
