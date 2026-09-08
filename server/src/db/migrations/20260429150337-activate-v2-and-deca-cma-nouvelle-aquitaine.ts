import logger from "@/common/logger";
import { getDatabase } from "@/common/mongodb";

const ETABLISSEMENTS = [
  { siret: "13002792300049", uai: "0161230A" }, // CMA BARBEZIEUX
  { siret: "13002792300056", uai: "0161229Z" }, // CMA COGNAC
  { siret: "13002792300171", uai: "0331707B" }, // CMA BORDEAUX BEL'IMA - ISFORA
  { siret: "13002792300189", uai: "0333205E" }, // CMA BORDEAUX INSAV
  { siret: "13002792300205", uai: "0400100S" }, // CMA MONT-DE-MARSAN
  { siret: "13002792300221", uai: "0470110P" }, // CMA AGEN
  { siret: "13002792300270", uai: "0641519D" }, // CMA BAYONNE
  { siret: "13002792300338", uai: "0791217U" }, // CMA PARTHENAY
  { siret: "13002792300353", uai: "0860841X" }, // CMA SAINT-BENOIT
  { siret: "13002792300379", uai: "0870773T" }, // CMA LIMOGES (LE MOULIN RABAUD)
  { siret: "13002374000272", uai: "0597044L" }, // CMA ROUVIGNIES
  { siret: "13002374000504", uai: "0597346P" }, // CMA TRITH-SAINT-LEGER
  { siret: "88930797100040", uai: "0782058N" }, // ESVM Rambouillet
  { siret: "88930797100073", uai: "0951721E" }, // ESVM Enghien
  { siret: "88930797100081", uai: "0952262T" }, // ESVM Pontoise
  { siret: "88931074400020", uai: "0951798N" }, // ESIEE IT Pontoise
] as const;

const SIRETS = ETABLISSEMENTS.map((e) => e.siret);

export const up = async () => {
  const db = getDatabase();
  const now = new Date();

  const orConditions = ETABLISSEMENTS.map(({ siret, uai }) => ({ siret, uai }));
  const flagResult = await db
    .collection("organismes")
    .updateMany({ $or: orConditions }, { $set: { is_allowed_deca: true, is_allowed_collab: true } });
  logger.info(
    { matchedCount: flagResult.matchedCount, expectedCount: ETABLISSEMENTS.length },
    "[Migration] Organismes flaggés DECA+COLLAB"
  );

  const organismes = await db
    .collection("organismes")
    .find({ siret: { $in: SIRETS } })
    .project({ _id: 1 })
    .toArray();
  const organismeIds = organismes.map((o) => o._id.toString());

  if (organismeIds.length !== ETABLISSEMENTS.length) {
    logger.warn(
      { foundCount: organismeIds.length, expectedCount: ETABLISSEMENTS.length },
      "[Migration] Nombre d'organismes trouvés différent de celui attendu"
    );
  }

  const orgResult = await db.collection("organisations").updateMany(
    {
      type: "ORGANISME_FORMATION",
      organisme_id: { $in: organismeIds },
      ml_beta_activated_at: null,
    },
    { $set: { ml_beta_activated_at: now } }
  );
  logger.info({ modifiedCount: orgResult.modifiedCount }, "[Migration] Organisations v2 CFA activées");
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
    logger.info({ modifiedCount: orgResult.modifiedCount }, "[Migration] Organisations désactivées");
  }

  await db
    .collection("organismes")
    .updateMany({ siret: { $in: SIRETS } }, { $unset: { is_allowed_deca: "", is_allowed_collab: "" } });
};
