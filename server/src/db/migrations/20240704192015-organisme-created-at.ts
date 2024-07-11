import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  await organismesDb().updateMany(
    // @ts-expect-error
    { created_at: null },
    [{ $set: { created_at: { $toDate: "$_id" } } }],
    { bypassDocumentValidation: true }
  );
};
