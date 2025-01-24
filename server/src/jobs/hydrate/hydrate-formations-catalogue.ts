import { IncomingMessage } from "node:http";

import axios from "axios";
import { IFormationCatalogue, zFormationCatalogue } from "shared/models/data/formationsCatalogue.model";
import { default as StreamChain } from "stream-chain";
import { default as StreamJson } from "stream-json";
import { default as StreamArrayPick } from "stream-json/streamers/StreamArray.js";

import parentLogger from "@/common/logger";
import { formationsCatalogueDb } from "@/common/model/collections";
import config from "@/config";

const { chain } = StreamChain;
const { parser } = StreamJson;
const { streamArray } = StreamArrayPick;

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
    params: {
      limit: 200_000, // 150k pour tout avoir (91k total, 62k formations publiées)
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
          formationsCatalogueDb()
            .updateOne(
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
            .catch((err) => {
              console.error(JSON.stringify(err));
              logger.error({ err: err }, "insertion formation échouée", formation.cle_ministere_educatif);
            })
        )
      );
    }
    pendingFormations = [];
  }

  return new Promise<void>((resolve, reject) => {
    const pipeline = chain([parser(), streamArray()]);
    res.data.pipe(pipeline);
    pipeline.on("data", ({ value }: { value: unknown }) => {
      pendingFormations.push(zFormationCatalogue.parse(value));
      if (pendingFormations.length === INSERT_BATCH_SIZE) {
        flushPendingFormations();
      }
    });

    pipeline.on("error", (err) => {
      logger.error({ err }, "stream error");
      reject(err);
    });

    pipeline.on("end", async () => {
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
