import { ObjectId } from "bson";
import { addJob } from "job-processor";
import { generateMissionLocaleEffectifFixture } from "shared/models/fixtures/missionLocaleEffectif.fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { up } from "@/db/migrations/20261019150000-rattrapage-activation-ml";
import { useMongo } from "@tests/jest/setupMongo";

vi.mock("job-processor", () => ({ addJob: vi.fn() }));

useMongo();

const RATTRAPAGE = new Date("2022-01-01T00:00:00.000Z");
const DEJA_ACTIVEE = new Date("2025-09-11T00:00:00.000Z");

const insertMl = (fields: Record<string, unknown> = {}) => {
  const _id = new ObjectId();
  return organisationsDb()
    .insertOne(
      {
        _id,
        type: "MISSION_LOCALE",
        nom: "ML",
        ml_id: Math.floor(Math.random() * 1e6),
        created_at: new Date(),
        ...fields,
      } as never,
      { bypassDocumentValidation: true }
    )
    .then(() => _id);
};

const insertUser = (organisationId: ObjectId, account_status: string) =>
  usersMigrationDb().insertOne(
    {
      _id: new ObjectId(),
      email: `${new ObjectId()}@example.com`,
      organisation_id: organisationId,
      account_status,
    } as never,
    { bypassDocumentValidation: true }
  );

describe("migration rattrapage-activation-ml", () => {
  beforeEach(() => vi.mocked(addJob).mockClear());

  it("date au 01/01/2022 les seules ML qui ont un compte confirmé sans date d'activation, dossiers compris", async () => {
    const active = await insertMl();
    await insertUser(active, "CONFIRMED");
    const enAttente = await insertMl();
    await insertUser(enAttente, "PENDING_ADMIN_VALIDATION");
    const datee = await insertMl({ activated_at: DEJA_ACTIVEE });
    await insertUser(datee, "CONFIRMED");
    const dossier = generateMissionLocaleEffectifFixture({
      organisme_id: new ObjectId(),
      created_at: new Date("2026-03-01"),
      mission_locale_id: active,
    });
    await missionLocaleEffectifsDb().insertOne(dossier, { bypassDocumentValidation: true });

    await up();

    const activations = async (id: ObjectId) =>
      ((await organisationsDb().findOne({ _id: id })) as { activated_at?: Date } | null)?.activated_at;
    expect(await activations(active)).toEqual(RATTRAPAGE);
    expect(await activations(enAttente)).toBeUndefined();
    expect(await activations(datee)).toEqual(DEJA_ACTIVEE);
    const dossierApres = await missionLocaleEffectifsDb().findOne({ _id: dossier._id });
    expect(dossierApres?.computed?.mission_locale?.activated_at).toEqual(RATTRAPAGE);
    expect(addJob).toHaveBeenCalledWith({ name: "hydrate:daily-mission-locale-stats", queued: true });
  });

  it("ne relance pas les stats quand aucune ML n'est concernée", async () => {
    await up();

    expect(addJob).not.toHaveBeenCalled();
  });
});
