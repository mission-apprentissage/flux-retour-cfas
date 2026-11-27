import { ObjectId } from "mongodb";
import { describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { up } from "@/db/migrations/20261117120000-rattrapage-recette-clean-db";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const QUEUE_INDEXES = ["id_erp_apprenant", "annee_scolaire", "uai_etablissement", "siret_etablissement"];

const collectionNames = async () => (await getDatabase().listCollections().toArray()).map(({ name }) => name);
const queueIndexNames = async () =>
  (await getDatabase().collection("effectifsQueue").listIndexes().toArray()).map(({ name }) => name);

describe("migration rattrapage-recette-clean-db", () => {
  it("date les sessions, supprime les collections v2 et les index morts de la queue", async () => {
    const db = getDatabase();
    const sessionId = new ObjectId();
    await db.collection("jwtSessions").insertOne({ _id: sessionId, jwt: "jeton" }, { bypassDocumentValidation: true });
    await db.createCollection("organismeV2");
    await db.createCollection("transmissionV2");
    for (const name of QUEUE_INDEXES) {
      await db.collection("effectifsQueue").createIndex({ [name]: 1 }, { name });
    }

    await up(db);

    const session = await db.collection("jwtSessions").findOne({ _id: sessionId });
    expect(session?.created_at).toEqual(sessionId.getTimestamp());
    expect(await collectionNames()).not.toEqual(expect.arrayContaining(["organismeV2"]));
    expect(await collectionNames()).not.toEqual(expect.arrayContaining(["transmissionV2"]));
    for (const name of QUEUE_INDEXES) {
      expect(await queueIndexNames()).not.toContain(name);
    }
  });

  it("garde les sessions datées et l'index source, et peut être rejouée", async () => {
    const db = getDatabase();
    const createdAt = new Date("2026-11-01T00:00:00Z");
    const sessionId = new ObjectId();
    await db.collection("jwtSessions").insertOne({ _id: sessionId, jwt: "jeton", created_at: createdAt });
    await db.collection("effectifsQueue").createIndex({ source: 1 }, { name: "source" });

    await up(db);
    await up(db);

    expect((await db.collection("jwtSessions").findOne({ _id: sessionId }))?.created_at).toEqual(createdAt);
    expect(await queueIndexNames()).toContain("source");
  });
});
