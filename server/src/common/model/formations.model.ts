import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { CFD_REGEX_PATTERN } from "shared/constants/validations";

import { object, string, date, objectId, dateOrNull, stringOrNull, arrayOf } from "./json-schema/jsonSchemaTypes";

const collectionName = "formations";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ libelle: "text" }, { default_language: "french", name: "libelle_text" }],
  [{ libelle: 1 }, { name: "libelle" }], // this index is also needed to search using regex
  [{ cfd: 1 }, { name: "cfd", unique: true }],
  [{ rncps: 1 }, { name: "rncps" }],
];

const schema = object(
  {
    _id: objectId(),
    cfd: string({ description: "Code CFD de la formation", pattern: CFD_REGEX_PATTERN, maxLength: 8 }),
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
    metiers: arrayOf(string(), { description: "Les domaines métiers rattachés à la formation" }),
    duree: stringOrNull({ description: "Durée de la formation théorique" }),
    annee: stringOrNull({ description: "Année de la formation (cursus)" }),

    updated_at: dateOrNull({ description: "Date d'update en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["cfd"] }
);

export default { schema, indexes, collectionName };
