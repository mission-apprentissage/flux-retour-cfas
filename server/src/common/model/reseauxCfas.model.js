const { object, objectId, string, date } = require("./json-schema/jsonSchemaTypes");

const collectionName = "reseauxCfas";

const schema = object({
  _id: objectId(),
  nom_reseau: string({ description: "Nom du réseau de cfas" }),
  nom_etablissement: string({ description: "Nom de l'établissement" }),
  uai: string({ description: "Code uai de l'établissement" }),
  siret: string({ description: "Siret de l'établissement" }),
  updated_at: date({ description: "Date de mise à jour en base de données" }),
  created_at: date({ description: "Date d'ajout en base de données" }),
});

module.exports = {
  collectionName,
  schema,
};
