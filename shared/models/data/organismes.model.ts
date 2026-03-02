import { isBefore, subMonths } from "date-fns";
import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import type { Jsonify } from "type-fest";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import effectifsModel from "shared/models/data/effectifs.model";
import { zAdresse } from "shared/models/parts/adresseSchema";

import {
  NATURE_ORGANISME_DE_FORMATION,
  SIRET_REGEX,
  STATUT_FIABILISATION_ORGANISME,
  STATUT_PRESENCE_REFERENTIEL,
  UAI_REGEX,
} from "../../constants";
import { zodEnumFromObjValues } from "../../utils/zodHelper";

export const UAI_INCONNUE = "non déterminée";
export const UAI_INCONNUE_TAG_FORMAT = UAI_INCONNUE.toUpperCase();
export const UAI_INCONNUE_CAPITALIZE = `${UAI_INCONNUE.charAt(0).toUpperCase()}${UAI_INCONNUE.slice(1)}`;

const relationOrganismeSchema = z.object({
  siret: z.string(),
  uai: z.string().nullable().optional(),

  // infos TDB
  _id: zObjectId.nullable().optional(),
  enseigne: z.string().nullish(),
  raison_sociale: z.string().optional(),
  commune: z.string().optional(),
  region: z.string().optional(),
  departement: z.string().optional(),
  academie: z.string().optional(),
  reseaux: z.array(z.string()).optional(),
  date_collecte: z.string().optional(),
  fiable: z.boolean().optional(),
  nature: zodEnumFromObjValues(NATURE_ORGANISME_DE_FORMATION).optional(),
  last_transmission_date: z.date().nullish(),
  ferme: z.boolean().optional(),

  // Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
  responsabilitePartielle: z.boolean().optional(),
});

const organismesCountSchema = z.object({
  organismes: z.number(),
  fiables: z.number(),
  sansTransmissions: z.number(),
  siretFerme: z.number(),
  natureInconnue: z.number(),
  uaiNonDeterminee: z.number(),
});

export type IRelatedOrganisme = z.output<typeof relationOrganismeSchema>;
export type IRelatedOrganismeJson = Jsonify<IRelatedOrganisme>;

export type IOrganismesCount = z.output<typeof organismesCountSchema>;

const collectionName = "organismes";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [
    { uai: 1, siret: 1 },
    { name: "uai_siret", unique: true },
  ],
  [{ uai: 1 }, { name: "uai" }],
  [{ siret: 1 }, { name: "siret" }],
  [{ ferme: 1 }, { name: "ferme" }],
  [{ est_dans_le_referentiel: 1 }, { name: "est_dans_le_referentiel" }],
  [{ effectifs_count: 1 }, { name: "effectifs_count" }],
  [{ fiabilisation_statut: 1, ferme: 1, "adresse.departement": 1 }, {}],
  [{ fiabilisation_statut: 1, ferme: 1, first_transmission_date: 1, "adresse.departement": 1 }, {}],
  [{ nature: 1 }, { name: "nature" }],
  [
    { nom: "text", siret: "text", uai: "text" },
    { name: "nom_siret_uai_text", default_language: "french" },
  ],
  [{ "adresse.departement": 1 }, { name: "departement" }],
  [{ "adresse.region": 1 }, { name: "region" }],
  [{ created_at: 1 }, { name: "created_at" }],
  [{ reseaux: 1 }, { name: "reseaux" }],
];

// Si contributeurs = [] et !first_transmission_date Alors Organisme en stock "Non actif"
export const zOrganisme = z
  .object({
    _id: zObjectId,
    uai: z
      .string({
        description: "Code UAI de l'établissement",
      })
      .regex(UAI_REGEX)
      .nullish(),
    siret: z
      .string({
        description: "N° SIRET de l'établissement",
      })
      .regex(SIRET_REGEX),
    opcos: z
      .array(z.string(), {
        description: "OPCOs du CFA, s'ils existent",
      })
      .optional(),
    reseaux: z.array(z.string()).describe("Réseaux du CFA, s'ils existent").optional(),
    erps: z
      .array(
        z.string()
        // TODO because legacy
        // { enum: Object.values(ERPS).map(({ nomErp }) => nomErp) }
      )
      .describe("ERPs rattachés au CFA, s'ils existent")
      .optional(),
    erp_unsupported: z
      .string({
        description: "ERP renseigné par l'utilisateur à la configuration quand il n'est pas supporté",
      })
      .optional(),
    effectifs_count: z.number({ description: "Compteur sur le nombre d'effectifs de l'organisme" }).int().optional(),
    effectifs_current_year_count: z
      .number({
        description: "Compteur sur le nombre d'effectifs de l'organisme sur l'année courante",
      })
      .int()
      .optional(),
    nature: zodEnumFromObjValues(NATURE_ORGANISME_DE_FORMATION)
      .describe("Nature de l'organisme de formation")
      .optional(),
    nom: z.string({ description: "Nom de l'organisme de formation" }).optional(),
    enseigne: z.string({ description: "Enseigne de l'organisme de formation" }).nullish(),
    raison_sociale: z.string({ description: "Raison sociale de l'organisme de formation" }).optional(),
    adresse: zAdresse.describe("Adresse de l'établissement").nullish(),
    geopoint: z
      .object({
        type: z.literal("Point"),
        coordinates: z.array(z.number()),
      })
      .nullish(),
    formations_count: z.number(),
    organismesFormateurs: z.array(relationOrganismeSchema).optional(),
    organismesResponsables: z.array(relationOrganismeSchema).optional(),
    first_transmission_date: z.date({ description: "Date de la première transmission de données" }).optional(),
    last_transmission_date: z.date({ description: "Date de la dernière transmission de données" }).optional(),
    est_dans_le_referentiel: zodEnumFromObjValues(STATUT_PRESENCE_REFERENTIEL)
      .describe("Présence dans le referentiel ONISEP des organismes")
      .optional(),
    ferme: z.boolean({ description: "Le siret est fermé" }).optional(),
    qualiopi: z.boolean({ description: "a la certification Qualiopi" }).optional(),
    contacts_from_referentiel: z.array(
      z.object({
        email: z.string().email(),
        confirmation_referentiel: z.boolean(),
        sources: z.array(z.string()),
      })
    ),

    api_key: z.string({ description: "API key pour envoi de données" }).nullish(),
    api_uai: z.string({ description: "Uai envoyé par l'erp" }).optional(),
    api_siret: z.string({ description: "Siret envoyé par l'erp" }).optional(),
    api_configuration_date: z.date({ description: "Date de l'interfaçage" }).optional(),
    api_version: z.string({ description: "Version de l'api utilisée (v2 ou v3)" }).nullable().optional(),

    fiabilisation_statut: zodEnumFromObjValues(STATUT_FIABILISATION_ORGANISME)
      .describe("Statut de fiabilisation de l'organisme")
      .optional(),
    mode_de_transmission: z.enum(["API", "MANUEL"]).describe("Mode de transmission des effectifs").optional(),
    mode_de_transmission_configuration_date: z
      .date({
        description: "Date à laquelle le mode de transmission a été configuré",
      })
      .optional(),
    mode_de_transmission_configuration_author_fullname: z
      .string({
        description: "Auteur de la configuration (prénom nom)",
      })
      .optional(),
    organisme_transmetteur_id: z
      .string({
        description: effectifsModel.zod.shape.source_organisme_id.description,
      })
      .optional(),
    updated_at: z.date({ description: "Date de mise à jour en base de données" }),
    created_at: z.date({ description: "Date d'ajout en base de données" }),
    has_transmission_errors: z
      .boolean({
        description: "Indique si cet organisme a une transmissions d'effectif en erreur",
      })
      .optional(),
    transmission_errors_date: z.date({ description: "Date d'erreur de transmission" }).optional(),
    is_transmission_target: z
      .boolean({
        description:
          "Indique si cet organisme ( ou un de ces organismes formateur dont il est le responsable ) a été la cible ou non de transmissions d'effectif",
      })
      .nullish(),
    last_effectifs_deca_update: z
      .date({
        description: "Date de la dernière mise à jour des effectifs deca pour cet organisme",
      })
      .optional(),
    last_erp_transmission_date: z
      .date({ description: "Date de dernière transmission en tant qu'organisme transmetteur" })
      .nullish(),
    is_allowed_deca: z
      .boolean({ description: "Organisme du programme DECA-CFA (effectifs DECA visibles côté CFA)" })
      .nullish(),
  })
  .strict();

export type IOrganisme = z.output<typeof zOrganisme>;
export type IOrganismeJson = Jsonify<IOrganisme>;

export const hasRecentTransmissions = (last_transmission_date: Date | null | undefined) =>
  last_transmission_date && !isBefore(new Date(last_transmission_date), subMonths(new Date(), 3));

export const withOrganismeListSummary = (organisme: IOrganisme) => {
  // Initialisation avec les organises formateurs et son propre organisme
  const init = {
    organismes: 1,
    fiables: organisme.fiabilisation_statut === "FIABLE" ? 1 : 0,
    sansTransmissions: hasRecentTransmissions(organisme.last_transmission_date) ? 0 : 1,
    siretFerme: organisme.ferme ? 1 : 0,
    natureInconnue: organisme.nature === "inconnue" ? 1 : 0,
    uaiNonDeterminee: organisme.uai ? 0 : 1,
  };

  const organismesCount = organisme.organismesFormateurs?.reduce((acc, curr) => {
    return {
      ...acc,
      organismes: acc.organismes + 1,
      fiables: acc.fiables + (curr.fiable ? 1 : 0),
      sansTransmissions: acc.sansTransmissions + (hasRecentTransmissions(curr.last_transmission_date) ? 0 : 1),
      siretFerme: acc.siretFerme + (curr.ferme ? 1 : 0),
      natureInconnue: acc.natureInconnue + (curr.nature === "inconnue" ? 1 : 0),
      uaiNonDeterminee: acc.uaiNonDeterminee + (!curr.uai ? 1 : 0),
    };
  }, init);

  return {
    ...organisme,
    organismesCount,
  };
};

export default { zod: zOrganisme, indexes, collectionName };
