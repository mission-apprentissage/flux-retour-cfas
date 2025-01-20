import { captureException } from "@sentry/node";
import { Collection, WithId } from "mongodb";
import { IEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";

import { getCommune } from "@/common/apis/apiAlternance/apiAlternance";

const updateEffectifWithMissionLocale = async (effectif: WithId<IEffectif | IEffectifDECA>, db: Collection<any>) => {
  const { code_insee, code_postal } = effectif?.apprenant?.adresse || {};
  const codePostalOrCodeInsee = code_insee || code_postal;
  if (!codePostalOrCodeInsee) {
    return null;
  }

  const communeInfo = await getCommune(codePostalOrCodeInsee);
  if (!communeInfo?.mission_locale) {
    return null;
  }

  return db.updateOne(
    { _id: effectif._id },
    { $set: { "apprenant.adresse.mission_locale_id": communeInfo.mission_locale.id } }
  );
};

export const tmpMigrationMissionLocaleEffectif = async (db: Collection<any>) => {
  const processBuffer = async (buffer) => {
    await Promise.allSettled(buffer);
  };

  try {
    const cursor = db.find(
      { "apprenant.adresse.mission_locale_id": { $exists: false } },
      { projection: { "apprenant.adresse.code_insee": 1, "apprenant.adresse.code_postal": 1 } }
    );

    let promiseArray: Array<any> = [];
    for await (const document of cursor) {
      promiseArray.push(
        new Promise((res, rej) => {
          try {
            res(updateEffectifWithMissionLocale(document, db));
          } catch (e) {
            rej(`Échec de la mise à jour du document ${document._id}: ${e}`);
            captureException(e);
            //logger.error(`Échec de la mise à jour du document ${document._id}: ${e}`);
          }
        })
      );

      if (promiseArray.length === 100) {
        await processBuffer(promiseArray);
        promiseArray = [];
      }
    }

    if (promiseArray.length > 0) {
      await processBuffer(promiseArray);
      promiseArray = [];
    }
  } catch (err) {
    captureException(err);
  }
};
