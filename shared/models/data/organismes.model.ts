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
  STATUT_CREATION_ORGANISME,
  STATUT_FIABILISATION_ORGANISME,
  STATUT_PRESENCE_REFERENTIEL,
  TETE_DE_RESEAUX_BY_ID,
  UAI_REGEX,
} from "../../constants";
import { zodEnumFromObjKeys, zodEnumFromObjValues } from "../../utils/zodHelper";

export const UAI_INCONNUE = "non déterminée";
export const UAI_INCONNUE_TAG_FORMAT = UAI_INCONNUE.toUpperCase();
export const UAI_INCONNUE_CAPITALIZE = `${UAI_INCONNUE.charAt(0).toUpperCase()}${UAI_INCONNUE.slice(1)}`;

export const ORGANISME_INDICATEURS_TYPE = {
  SANS_EFFECTIFS: "SANS_EFFECTIFS",
  NATURE_INCONNUE: "NATURE_INCONNUE",
  SIRET_FERME: "SIRET_FERME",
  UAI_NON_DETERMINE: "UAI_NON_DETERMINE",
};

const relationOrganismeSchema = z
  .object({
    // infos référentiel
    siret: z.string().optional(),
    uai: z.string().nullable().optional(),
    referentiel: z.boolean().optional(),
    label: z.string().optional(),
    sources: z.array(z.string()).optional(),

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
  })
  .strict();

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
];

// Si contributeurs = [] et !first_transmission_date Alors Organisme en stock "Non actif"
const zOrganisme = z
  .object({
    _id: zObjectId,
    uai: z
      .string({
        description: "Code UAI de l'établissement",
      })
      .regex(UAI_REGEX)
      .optional(),
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
    reseaux: z.array(zodEnumFromObjKeys(TETE_DE_RESEAUX_BY_ID)).describe("Réseaux du CFA, s'ils existent").optional(),
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
    adresse: zAdresse.describe("Adresse de l'établissement").optional(),
    relatedFormations: z
      .array(
        z
          .object({
            formation_id: zObjectId.optional(),
            cle_ministere_educatif: z
              .string({
                description: "Clé unique de la formation",
              })
              .optional(),
            annee_formation: z
              .number({
                description: "Année millésime de la formation pour cet organisme",
              })
              .int()
              .optional(),
            organismes: z
              .array(
                z
                  .object({
                    organisme_id: zObjectId.optional(),
                    nature: zodEnumFromObjValues(NATURE_ORGANISME_DE_FORMATION).optional(),
                    uai: z
                      .string({
                        description: "Code UAI du lieu de formation (optionnel)",
                      })
                      .regex(UAI_REGEX)
                      .optional(),
                    siret: z
                      .string({
                        description: "Siret du lieu de formation (optionnel)",
                      })
                      .regex(SIRET_REGEX)
                      .optional(),
                    adresse: zAdresse.describe("Adresse du lieu de formation (optionnel)").optional(),
                  })
                  .strict()
              )
              .optional(),
            duree_formation_theorique: z
              .number({
                description: "Durée théorique de la formation en mois pour cet organisme",
              })
              .int()
              .optional(),
          })
          .strict(),
        {
          description: "Formations de cet organisme",
        }
      )
      .optional(),
    organismesFormateurs: z.array(relationOrganismeSchema).optional(),
    organismesResponsables: z.array(relationOrganismeSchema).optional(),
    first_transmission_date: z.date({ description: "Date de la première transmission de données" }).optional(),
    last_transmission_date: z.date({ description: "Date de la dernière transmission de données" }).optional(),
    est_dans_le_referentiel: zodEnumFromObjValues(STATUT_PRESENCE_REFERENTIEL)
      .describe("Présence dans le referentiel ONISEP des organismes")
      .optional(),
    ferme: z.boolean({ description: "Le siret est fermé" }).optional(),
    qualiopi: z.boolean({ description: "a la certification Qualiopi" }).optional(),
    prepa_apprentissage: z.boolean({ description: "fait de la prépa apprentissage" }).optional(),

    // TODO [tech] TO REMOVE LATER
    access_token: z.string({ description: "Le token permettant l'accès au CFA à sa propre page" }).optional(),
    api_key: z.string({ description: "API key pour envoi de données" }).optional(),
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
    creation_statut: z
      .enum([STATUT_CREATION_ORGANISME.ORGANISME_LIEU_FORMATION])
      .describe("Flag pour identifier que c'est un organisme créé à partir d'un lieu")
      .optional(),
    organisme_transmetteur_id: z
      .string({
        description: effectifsModel.zod.shape.source_organisme_id.description,
      })
      .optional(),
    updated_at: z.date({ description: "Date de mise à jour en base de données" }),
    created_at: z.date({ description: "Date d'ajout en base de données" }),
    natureValidityWarning: z.boolean().optional(),
    formations: z.array(z.any()).max(0).optional(),
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
  })
  .strict();

export type IOrganisme = z.output<typeof zOrganisme>;
export type IOrganismeJson = Jsonify<IOrganisme>;

export type IOrganismeOptional = Pick<
  IOrganisme,
  | "reseaux"
  | "erps"
  | "relatedFormations"
  | "fiabilisation_statut"
  | "ferme"
  | "qualiopi"
  | "prepa_apprentissage"
  | "created_at"
  | "updated_at"
>;

// Default value
export function defaultValuesOrganisme(): Pick<
  IOrganisme,
  | "reseaux"
  | "erps"
  | "relatedFormations"
  | "fiabilisation_statut"
  | "ferme"
  | "qualiopi"
  | "prepa_apprentissage"
  | "created_at"
  | "updated_at"
> {
  return {
    reseaux: [],
    erps: [],
    relatedFormations: [],
    fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU,
    ferme: false,
    qualiopi: false,
    prepa_apprentissage: false,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

export const hasRecentTransmissions = (last_transmission_date: Date | null | undefined) =>
  last_transmission_date && !isBefore(new Date(last_transmission_date), subMonths(new Date(), 3));

export const withOrganismeListSummary = (organisme: IOrganisme) => {
  const init = {
    organismes: 0,
    fiables: 0,
    sansTransmissions: 0,
    siretFerme: 0,
    natureInconnue: 0,
    uaiNonDeterminee: 0,
  };
  const organismesCount = organisme.organismesFormateurs?.reduce((acc, curr) => {
    return {
      ...acc,
      fiables: acc.fiables + (curr.fiable ? 1 : 0),
      organismes: acc.organismes + 1,
      natureInconnue: acc.natureInconnue + (curr.nature === "inconnue" ? 1 : 0),
      uaiNonDeterminee: acc.uaiNonDeterminee + (!curr.uai ? 1 : 0),
      siretFerme: acc.siretFerme + (curr.ferme ? 1 : 0),
      sansTransmissions: acc.sansTransmissions + (hasRecentTransmissions(curr.last_transmission_date) ? 0 : 1),
    };
  }, init);

  return {
    ...organisme,
    organismesCount,
  };
};

export default { zod: zOrganisme, indexes, collectionName };
