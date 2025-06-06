import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { number, z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

export enum BREVO_LISTE_TYPE {
  MISSION_LOCALE = "MISSION_LOCALE_RUPTURANT",
}

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ ml_id: 1, type: 1 }, { unique: true }],
  [{ listId: 1 }, { unique: true }],
];

const collectionName = "brevoMissionLocaleList";

const zBrevoMissionLocaleList = z.object({
  _id: zObjectId,
  listId: z.number(),
  type: z.nativeEnum(BREVO_LISTE_TYPE),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  ml_id: number(),
});

export type IBrevoMissionLocaleList = z.output<typeof zBrevoMissionLocaleList>;
export default { zod: zBrevoMissionLocaleList, collectionName, indexes };
