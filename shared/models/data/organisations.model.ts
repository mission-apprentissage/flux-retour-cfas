import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import type { Jsonify } from "type-fest";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import {
  ACADEMIES_BY_CODE,
  DEPARTEMENTS_BY_CODE,
  getAcademieByCode,
  IDepartmentCode,
  IRegionCode,
  ORGANISATIONS_NATIONALES,
  REGIONS_BY_CODE,
  SIRET_REGEX,
  TETE_DE_RESEAUX_BY_ID,
  UAI_REGEX,
} from "../../constants";
import { zodEnumFromArray, zodEnumFromObjKeys } from "../../utils/zodHelper";

const collectionName = "organisations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const zOrganisationBase = z.object({
  _id: zObjectId,
  created_at: z.date({ description: "Date de création en base de données" }),
});

const zOrganisationOrganismeCreate = z.object({
  type: z.literal("ORGANISME_FORMATION"),
  siret: z.string({ description: "N° SIRET" }).regex(SIRET_REGEX),
  uai: z
    .string({
      description: "Code UAI de l'organisme (seulement pour les utilisateurs OF)",
    })
    .regex(UAI_REGEX)
    .nullable(),
  organisme_id: z.string({ description: "Identifiant de l'organisme" }).optional(),
});

const zOrganisationReaseauCreate = z.object({
  type: z.literal("TETE_DE_RESEAU"),
  reseau: zodEnumFromObjKeys(TETE_DE_RESEAUX_BY_ID).describe("Réseau du CFA, s'il existe"),
});

const zOrganisationRegionalCreate = z.object({
  type: z.enum(["DREETS", "DRAAF", "CONSEIL_REGIONAL", "CARIF_OREF_REGIONAL", "DRAFPIC"]),
  code_region: zodEnumFromObjKeys(REGIONS_BY_CODE).describe("Code région"),
});

const zOrganisationDepartementalCreate = z.object({
  type: z.literal("DDETS"),
  code_departement: zodEnumFromObjKeys(DEPARTEMENTS_BY_CODE).openapi({
    examples: ["01", "59"],
    description: "Code département",
  }),
});

const zOrganisationAcademieCreate = z.object({
  type: z.literal("ACADEMIE"),
  code_academie: zodEnumFromObjKeys(ACADEMIES_BY_CODE).describe("Code académie"),
});

const zOrganisationNationalCreate = z.object({
  type: z.literal("OPERATEUR_PUBLIC_NATIONAL"),
  nom: zodEnumFromArray(ORGANISATIONS_NATIONALES.map(({ key }) => key)).describe("Nom de l'organisation nationale"),
});

// TODO: à supprimer pour merger avec zOrganisationNational?
const zOrganisationCarifOrefCreate = z.object({
  type: z.literal("CARIF_OREF_NATIONAL"),
});

const zOrganisationAdminCreate = z.object({
  type: z.literal("ADMINISTRATEUR"),
});

const zOrganisationOrganisme = zOrganisationBase.merge(zOrganisationOrganismeCreate);
const zOrganisationReaseau = zOrganisationBase.merge(zOrganisationReaseauCreate);
const zOrganisationRegional = zOrganisationBase.merge(zOrganisationRegionalCreate);
const zOrganisationDepartemental = zOrganisationBase.merge(zOrganisationDepartementalCreate);
const zOrganisationAcademie = zOrganisationBase.merge(zOrganisationAcademieCreate);
const zOrganisationNational = zOrganisationBase.merge(zOrganisationNationalCreate);
const zOrganisationCarifOref = zOrganisationBase.merge(zOrganisationCarifOrefCreate);
const zOrganisationAdmin = zOrganisationBase.merge(zOrganisationAdminCreate);

const zOrganisation = z.discriminatedUnion("type", [
  zOrganisationOrganisme,
  zOrganisationReaseau,
  zOrganisationRegional,
  zOrganisationDepartemental,
  zOrganisationAcademie,
  zOrganisationNational,
  zOrganisationCarifOref,
  zOrganisationAdmin,
]);

export const zOrganisationCreate = z.discriminatedUnion("type", [
  zOrganisationOrganismeCreate,
  zOrganisationReaseauCreate,
  zOrganisationRegionalCreate,
  zOrganisationDepartementalCreate,
  zOrganisationAcademieCreate,
  zOrganisationNationalCreate,
  zOrganisationCarifOrefCreate,
  zOrganisationAdminCreate,
]);

export type IOrganisationOrganismeFormation = z.output<typeof zOrganisationOrganisme>;

export type IOrganisationOperateurPublicNational = z.output<typeof zOrganisationNational>;

export type IOrganisationOperateurPublicRegion = z.output<typeof zOrganisationRegional>;

export type IOrganisationOperateurPublicAcademie = z.output<typeof zOrganisationAcademie>;

export type IOrganisation = z.output<typeof zOrganisation>;
export type IOrganisationJson = Jsonify<IOrganisation>;

export type IOrganisationCreate = z.output<typeof zOrganisationCreate>;

export type IOrganisationType = IOrganisation["type"];

export const TYPES_ORGANISATION = [
  { key: "ACADEMIE", nom: "Académie" },
  { key: "ADMINISTRATEUR", nom: "Administrateur" },
  { key: "CARIF_OREF_NATIONAL", nom: "Carif-Oref national" },
  { key: "CARIF_OREF_REGIONAL", nom: "Carif-Oref régional" },
  { key: "DRAFPIC", nom: "DRAFPIC régional" },
  { key: "CONSEIL_REGIONAL", nom: "Conseil régional" },
  { key: "DDETS", nom: "DDETS" },
  { key: "DRAAF", nom: "DRAAF" },
  { key: "DREETS", nom: "DREETS" },
  { key: "OPERATEUR_PUBLIC_NATIONAL", nom: "Opérateur public national" },
  { key: "ORGANISME_FORMATION", nom: "Organisme de formation" },
  { key: "TETE_DE_RESEAU", nom: "Tête de réseau" },
] as const satisfies Array<{ key: IOrganisationType; nom: string }>;

export function getOrganisationLabel(organisation: IOrganisationCreate): string {
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
      return `Académie ${getAcademieByCode(organisation.code_academie)?.nom ?? organisation.code_academie}`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;
    case "CARIF_OREF_NATIONAL":
      return "CARIF OREF national";
    case "ADMINISTRATEUR":
      return "Administrateur";
  }
}

function isPublicOrganisation(organisation: IOrganisationCreate): boolean {
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

export function getWarningOnEmail(email: string, organisation: IOrganisationCreate & { domains: [string] }) {
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

export default { zod: zOrganisation, indexes, collectionName };
