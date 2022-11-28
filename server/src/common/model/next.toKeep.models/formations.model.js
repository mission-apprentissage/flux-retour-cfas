import { object, arrayOf, string, date, objectId, dateOrNull, stringOrNull } from "../json-schema/jsonSchemaTypes.js";

export const collectionName = "formations";

export const indexes = () => {
  return [
    [
      { libelle: "text", tokenized_libelle: "text" },
      { default_language: "french" },
      { name: "libelle_text_tokenized_libelle_text" },
    ],
    [{ cfd: 1 }, { name: "cfd", unique: true }],
    [{ rncps: 1 }, { name: "rncps" }],
  ];
};

export const schema = object(
  {
    _id: objectId(),
    cfd: string({ description: "Code cfd de l'établissement" }),
    cfd_start_date: dateOrNull({ description: "Date d'ouverture du CFD" }),
    cfd_end_date: dateOrNull({ description: "Date de fermeture du CFD" }),
    libelle: stringOrNull({ description: "Libellé normalisé depuis Tables de Correspondances" }),
    rncps: arrayOf(string(), {
      description: "Liste des codes RNCPs de la formation récupéré depuis Tables de Correspondances",
    }),
    niveau: stringOrNull({ description: "Niveau de formation récupéré via Tables de Correspondances" }),
    niveau_libelle: stringOrNull({
      description: "Libellé du niveau de formation récupéré via Tables de Correspondances",
    }),
    tokenized_libelle: stringOrNull({ description: "Libellé tokenizé pour la recherche" }),
    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à la formation" }),
    updated_at: dateOrNull({ description: "Date d'update en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
    // TODO Samir duree
    // TODO Samir annee
  },
  { required: ["cfd"] }
);

export default { schema, indexes, collectionName };
