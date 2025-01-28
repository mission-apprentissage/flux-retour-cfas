import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  await organismesDb().updateMany(
    { prepa_apprentissage: { $exists: true } },
    { $unset: { prepa_apprentissage: true } },
    { bypassDocumentValidation: true }
  );
  await organismesDb().updateMany(
    { natureValidityWarning: { $exists: true } },
    { $unset: { natureValidityWarning: true } },
    { bypassDocumentValidation: true }
  );
  await organismesDb().updateMany(
    { formations: { $exists: true } },
    { $unset: { formations: true } },
    { bypassDocumentValidation: true }
  );
};
