import { brevoMissionLocaleTemplateDb } from "@/common/model/collections";

export const up = async () => {
  await brevoMissionLocaleTemplateDb().updateMany(
    { ml_id: { $exists: true } },
    { $unset: { ml_id: true } },
    { bypassDocumentValidation: true }
  );
};
