import {
  object,
  objectId,
  string,
  date,
  arrayOf,
  boolean,
  stringOrNull,
  dateOrNull,
  arrayOfOrNull,
} from "../../json-schema/jsonSchemaTypes.js";

export const collectionName = "cfas";

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

const schema = object(
  {
    _id: objectId(),
    uai: string({ description: "Code UAI de l'établissement" }),
    sirets: arrayOf(string(), { description: "Liste des sirets reliés à l'établissement" }),
    nature: stringOrNull({ description: "Nature de l'organisme de formation" }),
    nature_validity_warning: boolean({ description: "Y a-t-il un doute sur la validié de la nature" }),
    nom: stringOrNull({ description: "Nom de l'organisme de formation" }),
    nom_tokenized: stringOrNull({
      description: "Nom de l'organisme de formation tokenized pour la recherche textuelle",
    }),
    adresse: stringOrNull({ description: "Adresse de l'établissement" }),
    erps: arrayOf(string(), { description: "ERPs rattachés au CFA, s'ils existent" }),
    reseaux: arrayOf(string(), { description: "Réseaux du CFA, s'ils existent" }),
    region_nom: stringOrNull({ description: "Région du CFA" }),
    region_num: stringOrNull({ description: "Numéro de la région du CFA" }),
    first_transmission_date: date({ description: "Date de la première transmission de données" }),
    metiers: arrayOfOrNull(string(), { description: "Les domaines métiers rattachés à l'établissement" }),
    access_token: stringOrNull({ description: "Le token permettant l'accès au CFA à sa propre page" }),
    private_url: stringOrNull({ description: "L'url via laquelle le CFA peut accéder à sa propre page" }),
    updated_at: dateOrNull({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["uai", "created_at"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
