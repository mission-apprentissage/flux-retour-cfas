import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20260605130000-drop-dead-effectifsqueue-indexes";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const queueIndexNames = async () =>
  (await getDatabase().collection("effectifsQueue").listIndexes().toArray()).map(({ name }) => name);

describe("migration drop-dead-effectifsqueue-indexes", () => {
  const dropQueueIndexes = () => getDatabase().collection("effectifsQueue").dropIndexes();
  beforeEach(dropQueueIndexes);
  afterEach(dropQueueIndexes);

  it("supprime les 5 index morts et garde ceux de l'ingestion et des jobs FICHIER", async () => {
    const queue = getDatabase().collection("effectifsQueue");
    await queue.createIndex({ nir_apprenant: 1 });
    await queue.createIndex({ id_erp_apprenant: 1 }, { name: "id_erp_apprenant" });
    await queue.createIndex({ siret_etablissement: 1 }, { name: "siret_etablissement" });
    await queue.createIndex({ uai_etablissement: 1 }, { name: "uai_etablissement" });
    await queue.createIndex({ annee_scolaire: 1 }, { name: "annee_scolaire" });
    await queue.createIndex({ processed_at: 1, created_at: 1 });
    await queue.createIndex({ source: 1 }, { name: "source" });

    await up(getDatabase());
    await up(getDatabase());

    expect((await queueIndexNames()).sort()).toEqual(["_id_", "processed_at_1_created_at_1", "source"]);
  });
});
