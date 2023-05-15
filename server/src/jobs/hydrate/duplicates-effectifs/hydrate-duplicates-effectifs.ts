import { PromisePool } from "@supercharge/promise-pool";

import {
  buildEffectifsDuplicatesForOrganismeId,
  getOrganismesHavingDuplicatesEffectifs,
} from "@/common/actions/effectifs/effectifs.duplicates.actions";
import logger from "@/common/logger";
import { effectifsDuplicatesGroupDb } from "@/common/model/collections";

export const hydrateDuplicatesEffectifs = async () => {
  logger.info(`Clear des groupes doublons d'effectifs`);
  await effectifsDuplicatesGroupDb().deleteMany({});

  const organismesWithDuplicates = await getOrganismesHavingDuplicatesEffectifs();
  logger.info(`Remplissage des doublons d'effectifs pour ${organismesWithDuplicates.length} organismes`);

  await PromisePool.for(organismesWithDuplicates).process(async ({ _id }) => {
    await buildEffectifsDuplicatesForOrganismeId(_id);
  });
};
