import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

const collectionName = "brevoContactList";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ slug: 1 }, { unique: true }],
  [{ listId: 1 }, { unique: true }],
];

const zBrevoContactList = z.object({
  _id: zObjectId,
  slug: z.string(),
  listId: z.number(),
  listName: z.string(),
  folderId: z.number(),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
});

export type IBrevoContactList = z.output<typeof zBrevoContactList>;
export default { zod: zBrevoContactList, collectionName, indexes };
