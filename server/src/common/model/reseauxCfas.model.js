const { object, objectId, string, date, stringOrNull, dateOrNull } = require("./json-schema/jsonSchemaTypes");

const collectionName = "reseauxCfas";

const indexes = () => {
  return [
    [
      { nom_etablissement: "text", nom_tokenized: "text" },
      { name: "nom_etablissement_tokenized_text", default_language: "french" },
    ],
    [{ uai: 1 }, { name: "uai" }],
    [{ siret: 1 }, { name: "siret" }],
    [{ nom_reseau: 1 }, { name: "nom_reseau" }],
  ];
};

const schema = object({
  _id: objectId(),
  nom_reseau: string({ description: "Nom du réseau de cfas" }),
  nom_etablissement: stringOrNull({ description: "Nom de l'établissement" }),
  uai: string({ description: "Code uai de l'établissement" }),
  siret: stringOrNull({ description: "Siret de l'établissement" }),
  updated_at: dateOrNull({ description: "Date de mise à jour en base de données" }),
  created_at: date({ description: "Date d'ajout en base de données" }),
});

module.exports = {
  collectionName,
  schema,
  indexes,
};
