import { addJob } from "job-processor";

import { ACTIVATION_RATTRAPAGE_DATE } from "@/common/actions/admin/mission-locale/mission-locale.admin.actions";
import logger from "@/common/logger";
import { missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";

const SANS_DATE = { $or: [{ activated_at: { $exists: false } }, { activated_at: null }] };

/**
 * ML actives (compte confirmé) sans date d'activation : inscrites sur invitation avant que l'inscription ne l'active.
 * On ne rafraîchit pas leurs dossiers : la date, antérieure au service, ne change rien à ce que la ML voit.
 */
export const up = async () => {
  const sansDate = await organisationsDb()
    .find({ type: "MISSION_LOCALE", ...SANS_DATE }, { projection: { _id: 1 } })
    .toArray();
  const actives = await usersMigrationDb().distinct("organisation_id", {
    organisation_id: { $in: sansDate.map((ml) => ml._id) },
    account_status: "CONFIRMED",
  });

  for (const missionLocaleId of actives) {
    await organisationsDb().updateOne(
      { _id: missionLocaleId, type: "MISSION_LOCALE", ...SANS_DATE },
      { $set: { activated_at: ACTIVATION_RATTRAPAGE_DATE } }
    );
    // Des dossiers anciens peuvent ne plus respecter le schéma : la migration ne doit pas échouer pour eux.
    await missionLocaleEffectifsDb().updateMany(
      { mission_locale_id: missionLocaleId },
      { $set: { "computed.mission_locale.activated_at": ACTIVATION_RATTRAPAGE_DATE } },
      { bypassDocumentValidation: true }
    );
  }

  logger.info({ count: actives.length }, "[Migration] ML actives sans date d'activation datées au 01/01/2022");

  if (actives.length > 0) {
    await addJob({ name: "hydrate:daily-mission-locale-stats", queued: true });
  }
};
