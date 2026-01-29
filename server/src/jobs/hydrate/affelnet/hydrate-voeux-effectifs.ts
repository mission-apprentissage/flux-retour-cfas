import { captureException } from "@sentry/node";
import { ObjectId } from "mongodb";
import { getAcademieById } from "shared/constants";

import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb, voeuxAffelnetDb } from "@/common/model/collections";

export const hydrateVoeuxEffectifsRelations = async () => {
  let foundCount = 0;

  const cursor = voeuxAffelnetDb().find();
  const totalFound = await voeuxAffelnetDb().countDocuments();

  while (await cursor.hasNext()) {
    const voeux = await cursor.next();
    const computedAnneeScolaire = [
      `${voeux?.annee_scolaire_rentree}-${voeux?.annee_scolaire_rentree}`,
      `${voeux?.annee_scolaire_rentree}-${Number(voeux?.annee_scolaire_rentree) + 1}`,
    ];

    if (voeux?.raw.nom && voeux?.raw.prenom_1 && voeux.organisme_formateur_id) {
      const filter = {
        "apprenant.nom": { $regex: `^${voeux?.raw.nom.toLowerCase()}$`, $options: "i" }, // case insensitive search
        "apprenant.prenom": { $regex: `^${voeux?.raw.prenom_1.toLowerCase()}$`, $options: "i" }, // quid des autres prenoms ?
        organisme_id: voeux.organisme_formateur_id,
        annee_scolaire: {
          $in: computedAnneeScolaire,
        },
      };

      const effectif = await effectifsDb().findOne(filter);

      if (effectif) {
        foundCount++;
        await voeuxAffelnetDb().updateOne({ _id: voeux?._id }, { $set: { effectif_id: effectif._id } });
      }
    }
  }
  logger.info(` ${foundCount} voeux trouvés sur un total de ${totalFound} voeux`);
};

export const hydrateVoeuxEffectifsDECARelations = async () => {
  let foundCount = 0;

  const cursor = voeuxAffelnetDb().find();
  const totalFound = await voeuxAffelnetDb().countDocuments();

  while (await cursor.hasNext()) {
    const voeux = await cursor.next();
    const computedAnneeScolaire = [
      `${voeux?.annee_scolaire_rentree}-${voeux?.annee_scolaire_rentree}`,
      `${voeux?.annee_scolaire_rentree}-${Number(voeux?.annee_scolaire_rentree) + 1}`,
    ];

    if (voeux?.raw.nom && voeux?.raw.prenom_1 && voeux.organisme_formateur_id) {
      const filter = {
        "apprenant.nom": { $regex: `^${voeux?.raw.nom.toLowerCase()}$`, $options: "i" }, // case insensitive search
        "apprenant.prenom": { $regex: `^${voeux?.raw.prenom_1.toLowerCase()}$`, $options: "i" }, // quid des autres prenoms ?
        organisme_id: voeux.organisme_formateur_id,
        annee_scolaire: {
          $in: computedAnneeScolaire,
        },
      };

      const effectif = await effectifsDECADb().findOne(filter);

      if (effectif) {
        foundCount++;
        await voeuxAffelnetDb().updateOne({ _id: voeux?._id }, { $set: { effectif_deca_id: effectif._id } });
      }
    }
  }
  logger.info(` ${foundCount} voeux trouvés sur un total de ${totalFound} voeux`);
};

export const hydrateAcademieInVoeux = async () => {
  const INSERT_BATCH_SIZE = 1_000;
  let batch: Array<{ _id: ObjectId; academie_code?: string }> = [];

  const cursor = voeuxAffelnetDb().find({ academie_code: { $exists: false } });

  const processBatch = (currentBatch: Array<{ _id: ObjectId; academie_code?: string }>) => {
    if (currentBatch.length === 0) {
      return;
    }

    try {
      const mapped = currentBatch.map(({ _id, academie_code }) => ({
        updateOne: {
          filter: { _id },
          update: {
            $set: {
              academie_code,
            },
          },
        },
      }));

      return voeuxAffelnetDb().bulkWrite(mapped);
    } catch (e) {
      captureException(e);
    }
  };

  while (await cursor.hasNext()) {
    const voeu = await cursor.next();
    if (!voeu?.raw?.academie) {
      continue;
    }
    const code = getAcademieById(voeu.raw.academie)?.code;

    if (!code) {
      continue;
    }

    batch.push({
      _id: voeu._id,
      academie_code: code,
    });

    if (batch.length === INSERT_BATCH_SIZE) {
      await processBatch(batch);
      batch = [];
    }
  }

  while (await cursor.hasNext()) {
    const voeu = await cursor.next();
    if (voeu?.raw?.academie) {
      const code = getAcademieById(voeu.raw.academie)?.code;
      await voeuxAffelnetDb().updateOne({ _id: voeu._id }, { $set: { academie_code: code } });
    }
  }

  await processBatch(batch);
};
