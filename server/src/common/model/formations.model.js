const { object, arrayOf, string, date, objectId } = require("./json-schema/jsonSchemaTypes");

const collectionName = "formations";

const schema = object(
  {
    _id: objectId(),
    cfd: string({ description: "Code cfd de l'établissement" }),
    cfd_start_date: date({ description: "Date d'ouverture du CFD" }),
    cfd_end_date: date({ description: "Date de fermeture du CFD" }),
    libelle: string({ description: "Libellé normalisé depuis Tables de Correspondances" }),
    rncps: arrayOf(string(), {
      description: "Liste des codes RNCPs de la formation récupéré depuis Tables de Correspondances",
    }),
    niveau: string({ description: "Niveau de formation récupéré via Tables de Correspondances" }),
    niveau_libelle: string({ description: "Libellé du niveau de formation récupéré via Tables de Correspondances" }),
    tokenized_libelle: string({ description: "Libellé tokenizé pour la recherche" }),
    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à la formation" }),
    updated_at: date({ description: "Date d'update en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["uai"] }
);

module.exports = { collectionName, schema };
