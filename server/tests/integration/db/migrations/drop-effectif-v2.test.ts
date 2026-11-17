import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261117120200-drop-effectif-v2";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const hasEffectifV2 = async () =>
  (await getDatabase().listCollections({ name: "effectifV2" }, { nameOnly: true }).toArray()).length > 0;

describe("migration drop-effectif-v2", () => {
  it("supprime la collection effectifV2", async () => {
    await getDatabase()
      .collection("effectifV2")
      .insertOne({ id_erp: ["1"] });

    await up(getDatabase());

    expect(await hasEffectifV2()).toBe(false);
  });

  it("passe sans erreur quand la collection n'existe pas", async () => {
    await expect(up(getDatabase())).resolves.toBeUndefined();
    expect(await hasEffectifV2()).toBe(false);
  });
});
