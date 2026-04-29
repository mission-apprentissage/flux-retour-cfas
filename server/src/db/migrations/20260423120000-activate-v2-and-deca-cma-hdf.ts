import { getDatabase } from "@/common/mongodb";

const ETABLISSEMENTS = [
  { siret: "13002374000140", uai: "0623121F" }, // CMA BETHUNE
  { siret: "13002374000157", uai: "0623123H" }, // CMA BOULOGNE
  { siret: "13002374000223", uai: "0596958T" }, // CMA CAUDRY
  { siret: "13002374000314", uai: "0022114M" }, // CMA CHATEAU-THIERRY
  { siret: "13002374000330", uai: "0021496R" }, // CMA LAON
  { siret: "13002374000363", uai: "0602114X" }, // CMA COMPIEGNE
  { siret: "13002374000405", uai: "0594665A" }, // CMA SAINT SAULVE/BRUAY-SUR-ESCAUT
] as const;

const SIRETS = ETABLISSEMENTS.map((e) => e.siret);

export const up = async () => {
  const db = getDatabase();
  const now = new Date();

  const orConditions = ETABLISSEMENTS.map(({ siret, uai }) => ({ siret, uai }));
  const flagResult = await db
    .collection("organismes")
    .updateMany({ $or: orConditions }, { $set: { is_allowed_deca: true, is_allowed_collab: true } });
  console.log(`Organismes flaggés DECA+COLLAB: ${flagResult.matchedCount}/${ETABLISSEMENTS.length}`);

  const organismes = await db
    .collection("organismes")
    .find({ siret: { $in: SIRETS } })
    .project({ _id: 1 })
    .toArray();
  const organismeIds = organismes.map((o) => o._id.toString());

  if (organismeIds.length !== ETABLISSEMENTS.length) {
    console.warn(`Attention: ${organismeIds.length} organismes trouvés sur ${ETABLISSEMENTS.length} attendus`);
  }

  const orgResult = await db.collection("organisations").updateMany(
    {
      type: "ORGANISME_FORMATION",
      organisme_id: { $in: organismeIds },
      ml_beta_activated_at: null,
    },
    { $set: { ml_beta_activated_at: now } }
  );
  console.log(`Organisations v2 CFA activées: ${orgResult.modifiedCount}`);
};

export const down = async () => {
  const db = getDatabase();

  const organismes = await db
    .collection("organismes")
    .find({ siret: { $in: SIRETS } })
    .project({ _id: 1 })
    .toArray();
  const organismeIds = organismes.map((o) => o._id.toString());

  if (organismeIds.length > 0) {
    const orgResult = await db.collection("organisations").updateMany(
      {
        type: "ORGANISME_FORMATION",
        organisme_id: { $in: organismeIds },
      },
      { $unset: { ml_beta_activated_at: "" } }
    );
    console.log(`Organisations désactivées: ${orgResult.modifiedCount}`);
  }

  await db
    .collection("organismes")
    .updateMany({ siret: { $in: SIRETS } }, { $unset: { is_allowed_deca: "", is_allowed_collab: "" } });
};
