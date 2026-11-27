import { describe, expect, it, vi } from "vitest";

import { getDbCollection } from "@/common/mongodb";
import { captureTiered } from "@/common/services/sentry/alertContract";
import { useMongo } from "@tests/jest/setupMongo";

import { createCollectionIndexes } from "./createCollectionIndexes";

vi.mock("@/common/services/sentry/alertContract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/sentry/alertContract")>()),
  captureTiered: vi.fn(),
}));

useMongo();

describe("createCollectionIndexes()", () => {
  it("alerte en jour quand un index ne se crée pas", async () => {
    await getDbCollection("indexesEnConflit").createIndex({ date: 1 }, { name: "date_1" });

    await createCollectionIndexes({
      collectionName: "indexesEnConflit",
      indexes: [[{ date: 1 }, { name: "ttl_date", expireAfterSeconds: 60 }]],
    });

    expect(captureTiered).toHaveBeenCalledWith(expect.any(Error), {
      tier: "jour",
      errorKind: "db",
      fingerprintKey: "indexes:indexesEnConflit",
    });
  });
});
