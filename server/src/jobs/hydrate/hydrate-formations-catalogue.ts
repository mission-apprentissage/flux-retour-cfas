import { IncomingMessage } from "node:http";

import axios from "axios";
import JSONStream from "JSONStream";
import { ObjectId } from "mongodb";
import { IFormationCatalogue } from "shared/models/data/formationsCatalogue.model";

import parentLogger from "@/common/logger";
import { formationsCatalogueDb } from "@/common/model/collections";
import { WithStringId } from "@/common/model/types";
import config from "@/config";

const logger = parentLogger.child({
  module: "job:hydrate:formations-catalogue",
});

const INSERT_BATCH_SIZE = 100;

/**
 * Ce job récupère toutes les formations du catalogue et les insert en brut dans la collection formationsCatalogue
 * en vue d'une future utilisation.
 */
export const hydrateFormationsCatalogue = async () => {
  logger.info("récupération des formations depuis le catalogue");
  const res = await axios.get<IncomingMessage>(`${config.mnaCatalogApi.endpoint}/v1/entity/formations.json`, {
    responseType: "stream",
    // headers: {
    //   "accept-encoding": "gzip", // malheureusement inutile car pas géré par l'API catalogue...
    // },
    params: {
      limit: 150_000, // 150k pour tout avoir (91k total, 62k formations publiées)
      query: {
        catalogue_published: true,
      },
    },
  });

  const queriesInProgress: Promise<any>[] = [];
  let totalFormations = 0;
  let pendingFormations: IFormationCatalogue[] = [];

  function flushPendingFormations() {
    totalFormations += pendingFormations.length;
    logger.debug({ count: pendingFormations.length }, "insert formations");
    if (pendingFormations.length > 0) {
      queriesInProgress.push(
        ...pendingFormations.map(({ _id, ...formation }) =>
          formationsCatalogueDb().updateOne(
            {
              cle_ministere_educatif: formation.cle_ministere_educatif,
            },
            {
              $set: formation,
              $setOnInsert: { _id },
            },
            {
              upsert: true,
            }
          )
        )
      );
    }
    pendingFormations = [];
  }

  return new Promise<void>((resolve, reject) => {
    const parser = JSONStream.parse("*");
    res.data.pipe(parser);
    parser.on("data", (formation: WithStringId<IFormationCatalogue>) => {
      pendingFormations.push({
        ...formation,
        _id: new ObjectId(formation._id),
      });
      if (pendingFormations.length === INSERT_BATCH_SIZE) {
        flushPendingFormations();
      }
    });

    parser.on("error", (err) => {
      logger.error({ err }, "stream error");
      reject(err);
    });

    parser.on("end", async () => {
      try {
        flushPendingFormations();
        await Promise.all(queriesInProgress);
        logger.info({ count: totalFormations }, "insertions terminées");
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  });
};
