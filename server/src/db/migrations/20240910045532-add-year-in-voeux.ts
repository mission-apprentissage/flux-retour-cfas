import { voeuxAffelnetDb } from "@/common/model/collections";

export const up = async () => {
  await voeuxAffelnetDb().updateMany({}, { $set: { annee_scolaire_rentree: "2024" } });
};
