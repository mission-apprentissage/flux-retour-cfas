import { IFormation } from "api-alternance-sdk";
import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [[{ "identifiant.cle_ministere_educatif": 1 }, {}]];
// TODO index sur cfd + rncp + responsable + formateur ?

const collectionName = "formationAPIV2";

const zFormationAPIV2 = z.any();

export type IFormationAPIV2 = IFormation;
export default { zod: zFormationAPIV2, collectionName, indexes };
