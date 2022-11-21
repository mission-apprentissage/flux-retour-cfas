import Joi from "joi";
import { object, objectId, string, date, arrayOf, boolean } from "../json-schema/jsonSchemaTypes.js";
import { adresseSchema } from "../json-schema/adresseSchema.js";
import { RESEAUX_CFAS } from "../../constants/networksConstants.js";
import { NATURE_ORGANISME_DE_FORMATION } from "../../domain/organisme-de-formation/nature.js";
import { schemaValidation } from "../../utils/schemaUtils.js";
import { siretSchema, uaiSchema } from "../../utils/validationUtils.js";

export const collectionName = "organismes";

export const indexes = () => {
  return [
    [{ uai: 1 }, { name: "uai" }],
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
    reseaux: arrayOf(string({ enum: Object.keys(RESEAUX_CFAS) }), { description: "Réseaux du CFA, s'ils existent" }),
    erps: arrayOf(string(), { description: "ERPs rattachés au CFA, s'ils existent" }),

    nature: string({
      description: "Nature de l'organisme de formation",
      enum: Object.values(NATURE_ORGANISME_DE_FORMATION),
    }),
    nature_validity_warning: boolean({ description: "Y a-t-il un doute sur la validié de la nature" }),
    nom: string({ description: "Nom de l'organisme de formation" }),
    nom_tokenized: string({
      description: "Nom de l'organisme de formation tokenized pour la recherche textuelle",
    }),
    adresse: {
      ...adresseSchema,
      description: "Adresse de l'établissement",
    },
    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à l'établissement" }),
    first_transmission_date: date({ description: "Date de la première transmission de données" }),
    est_dans_le_referentiel: boolean({ description: "Est dans le referentiel onisep des organismes" }),

    contributeurs: arrayOf(string(), { description: "Emails des contributeurs de cet organisme" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["uai"] }
);

// Default value
export function defaultValuesOrganisme() {
  return {
    sirets: [],
    metiers: [],
    reseaux: [],
    erps: [],
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
  ]);
}
//   adresse: Joi.string().allow("", null),
//   region_nom: Joi.string().allow("", null),
//   region_num: Joi.string().allow("", null),
