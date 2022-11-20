import { object, objectId, string, date, arrayOf, boolean } from "../json-schema/jsonSchemaTypes.js";
import { RESEAUX_CFAS } from "../../constants/networksConstants.js";
import { adresseSchema } from "../json-schema/adresseSchema.js";

export const collectionName = "organismes";

export const indexes = () => {
  return [
    [
      { nom: "text", nom_tokenized: "text" },
      { name: "nom_tokenized_text", default_language: "french" },
    ],
    [{ uai: 1 }, { name: "uai" }],
    [{ sirets: 1 }, { name: "sirets" }],
  ];
};

export const schema = object(
  {
    _id: objectId(),
    uai: string({ description: "Code uai de l'établissement" }),
    sirets: arrayOf(string(), { description: "Liste des sirets reliés à l'établissement" }),
    reseaux: arrayOf(string({ enum: Object.keys(RESEAUX_CFAS) }), { description: "Réseaux du CFA, s'ils existent" }),
    erps: arrayOf(string(), { description: "ERPs rattachés au CFA, s'ils existent" }),

    nature: string({ description: "Nature de l'organisme de formation" }),
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

    contributeurs: arrayOf(string(), { description: "Emails des contributeurs de cet organisme" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["uai"] }
);

// Default value
export function defaultValuesOrganismes() {
  return {
    sirets: [],
    metiers: [],
    reseaux: [],
    erps: [],
    contributeurs: [],
    created_at: new Date(),
  };
}
