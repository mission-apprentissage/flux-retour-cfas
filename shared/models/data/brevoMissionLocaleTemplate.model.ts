import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { number, z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

export enum BREVO_TEMPLATE_NAME {
  CONFIRMATION = "CONFIRMATION",
  REFUS = "REFUS",
}

export enum BREVO_TEMPLATE_TYPE {
  MISSION_LOCALE = "MISSION_LOCALE",
}

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ name: 1, type: 1 }, { unique: true }],
  [{ templateId: 1 }, { unique: true }],
];

const collectionName = "brevoMissionLocaleTemplate";

const zBrevoMissionLocaleTemplate = z.object({
  _id: zObjectId,
  templateId: z.number(),
  name: z.nativeEnum(BREVO_TEMPLATE_NAME),
  type: z.nativeEnum(BREVO_TEMPLATE_TYPE),
  created_at: z.date().default(() => new Date()),
  ml_id: number(),
});

export type IBrevoMissionLocaleTemplate = z.output<typeof zBrevoMissionLocaleTemplate>;
export default { zod: zBrevoMissionLocaleTemplate, collectionName, indexes };
