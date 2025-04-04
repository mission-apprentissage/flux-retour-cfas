import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [];

const collectionName = "transmissionV2";

const zTransmissionV2 = z.object({
  _id: zObjectId,
});

export type ITransmissionV2 = z.output<typeof zTransmissionV2>;
export default { zod: zTransmissionV2, collectionName, indexes };
