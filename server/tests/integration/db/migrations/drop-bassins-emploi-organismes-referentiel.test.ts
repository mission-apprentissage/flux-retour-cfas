import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261117120100-drop-bassins-emploi-organismes-referentiel";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const collectionNames = async () => (await getDatabase().listCollections().toArray()).map(({ name }) => name);

describe("migration drop-bassins-emploi-organismes-referentiel", () => {
  it("supprime les deux collections si elles existent", async () => {
    const db = getDatabase();
    await db.collection("bassinsEmploi").insertOne({ code: "1" });
    await db.collection("organismesReferentiel").insertOne({ uai: "1" });

    await up(db);

    const names = await collectionNames();
    expect(names).not.toContain("bassinsEmploi");
    expect(names).not.toContain("organismesReferentiel");
  });

  it("passe sans erreur quand elles n'existent pas", async () => {
    await expect(up(getDatabase())).resolves.toBeUndefined();
  });
});
