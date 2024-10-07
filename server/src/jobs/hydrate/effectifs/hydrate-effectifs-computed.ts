import { TETE_DE_RESEAUX } from "shared/constants";
import { IRncp } from "shared/models";

import {
  updateEffectifComputedFromOrganisme,
  updateEffectifComputedFromRNCP,
} from "@/common/actions/effectifs.actions";
import { findOpcoByName, findRNCPByOpcosId } from "@/common/actions/opcos/opcos.actions";
import { getFicheRNCPById } from "@/common/actions/rncp.actions";
import logger from "@/common/logger";
import { effectifsDb, organismesDb } from "@/common/model/collections";

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

export const hydrateEffectifsComputedOpcos = async (opcoName: string) => {
  const opco = await findOpcoByName(opcoName);

  if (!opco) {
    logger.error(`Opco with name ${opcoName} not found`);
    return;
  }
  const opcos = await findRNCPByOpcosId(opco._id.toString());

  for (let i = 0; i < opcos.length; i++) {
    const { rncp_id } = opcos[i];
    const rncp: IRncp | null = await getFicheRNCPById(rncp_id);

    if (!rncp) {
      logger.error(`RNCP with id ${rncp_id} not found`);
      continue;
    }
    logger.info(`Updating computed for rncp : ${rncp.rncp}, ${i + 1}/${opcos.length}`);
    await updateEffectifComputedFromRNCP(rncp, opco);
  }
};
