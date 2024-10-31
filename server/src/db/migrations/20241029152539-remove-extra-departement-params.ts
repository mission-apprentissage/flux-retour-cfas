import { effectifsDb, effectifsQueueDb } from "@/common/model/collections";

export const up = async () => {
  await effectifsDb().updateMany(
    { "apprenant.dernier_organisme_departement": { $exists: true } },
    { $unset: { "apprenant.dernier_organisme_departement": 1 } }
  );
  await effectifsQueueDb().updateMany(
    { dernier_organisme_departement: { $exists: true } },
    { $unset: { dernier_organisme_departement: 1 } }
  );
};
