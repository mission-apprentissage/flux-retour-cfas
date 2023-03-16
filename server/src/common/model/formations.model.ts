import { schemaValidation } from "../utils/schemaUtils.js";
import { cfdSchema } from "../utils/validationUtils.js";
import {
  object,
  string,
  date,
  objectId,
  dateOrNull,
  stringOrNull,
  arrayOfOrNull,
} from "./json-schema/jsonSchemaTypes.js";

const collectionName = "formations";

const indexes = () => {
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

// TODO utiliser formationEffectifSchema ?
const schema = object(
  {
    _id: objectId(),
    cfd: string({ description: "Code cfd de l'établissement" }),
    cfd_start_date: dateOrNull({ description: "Date d'ouverture du CFD" }),
    cfd_end_date: dateOrNull({ description: "Date de fermeture du CFD" }),
    libelle: stringOrNull({ description: "Libellé normalisé depuis Tables de Correspondances" }),
    rncps: arrayOfOrNull(string(), {
      description: "Liste des codes RNCPs de la formation récupéré depuis Tables de Correspondances",
    }),
    niveau: stringOrNull({ description: "Niveau de formation récupéré via Tables de Correspondances" }),
    niveau_libelle: stringOrNull({
      description: "Libellé du niveau de formation récupéré via Tables de Correspondances",
    }),
    tokenized_libelle: stringOrNull({ description: "Libellé tokenizé pour la recherche" }),
    metiers: arrayOfOrNull(string(), { description: "Les domaines métiers rattachés à la formation" }),
    duree: stringOrNull({ description: "Durée de la formation théorique" }),
    annee: stringOrNull({ description: "Année de la formation (cursus)" }),

    updated_at: dateOrNull({ description: "Date d'update en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["cfd"] }
);

// TODO Extra validation
export function validateFormation(props) {
  return schemaValidation({
    entity: props,
    schema,
    extensions: [
      {
        name: "cfd",
        base: cfdSchema(),
      },
    ],
  });
}

export default { schema, indexes, collectionName };
