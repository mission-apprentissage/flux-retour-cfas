import logger from "@/common/logger";
import { effectifsDb } from "@/common/model/collections";

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
                },
              },
            },
          },
          {
            $project: {
              _organisme: 0,
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
