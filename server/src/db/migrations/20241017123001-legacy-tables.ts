import { addJob } from "job-processor";
import { Db } from "mongodb";

export const up = async (db: Db) => {
  const collectionToRemove = [
    "bal.deca",
    "contratsDeca",
    "deca",
    "decaRaw",
    "jobEvents",
    "organismesSoltea",
    "regions",
    "rome",
    "uaisAcceReferentiel",
  ];

  for (const c of collectionToRemove) {
    await db.dropCollection(c).catch((e) => {
      if (e.code !== 26) {
        throw e;
      }
    });
  }

  await addJob({ name: "computed:update", queued: true });
};
