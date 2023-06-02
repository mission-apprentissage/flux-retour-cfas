import { WithId } from "mongodb";

import parentLogger from "@/common/logger";
import { bassinsEmploiDb, organismesDb } from "@/common/model/collections";

const logger = parentLogger.child({
  module: "job:hydrate:organismes-bassinEmploi",
});

/**
 * Ce job peuple le champ organisme.adresse.bassinEmploi selon organisme.adresse.code_insee et la collection bassinsEmploi
 */
export const hydrateOrganismesBassinEmploi = async () => {
  logger.info("hydrating");
  const bassinsEmploi = await bassinsEmploiDb().find({}).toArray();

  const bassinEmploiByCodeCommune = bassinsEmploi.reduce((acc, bassinEmploi) => {
    acc[bassinEmploi.code_commune] = bassinEmploi.code_zone_emploi;
    return acc;
  }, {});

  const organismesCursor = organismesDb().find<{ code_insee: string }>(
    {
      "adresse.code_insee": {
        $exists: true,
      },
    },
    { projection: { code_insee: "$adresse.code_insee" } }
  );
  while (await organismesCursor.hasNext()) {
    const organisme = (await organismesCursor.next()) as WithId<{ code_insee: string }>;

    await organismesDb().updateOne(
      { _id: organisme._id },
      {
        $set: {
          "adresse.bassinEmploi": bassinEmploiByCodeCommune[organisme.code_insee] ?? "",
        },
      }
    );
  }
};
