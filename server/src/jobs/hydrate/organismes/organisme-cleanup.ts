import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants";

import {
  effectifsDb,
  effectifsDECADb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";

export async function cleanupOrganismes() {
  const cursor = organismesDb().find({
    effectifs_count: 0,
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.ABSENT,
    api_key: null,
  });

  for await (const organisme of cursor) {
    const organisation = await organisationsDb().findOne({
      type: "ORGANISME_FORMATION",
      organisme_id: organisme._id.toString(),
    });

    const [userCount, effectifCount, decaCount] = await Promise.all([
      organisation === null ? 0 : usersMigrationDb().countDocuments({ organisation_id: organisation._id }),
      effectifsDb().countDocuments({ organisme_id: organisme._id }),
      effectifsDECADb().countDocuments({ organisme_id: organisme._id }),
    ]);

    if (userCount === 0 && effectifCount === 0 && decaCount === 0) {
      if (organisation !== null) {
        await organisationsDb().deleteOne({ _id: organisation._id });
      }
      await organismesDb().deleteOne({ _id: organisme._id });
    }
  }
}
