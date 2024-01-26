import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { TETE_DE_RESEAUX, STATUT_CREATION_ORGANISME, STATUT_FIABILISATION_ORGANISME } from "shared";

import { SIRET_REGEX_PATTERN, UAI_REGEX_PATTERN } from "@/common/constants/validations";

import { NATURE_ORGANISME_DE_FORMATION, STATUT_PRESENCE_REFERENTIEL } from "../constants/organisme";

import effectifsModel from "./effectifs.model/effectifs.model";
import { adresseSchema } from "./json-schema/adresseSchema";
import {
  arrayOf,
  boolean,
  date,
  integer,
  object,
  objectId,
  objectIdOrNull,
  string,
  stringOrNull,
} from "./json-schema/jsonSchemaTypes";

const relationOrganismeSchema = object(
  {
    // infos référentiel
    siret: string(),
    uai: stringOrNull(),
    referentiel: boolean(),
    label: string(),
    sources: arrayOf(string()),

    // infos TDB
    _id: objectIdOrNull(),
    enseigne: string(),
    raison_sociale: string(),
    commune: string(),
    region: string(),
    departement: string(),
    academie: string(),
    reseaux: arrayOf(string()),

    // Fix temporaire https://www.notion.so/mission-apprentissage/Permission-CNAM-PACA-305ab62fb1bf46e4907180597f6a57ef
    responsabilitePartielle: boolean(),
  },
  { additionalProperties: true }
);

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
const schema = object(
  {
    _id: objectId(),
    uai: string({
      description: "Code UAI de l'établissement",
      pattern: UAI_REGEX_PATTERN,
      maxLength: 8,
      minLength: 8,
    }),
    siret: string({
      description: "N° SIRET de l'établissement",
      pattern: SIRET_REGEX_PATTERN,
      maxLength: 14,
      minLength: 14,
    }),
    opcos: arrayOf(string({}), {
      description: "OPCOs du CFA, s'ils existent",
    }),
    reseaux: arrayOf(string({ enum: TETE_DE_RESEAUX.map((r) => r.key) }), {
      description: "Réseaux du CFA, s'ils existent",
    }),
    erps: arrayOf(
      string(),
      // TODO because legacy
      // { enum: Object.values(ERPS).map(({ nomErp }) => nomErp) }
      {
        description: "ERPs rattachés au CFA, s'ils existent",
      }
    ),
    erp_unsupported: string({
      description: "ERP renseigné par l'utilisateur à la configuration quand il n'est pas supporté",
    }),
    effectifs_count: integer({ description: "Compteur sur le nombre d'effectifs de l'organisme" }),
    effectifs_current_year_count: integer({
      description: "Compteur sur le nombre d'effectifs de l'organisme sur l'année courante",
    }),
    nature: string({
      description: "Nature de l'organisme de formation",
      enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
    }),
    nom: string({ description: "Nom de l'organisme de formation" }),
    enseigne: string({ description: "Enseigne de l'organisme de formation" }),
    raison_sociale: string({ description: "Raison sociale de l'organisme de formation" }),
    adresse: {
      ...adresseSchema,
      description: "Adresse de l'établissement",
    },
    relatedFormations: arrayOf(
      object(
        {
          formation_id: objectId(),
          cle_ministere_educatif: string({
            description: "Clé unique de la formation",
          }),
          annee_formation: integer({
            description: "Année millésime de la formation pour cet organisme",
          }),
          organismes: arrayOf(
            object(
              {
                organisme_id: objectId(),
                nature: string({
                  enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
                }),
                uai: string({
                  description: "Code UAI du lieu de formation (optionnel)",
                  pattern: UAI_REGEX_PATTERN,
                  maxLength: 8,
                  minLength: 8,
                }),
                siret: string({
                  description: "Siret du lieu de formation (optionnel)",
                  pattern: SIRET_REGEX_PATTERN,
                  maxLength: 14,
                  minLength: 14,
                }),
                adresse: {
                  ...adresseSchema,
                  description: "Adresse du lieu de formation (optionnel)",
                },
              },
              { additionalProperties: true }
            )
          ),
          duree_formation_theorique: integer({
            description: "Durée théorique de la formation en mois pour cet organisme",
          }),
        },
        { additionalProperties: true }
      ),
      {
        description: "Formations de cet organisme",
      }
    ),
    organismesFormateurs: arrayOf(relationOrganismeSchema),
    organismesResponsables: arrayOf(relationOrganismeSchema),
    first_transmission_date: date({ description: "Date de la première transmission de données" }),
    last_transmission_date: date({ description: "Date de la dernière transmission de données" }),
    est_dans_le_referentiel: string({
      enum: Object.values(STATUT_PRESENCE_REFERENTIEL),
      description: "Présence dans le referentiel ONISEP des organismes",
    }),
    ferme: boolean({ description: "Le siret est fermé" }),
    qualiopi: boolean({ description: "a la certification Qualiopi" }),
    prepa_apprentissage: boolean({ description: "fait de la prépa apprentissage" }),

    // TODO [tech] TO REMOVE LATER
    access_token: string({ description: "Le token permettant l'accès au CFA à sa propre page" }),
    api_key: string({ description: "API key pour envoi de données" }),
    api_uai: string({ description: "Uai envoyé par l'erp" }),
    api_siret: string({ description: "Siret envoyé par l'erp" }),
    api_configuration_date: date({ description: "Date de l'interfaçage" }),
    api_version: stringOrNull({ description: "Version de l'api utilisée (v2 ou v3)" }),

    fiabilisation_statut: string({
      description: "Statut de fiabilisation de l'organisme",
      enum: Object.values(STATUT_FIABILISATION_ORGANISME),
    }),
    mode_de_transmission: string({
      description: "Mode de transmission des effectifs",
      enum: ["API", "MANUEL"],
    }),
    mode_de_transmission_configuration_date: date({
      description: "Date à laquelle le mode de transmission a été configuré",
    }),
    mode_de_transmission_configuration_author_fullname: string({
      description: "Auteur de la configuration (prénom nom)",
    }),
    creation_statut: string({
      description: "Flag pour identifier que c'est un organisme créé à partir d'un lieu",
      enum: [STATUT_CREATION_ORGANISME.ORGANISME_LIEU_FORMATION],
    }),
    organisme_transmetteur_id: string({
      description: effectifsModel.schema.properties.source_organisme_id.description,
    }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["siret"], additionalProperties: true }
);

// Default value
export function defaultValuesOrganisme() {
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

export default { schema, indexes, collectionName };
