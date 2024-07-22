import { TETE_DE_RESEAUX } from "shared/constants";

import { updateEffectifComputedFromOrganisme } from "@/common/actions/effectifs.actions";
import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

import { OPCOS } from "../hydrate-organismes-opcos";

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
  for (const opco of OPCOS) {
    logger.info("Updating computed for opcos : ", opco);
    const organismes = await organismesDb()
      .find(
        { opcos: opco },
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
