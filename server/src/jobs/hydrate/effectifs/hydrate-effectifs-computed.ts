import { TETE_DE_RESEAUX } from "shared/constants";

import {
  updateEffectifComputedFromOrganisme,
  updateEffectifComputedFromRNCP,
} from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, organismesDb, rncpDb } from "@/common/model/collections";

export async function hydrateEffectifsComputed() {
  logger.info("Hydrating effectifs._computed...");
  while (
    (await effectifsDb()
      .aggregate(
        [
          {
            $lookup: {
              from: "organismes",
              localField: "organisme_id",
              foreignField: "_id",
              as: "_organisme",
            },
          },
          {
            $lookup: {
              from: "rncp",
              localField: "formation.rncp",
              foreignField: "rncp",
              as: "_rncp",
            },
          },
          {
            $addFields: {
              _computed: {
                organisme: {
                  region: { $first: "$_organisme.adresse.region" },
                  departement: { $first: "$_organisme.adresse.departement" },
                  academie: { $first: "$_organisme.adresse.academie" },
                  reseaux: { $first: "$_organisme.reseaux" },
                  uai: { $first: "$_organisme.uai" },
                  siret: { $first: "$_organisme.siret" },
                  bassinEmploi: { $first: "$_organisme.adresse.bassinEmploi" },
                  fiable: { $cond: [{ $eq: [{ $first: "$_organisme.fiabilisation_statut" }, "FIABLE"] }, true, false] },
                },
                formation: {
                  codes_rome: { $ifNull: [{ $first: "$_rncp.romes" }, []] },
                  opcos: { $first: "$_rncp.opcos" },
                },
              },
            },
          },
          {
            $project: {
              _organisme: 0,
              _rncp: 0,
            },
          },
          {
            $merge: {
              into: "effectifs",
              on: "_id",
              whenMatched: "replace",
              whenNotMatched: "discard",
            },
          },
        ],
        {
          bypassDocumentValidation: true,
        }
      )
      .next()) !== null
  ) {
    //
  }
}

export const hydrateEffectifsComputedOpcos = async () => {
  logger.info("Starting: hydrateEffectifsComputedOpcos");
  const rncps = await rncpDb().find().toArray();
  let percent = 0;
  for (let i = 0; i < rncps.length; i++) {
    const rncp = rncps[i];
    await updateEffectifComputedFromRNCP(rncp._id);
    const newPercent = Math.floor((i / rncps.length) * 100);
    if (percent !== newPercent) {
      percent = newPercent;
      logger.info(`Progress: ${percent}%`);
    }
  }
  logger.info("Leaving: hydrateEffectifsComputedOpcos");
};

export const hydrateEffectifsComputedReseaux = async () => {
  logger.info("Starting: hydrateEffectifsComputedReseaux");
  for (const { key } of TETE_DE_RESEAUX) {
    logger.info("Updating computed for reseau : ", key);
    const organismes = await organismesDb()
      .find(
        { reseaux: key },
        {
          projection: {
            _id: 1,
          },
        }
      )
      .toArray();

    for (let i = 0; i < organismes.length; i++) {
      const organisme = organismes[i];
      await updateEffectifComputedFromOrganisme(organisme._id);
    }
  }
  logger.info("Leaving: hydrateEffectifsComputedReseaux");
};
