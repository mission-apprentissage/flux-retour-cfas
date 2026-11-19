import { getPremiereCampagneAffelnetConservee } from "shared/utils/campagnesAffelnet";

import logger from "@/common/logger";
import { voeuxAffelnetDb } from "@/common/model/collections";
import { sleep } from "@/common/utils/asyncUtils";

const TAILLE_LOT = 1000;
const PAUSE_MS = 200;
const WRITE_CONCERN = { w: "majority", wtimeoutMS: 30_000 } as const;

export type ResultatPurgeVoeuxAffelnet = {
  dryRun: boolean;
  premiereCampagneConservee: number;
  parCampagne: Record<string, number>;
};

const supprimerCampagne = async (campagne: string): Promise<number> => {
  let total = 0;
  for (;;) {
    const lot = await voeuxAffelnetDb()
      .find({ annee_scolaire_rentree: campagne }, { projection: { _id: 1 } })
      .limit(TAILLE_LOT)
      .toArray();
    if (lot.length === 0) return total;

    const { deletedCount } = await voeuxAffelnetDb().deleteMany(
      { annee_scolaire_rentree: campagne, _id: { $in: lot.map(({ _id }) => _id) } },
      { writeConcern: WRITE_CONCERN }
    );
    if (deletedCount === 0) return total;
    total += deletedCount;
    await sleep(PAUSE_MS);
  }
};

export const purgerVoeuxAffelnet = async ({
  dryRun = false,
  maintenant = new Date(),
}: { dryRun?: boolean; maintenant?: Date } = {}): Promise<ResultatPurgeVoeuxAffelnet> => {
  const premiereCampagneConservee = getPremiereCampagneAffelnetConservee(maintenant);
  const campagnes = (await voeuxAffelnetDb().distinct("annee_scolaire_rentree"))
    .filter((campagne): campagne is string => typeof campagne === "string" && /^\d{4}$/.test(campagne))
    .filter((campagne) => Number(campagne) < premiereCampagneConservee)
    .sort();

  const resultat: ResultatPurgeVoeuxAffelnet = { dryRun, premiereCampagneConservee, parCampagne: {} };
  for (const campagne of campagnes) {
    resultat.parCampagne[campagne] = dryRun
      ? await voeuxAffelnetDb().countDocuments({ annee_scolaire_rentree: campagne })
      : await supprimerCampagne(campagne);
  }

  logger.info(resultat, dryRun ? "Purge des campagnes Affelnet simulée" : "Purge des campagnes Affelnet terminée");
  return resultat;
};
