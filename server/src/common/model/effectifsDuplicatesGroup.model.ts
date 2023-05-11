import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { EFFECTIF_DUPLICATES_STATUTS } from "../constants/effectifDuplicate";

import { arrayOf, date, integer, object, objectId } from "./json-schema/jsonSchemaTypes";

const collectionName = "effectifsDuplicatesGroup";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ organisme_id: 1 }, { name: "organisme_id" }]];

const schema = object(
  {
    _id: objectId(),
    organisme_id: objectId({ description: "Organisme id" }),
    duplicatesEffectifs: arrayOf(
      object(
        {
          _id: objectId({ description: "Identifiant de l'effectif en doublon" }),
          statut: integer({ enum: Object.values(EFFECTIF_DUPLICATES_STATUTS) }),
          // TODO : Voir si on remonte au niveau de l'objet les champs en commun & différents de l'effectif
        },
        { additionalProperties: true }
      ),
      {
        description: "Liste des effectifs en doublon",
      }
    ),
    updated_at: date({ description: "Date de mise à jour en base de données" }),
    created_at: date({ description: "Date d'ajout en base de données" }),
  },
  { required: ["organisme_id", "duplicatesEffectifs"] }
);

// Default value for group
export function defaultValuesEffectifDuplicatesGroup() {
  return {
    duplicatesEffectifs: [],
    updated_at: new Date(),
    created_at: new Date(),
  };
}

// Default value for duplicate
export function defaultValuesEffectifDuplicate() {
  return { statut: EFFECTIF_DUPLICATES_STATUTS.a_traiter };
}

export default { schema, indexes, collectionName };
