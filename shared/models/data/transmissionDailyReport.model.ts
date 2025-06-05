import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "transmissionDailyReport";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ organisme_id: 1, current_day: 1 }, { unique: true }],
  [{ current_day: 1 }, {}],
];

const zTransmissionDailyReport = z.object({
  _id: zObjectId,
  organisme_id: zObjectId,
  success_count: z.number(),
  error_count: z.number(),
  current_day: z.string(),
});

export type ITransmissionDailyReport = z.output<typeof zTransmissionDailyReport>;

export default { zod: zTransmissionDailyReport, indexes, collectionName };
