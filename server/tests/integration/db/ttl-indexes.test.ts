import auditLogsDescriptor from "shared/models/data/auditLogs.model";
import telechargementListesNomLogsDescriptor from "shared/models/data/telechargementListesNomLogs.model";
import { describe, expect, it } from "vitest";

import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { getDbCollection } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const SIX_MOIS = 183 * 24 * 3600;

const ttlIndex = async (collectionName: string, name: string) => {
  const indexes = await getDbCollection(collectionName).listIndexes().toArray();
  const index = indexes.find((i) => i.name === name);
  return index && { key: index.key, expireAfterSeconds: index.expireAfterSeconds };
};

describe("index TTL de rétention", () => {
  it.each([
    { descriptor: auditLogsDescriptor, name: "ttl_date", key: { date: 1 }, expireAfterSeconds: SIX_MOIS },
    {
      descriptor: telechargementListesNomLogsDescriptor,
      name: "ttl_telechargement_date",
      key: { telechargement_date: 1 },
      expireAfterSeconds: SIX_MOIS,
    },
  ])("$name", async ({ descriptor, name, key, expireAfterSeconds }) => {
    await createCollectionIndexes(descriptor);

    expect(await ttlIndex(descriptor.collectionName, name)).toEqual({ key, expireAfterSeconds });
  });
});
