import type { CreateIndexesOptions, IndexSpecification } from "mongodb";
import { z } from "zod";
import { zObjectId } from "zod-mongodb-schema";

import { zSituationEnum, zProblemeTypeEnum, zConnaissanceMlEnum } from "./missionLocaleEffectif.model";

const collectionName = "missionLocaleEffectifLog";

const indexes: [IndexSpecification, CreateIndexesOptions][] = [
  [{ mission_locale_effectif_id: 1 }, {}],
  [{ mission_locale_effectif_id: 1, created_at: -1 }, { name: "effectif_id_created_at" }],
];

export const MISSION_LOCALE_LOG_EVENT = {
  WHATSAPP_PREQUALIF_YES: "WHATSAPP_PREQUALIF_YES",
  WHATSAPP_PREQUALIF_NO: "WHATSAPP_PREQUALIF_NO",
  WHATSAPP_YES_HELP: "WHATSAPP_YES_HELP",
  WHATSAPP_NO_HELP: "WHATSAPP_NO_HELP",
} as const;

export const zMissionLocaleLogEvent = z.nativeEnum(MISSION_LOCALE_LOG_EVENT);
export type IMissionLocaleLogEvent = z.infer<typeof zMissionLocaleLogEvent>;

export const zMissionLocaleEffectifLog = z.object({
  _id: zObjectId,
  mission_locale_effectif_id: zObjectId,
  situation: zSituationEnum.nullish(),
  situation_autre: z.string().nullish(),
  deja_connu: z.boolean().nullish(),
  connaissance_ml: zConnaissanceMlEnum.nullish(),
  commentaires: z.string().nullish(),
  probleme_type: zProblemeTypeEnum.nullish(),
  probleme_detail: z.string().nullish(),
  event: zMissionLocaleLogEvent
    .nullish()
    .describe(
      "Événement typé non-situationnel (ex: réponse WhatsApp préqualif). Coexiste avec `situation` : l'un OU l'autre peut être renseigné selon le cas."
    ),
  created_at: z.date(),
  created_by: zObjectId.nullish(),
  read_by: z.array(zObjectId).default([]).describe("Liste des IDs des utilisateurs CFA qui ont lu ce log"),
});

export type IMissionLocaleEffectifLog = z.output<typeof zMissionLocaleEffectifLog>;
export default { zod: zMissionLocaleEffectifLog, indexes, collectionName };
