import { ObjectId } from "mongodb";
import { beforeEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/common/mongodb";
import { TARGETS, unsetEffectifLockAndRaw, up } from "@/db/migrations/20261117120500-unset-effectif-lock-raw";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const LOCK = { apprenant: { nom: true }, formation: { cfd: true } };
const RAW = { formation: { cfd: "1234ABCD" } };

const nest = (prefix: string, value: Record<string, unknown>) => (prefix ? { effectif_snapshot: value } : value);

const legacyCount = (collection: string, prefix: string) =>
  getDatabase()
    .collection(collection)
    .countDocuments({ $or: [{ [`${prefix}_raw`]: { $exists: true } }, { [`${prefix}is_lock`]: { $exists: true } }] });

const noms = async (collection: string, prefix: string) =>
  (await getDatabase().collection(collection).find({}).sort({ _id: 1 }).toArray()).map((doc) =>
    prefix ? doc.effectif_snapshot.apprenant.nom : doc.apprenant.nom
  );

const expectCleaned = async () => {
  for (const { collection, prefix } of TARGETS) {
    expect({ collection, restants: await legacyCount(collection, prefix) }).toEqual({ collection, restants: 0 });
    expect(await noms(collection, prefix)).toEqual(["DOE", "DUPONT", "MARTIN"]);
  }
};

describe("migration unset-effectif-lock-raw", () => {
  beforeEach(async () => {
    for (const { collection, prefix } of TARGETS) {
      await getDatabase()
        .collection(collection)
        .insertMany(
          [
            { _id: new ObjectId(), ...nest(prefix, { _raw: RAW, is_lock: LOCK, apprenant: { nom: "DOE" } }) },
            { _id: new ObjectId(), ...nest(prefix, { is_lock: false, apprenant: { nom: "DUPONT" } }) },
            { _id: new ObjectId(), ...nest(prefix, { apprenant: { nom: "MARTIN" } }) },
          ],
          { bypassDocumentValidation: true }
        );
    }
  });

  it("retire _raw et is_lock des effectifs, des archives et des instantanés sans toucher au reste", async () => {
    await up(getDatabase());
    await up(getDatabase());

    await expectCleaned();
  });

  it("traite toutes les pages", async () => {
    await unsetEffectifLockAndRaw(getDatabase(), 1);

    await expectCleaned();
  });
});
