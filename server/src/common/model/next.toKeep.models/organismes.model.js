import Joi from "joi";
import { object, objectId, string, date, arrayOf, boolean, integer } from "../json-schema/jsonSchemaTypes.js";
import { adresseSchema } from "../json-schema/adresseSchema.js";
import { RESEAUX_CFAS } from "../../constants/networksConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../utils/validationsUtils/organisme-de-formation/nature.js";
import { schemaValidation } from "../../utils/schemaUtils.js";
import { siretSchema, uaiSchema } from "../../utils/validationUtils.js";

export const collectionName = "organismes";

export const indexes = () => {
  return [
    [{ uai: 1 }, { name: "uai", unique: true }],
    [
      { nom: "text", nom_tokenized: "text" },
      { name: "nom_tokenized_text", default_language: "french" },
    ],
    [{ sirets: 1 }, { name: "sirets" }],
  ];
};

// Si contributeurs = [] et !first_transmission_date Alors Organisme en stock "Non actif"
export const schema = object(
  {
    _id: objectId(),
    uai: string({
      description: "Code uai de l'établissement",
      pattern: "^[0-9]{7}[a-zA-Z]$",
      maxLength: 8,
      minLength: 8,
    }),
    sirets: arrayOf(string({ description: "N° SIRET", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }), {
      description: "Liste des sirets reliés à l'établissement",
    }),
    siret: string({ description: "N° SIRET fiabilisé", pattern: "^[0-9]{14}$", maxLength: 14, minLength: 14 }),
    reseaux: arrayOf(string({ enum: Object.keys(RESEAUX_CFAS) }), { description: "Réseaux du CFA, s'ils existent" }),
    erps: arrayOf(string(), { description: "ERPs rattachés au CFA, s'ils existent" }),

    nature: string({
      description: "Nature de l'organisme de formation",
      enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
    }),
    nature_validity_warning: boolean({ description: "Y a-t-il un doute sur la validité de la nature" }),
    nom: string({ description: "Nom de l'organisme de formation" }),
    nom_tokenized: string({
      description: "Nom de l'organisme de formation tokenized pour la recherche textuelle",
    }),
    adresse: {
      ...adresseSchema,
      description: "Adresse de l'établissement",
    },
    formations: arrayOf(
      object(
        {
          formation_id: objectId(),
          organismes: arrayOf(
            object(
              {
                organisme_id: objectId(),
                nature: string({
                  enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
                }),
                uai: string({
                  description: "Code uai du lieu de formation (optionnel)",
                  pattern: "^[0-9]{7}[a-zA-Z]$",
                  maxLength: 8,
                  minLength: 8,
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
    date_derniere_transmission: date({ description: "Date de la dernière transmission de données" }),
    est_dans_le_referentiel: boolean({ description: "Est dans le referentiel onisep des organismes" }),

    // TODO [tech] TO REMOVE LATER
    access_token: string({ description: "Le token permettant l'accès au CFA à sa propre page" }),
    api_key: string({ description: "API key pour envoi de données" }),

    mode_de_transmission: string({
      description: "Mode de transmission des effectifs",
      enum: ["API", "FICHIERS", "MANUEL"],
    }),
    setup_step_courante: string({
      description: "Etape d'installation courante",
      // enum: ["STEP1", "STEP2", "STEP3"], // TODO
    }),
    contributeurs: arrayOf(string(), { description: "Emails des contributeurs de cet organisme" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["uai", "adresse.departement", "adresse.region", "adresse.academie"], additionalProperties: true }
);

// Default value
export function defaultValuesOrganisme() {
  return {
    sirets: [],
    metiers: [],
    reseaux: [],
    erps: [],
    formations: [],
    contributeurs: [],
    created_at: new Date(),
    updated_at: new Date(),
  };
}

// Extra validation
export function validateOrganisme(props) {
  return schemaValidation(props, schema, [
    {
      name: "uai",
      base: uaiSchema(),
    },
    {
      name: "sirets",
      base: Joi.array().items(siretSchema()),
    },
    {
      name: "siret",
      base: siretSchema(),
    },
  ]);
}
