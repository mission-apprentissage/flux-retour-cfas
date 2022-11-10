const { object, objectId, string, date, arrayOf, boolean } = require("./json-schema/jsonSchemaTypes");

const collectionName = "cfas";

const schema = () => {
  return object({
    _id: objectId(),
    uai: string({ description: "Code uai de l'établissement" }),
    sirets: arrayOf(string(), { description: "Liste des sirets reliés à l'établissement" }),
    nature: string({ description: "Nature de l'organisme de formation" }),
    nature_validity_warning: boolean({ description: "Y a-t-il un doute sur la validié de la nature" }),
    nom: string({ description: "Nom de l'organisme de formation" }),
    nom_tokenized: string({ description: "Nom de l'organisme de formation tokenized pour la recherche textuelle" }),
    adresse: string({ description: "Adresse de l'établissement" }),
    erps: arrayOf(string(), { description: "ERPs rattachés au CFA, s'ils existent" }),
    reseaux: arrayOf(string(), { description: "Réseaux du CFA, s'ils existent" }),
    region_nom: string({ description: "Région du CFA" }),
    region_num: string({ description: "Numéro de la région du CFA" }),
    first_transmission_date: date({ description: "Date de la première transmission de données" }),
    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à l'établissement" }),
    access_token: string({ description: "Le token permettant l'accès au CFA à sa propre page" }),
    private_url: string({ description: "L'url via laquelle le CFA peut accéder à sa propre page" }),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  });
};

module.exports = {
  collectionName,
  schema,
};
