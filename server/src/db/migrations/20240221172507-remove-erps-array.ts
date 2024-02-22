import { ERPS_BY_ID } from "shared/constants";

import { organismesDb } from "@/common/model/collections";

export const up = async () => {
  // TODO write your migration here.
  // See https://github.com/seppevs/migrate-mongo/#creating-a-new-migration-script
  // Example:
  // await db.collection('albums').updateOne({artist: 'The Beatles'}, {$set: {blacklisted: true}});
  const organismes = await organismesDb().find().toArray();
  for (let i = 0; i < organismes.length; i++) {
    const organisme = organismes[i];
    const erps = organisme.erps;

    if (!erps || !erps.length) {
      continue;
    }
    const uniqueErps = [...new Set(erps.map((item) => item.toLowerCase()))];

    const shouldUpdateErps = uniqueErps.length !== erps.length;
    const validErpId = erps?.find((erp) => ERPS_BY_ID[erp.toLowerCase()]);

    if (validErpId || shouldUpdateErps) {
      await organismesDb().updateOne(
        {
          _id: organisme._id,
        },
        {
          $set: {
            ...(validErpId ? { erp_configured: validErpId } : {}),
            ...(shouldUpdateErps ? { erps: uniqueErps } : {}),
          },
        }
      );

      continue;
    }
  }
};
