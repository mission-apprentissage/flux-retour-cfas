import { describe, expect, it } from "vitest";

import { usersMigrationDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { up } from "@/db/migrations/20261110140000-recree-index-texte-users-migration";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const indexTexte = async () => (await usersMigrationDb().indexes()).find((index) => index.key._fts === "text");

describe("migration recree-index-texte-users-migration", () => {
  it("remplace l'ancien index texte par celui du modèle", async () => {
    await usersMigrationDb().dropIndexes();
    await usersMigrationDb().createIndex({ email: "text", nom: "text", prenom: "text" });
    expect((await indexTexte())?.name).toBe("email_text_nom_text_prenom_text");

    await up();

    const index = await indexTexte();
    expect(index?.name).toBe("nom_prenom_email_fonction");
    expect(index?.weights).toHaveProperty("fonction");
    expect(index?.default_language).toBe("french");
  });

  it("est sans effet quand le bon index est déjà en place", async () => {
    await usersMigrationDb().dropIndexes();
    await createIndexes();

    await up();

    expect((await indexTexte())?.name).toBe("nom_prenom_email_fonction");
    await expect(createIndexes()).resolves.toBeUndefined();
  });
});
