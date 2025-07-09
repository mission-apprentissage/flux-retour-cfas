import { ObjectId } from "bson";

import logger from "@/common/logger";
import { effectifsDb, effectifsDECADb, organismesDb, voeuxAffelnetDb } from "@/common/model/collections";

export const hydrateVoeuxEffectifsRelations = async () => {
  const organismes = await organismesDb().find({}).toArray();
  let foundCount = 0;
  const organismesMap = organismes.reduce((acc, orga) => {
    return orga.uai ? { ...acc, [orga.uai]: orga } : acc;
  }, {});
  const cursor = voeuxAffelnetDb().find({ effectif_id: null });
  const totalFound = await voeuxAffelnetDb().countDocuments({ effectif_id: null });
  while (await cursor.hasNext()) {
    const voeux = await cursor.next();
    const computedAnneeScolaire = [
      `${voeux?.annee_scolaire_rentree}-${voeux?.annee_scolaire_rentree}`,
      `${voeux?.annee_scolaire_rentree}-${Number(voeux?.annee_scolaire_rentree) + 1}`,
    ];

    if (
      voeux?.raw.nom &&
      voeux?.raw.prenom_1 &&
      voeux?.raw.uai_etatblissement_formateur &&
      organismesMap[voeux?.raw.uai_etatblissement_formateur]
    ) {
      const filter = {
        "apprenant.nom": { $regex: `^${voeux?.raw.nom.toLowerCase()}$`, $options: "i" }, // case insensitive search
        "apprenant.prenom": { $regex: `^${voeux?.raw.prenom_1.toLowerCase()}$`, $options: "i" }, // quid des autres prenoms ?
        organisme_id: new ObjectId(organismesMap[voeux?.raw.uai_etatblissement_formateur]._id),
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
  const organismes = await organismesDb().find({}).toArray();
  let foundCount = 0;
  const organismesMap = organismes.reduce((acc, orga) => {
    return orga.uai ? { ...acc, [orga.uai]: orga } : acc;
  }, {});
  const cursor = voeuxAffelnetDb().find({ effectif_deca_id: null });
  const totalFound = await voeuxAffelnetDb().countDocuments({ effectif_deca_id: null });
  while (await cursor.hasNext()) {
    const voeux = await cursor.next();
    const computedAnneeScolaire = [
      `${voeux?.annee_scolaire_rentree}-${voeux?.annee_scolaire_rentree}`,
      `${voeux?.annee_scolaire_rentree}-${Number(voeux?.annee_scolaire_rentree) + 1}`,
    ];

    if (
      voeux?.raw.nom &&
      voeux?.raw.prenom_1 &&
      voeux?.raw.uai_etatblissement_formateur &&
      organismesMap[voeux?.raw.uai_etatblissement_formateur]
    ) {
      const filter = {
        "apprenant.nom": { $regex: `^${voeux?.raw.nom.toLowerCase()}$`, $options: "i" }, // case insensitive search
        "apprenant.prenom": { $regex: `^${voeux?.raw.prenom_1.toLowerCase()}$`, $options: "i" }, // quid des autres prenoms ?
        organisme_id: new ObjectId(organismesMap[voeux?.raw.uai_etatblissement_formateur]._id),
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
