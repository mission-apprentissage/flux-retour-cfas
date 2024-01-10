import { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { object, string } from "shared";

const collectionName = "bassinsEmploi";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ code_commune: 1 }, { name: "code_commune", unique: true }],
];

const schema = object(
  {
    code_commune: string({ description: "Code commune" }),
    code_zone_emploi: string({ description: "Code zone d'emploi" }),
  },
  { required: ["code_commune", "code_zone_emploi"], additionalProperties: true }
);

export default { schema, indexes, collectionName };
