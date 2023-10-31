import { CreateIndexesOptions, IndexSpecification } from "mongodb";

import { arrayOf, boolean, number, object, objectId, string } from "./json-schema/jsonSchemaTypes";

const collectionName = "rncp";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ rncp: 1 }, { unique: true }],
  [{ opcos: 1 }, {}],
];

const schema = object(
  {
    _id: objectId(),
    rncp: string(),
    nouveaux_rncp: arrayOf(string()),
    intitule: string(),
    niveau: number(),
    etat_fiche: string(),
    actif: boolean(),
    romes: arrayOf(string()),
    opcos: arrayOf(string(), { description: "Information récupérée depuis les CSV des OPCOs et non le RNCP" }),
  },
  { required: ["rncp", "intitule", "etat_fiche", "actif", "romes"], additionalProperties: false }
);

export default { schema, indexes, collectionName };
