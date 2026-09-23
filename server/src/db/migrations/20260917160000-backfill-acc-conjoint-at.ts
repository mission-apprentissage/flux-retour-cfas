import { missionLocaleEffectifsDb } from "@/common/model/collections";

export const up = async () => {
  const { modifiedCount } = await missionLocaleEffectifsDb().updateMany(
    { "organisme_data.acc_conjoint": true, "organisme_data.acc_conjoint_at": { $exists: false } },
    [{ $set: { "organisme_data.acc_conjoint_at": { $ifNull: ["$organisme_data.reponse_at", "$created_at"] } } }]
  );

  console.log(`acc_conjoint_at posé sur ${modifiedCount} dossier(s) de collaboration`);
};
