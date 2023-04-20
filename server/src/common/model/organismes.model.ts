import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { object, objectId, string, date, arrayOf, boolean, integer } from "./json-schema/jsonSchemaTypes.js";
import { adresseSchema } from "./json-schema/adresseSchema.js";
import { TETE_DE_RESEAUX } from "../constants/networks.js";
import { NATURE_ORGANISME_DE_FORMATION, SIRET_REGEX_PATTERN, UAI_REGEX_PATTERN } from "../constants/organisme.js";
import { schemaValidation } from "../utils/schemaUtils.js";
import { siretSchema, uaiSchema } from "../utils/validationUtils.js";
import { STATUT_FIABILISATION_ORGANISME } from "../constants/fiabilisation.js";

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
  [{ fiabilisation_statut: 1 }, { name: "fiabilisation_statut" }],
  [{ nature: 1 }, { name: "nature" }],
  [
    { nom: "text", siret: "text", uai: "text" },
    { name: "nom_siret_uai_text", default_language: "french" },
  ],
  [{ "adresse.departement": 1 }, { name: "departement" }], // FIXME n'a pas l'air d'améliorer les performances
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
    siret: string({ description: "N° SIRET", pattern: SIRET_REGEX_PATTERN, maxLength: 14, minLength: 14 }),
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
    effectifs_count: integer({ description: "Compteur sur le nombre d'effectifs de l'organisme" }),
    effectifs_current_year_count: integer({
      description: "Compteur sur le nombre d'effectifs de l'organisme sur l'année courante",
    }),
    nature: string({
      description: "Nature de l'organisme de formation",
      enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
    }),
    nature_validity_warning: boolean({ description: "Y a-t-il un doute sur la validité de la nature" }),
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

    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à l'établissement" }),
    first_transmission_date: date({ description: "Date de la première transmission de données" }),
    last_transmission_date: date({ description: "Date de la dernière transmission de données" }),
    est_dans_le_referentiel: boolean({ description: "Est dans le referentiel onisep des organismes" }),
    ferme: boolean({ description: "Le siret est fermé" }),
    qualiopi: boolean({ description: "a la certification Qualiopi" }),

    // TODO [tech] TO REMOVE LATER
    access_token: string({ description: "Le token permettant l'accès au CFA à sa propre page" }),
    api_key: string({ description: "API key pour envoi de données" }),
    fiabilisation_statut: string({
      description: "Statut de fiabilisation de l'organisme",
      enum: Object.values(STATUT_FIABILISATION_ORGANISME),
    }),
    mode_de_transmission: string({
      description: "Mode de transmission des effectifs",
      enum: ["API", "MANUEL"],
    }),
    setup_step_courante: string({
      description: "Etape d'installation courante",
      enum: ["STEP1", "STEP2", "STEP3", "COMPLETE"],
    }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["siret"], additionalProperties: true }
);

// Default value
export function defaultValuesOrganisme() {
  return {
    metiers: [],
    reseaux: [],
    erps: [],
    formations: [],
    fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU,
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Extra validation
export function validateOrganisme(props) {
  return schemaValidation({
    entity: props,
    schema,
    extensions: [
      {
        name: "uai",
        base: uaiSchema(),
      },
      {
        name: "siret",
        base: siretSchema(),
      },
    ],
  });
}

export default { schema, indexes, collectionName };
