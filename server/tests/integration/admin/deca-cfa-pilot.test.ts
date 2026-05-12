import { ObjectId } from "bson";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import { IOrganisme } from "shared/models/data/organismes.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { beforeAll, describe, expect, it } from "vitest";

import {
  activateDecaCfaPilotBatch,
  deactivateDecaCfaPilotBatch,
} from "@/common/actions/organismes/organismes.admin.actions";
import { effectifsDb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { getDatabase } from "@/common/mongodb";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

// Relax validation on missionLocaleEffectifs to allow minimal fixtures (snapshot shape is heavy).
beforeAll(async () => {
  await getDatabase().command({
    collMod: "missionLocaleEffectif",
    validationAction: "warn",
  });
});

const ADMIN_USER_ID = "admin-user-id";

const [currentAnnee] = getActiveAnneesScolaires(new Date());

type Seed = {
  siret: string;
  uai: string;
  nature?: IOrganisme["nature"];
  is_allowed_deca?: boolean;
  mlBetaActivatedAt?: Date;
  insertOrganisation?: boolean;
  insertEffectif?: boolean;
  insertMlEffectif?: boolean;
};

async function seedOrganisme(s: Seed): Promise<{ id: ObjectId; organisationId?: ObjectId }> {
  const id = new ObjectId();
  const base = generateOrganismeFixture({
    _id: id,
    siret: s.siret,
    uai: s.uai,
    nature: s.nature ?? NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
  });
  if (s.is_allowed_deca) (base as any).is_allowed_deca = true;
  await organismesDb().insertOne(base, { bypassDocumentValidation: true });

  let organisationId: ObjectId | undefined;
  if (s.insertOrganisation !== false) {
    organisationId = new ObjectId();
    const org: any = {
      _id: organisationId,
      type: "ORGANISME_FORMATION",
      siret: s.siret,
      uai: s.uai,
      organisme_id: id.toHexString(),
      created_at: new Date(),
    };
    if (s.mlBetaActivatedAt) org.ml_beta_activated_at = s.mlBetaActivatedAt;
    await organisationsDb().insertOne(org, { bypassDocumentValidation: true });
  }

  if (s.insertEffectif !== false) {
    await effectifsDb().insertOne({ _id: new ObjectId(), organisme_id: id, annee_scolaire: currentAnnee } as any, {
      bypassDocumentValidation: true,
    });
  }

  if (s.insertMlEffectif) {
    await missionLocaleEffectifsDb().insertOne(
      {
        _id: new ObjectId(),
        effectif_id: new ObjectId(),
        effectif_snapshot: { organisme_id: id },
      } as any,
      { bypassDocumentValidation: true }
    );
  }

  return { id, organisationId };
}

describe("activateDecaCfaPilotBatch", () => {
  it("returns counts and items in input order, preserves duplicates as a single processing", async () => {
    const eligible = await seedOrganisme({ siret: "10000000000001", uai: "0010001A" });
    const alreadyActive = await seedOrganisme({
      siret: "20000000000002",
      uai: "0020002B",
      is_allowed_deca: true,
      mlBetaActivatedAt: new Date("2026-01-15"),
    });
    const notEligible = await seedOrganisme({
      siret: "30000000000003",
      uai: "0030003C",
      nature: NATURE_ORGANISME_DE_FORMATION.RESPONSABLE,
    });

    const items = [
      { siret: "10000000000001", uai: "0010001A" },
      { siret: "20000000000002", uai: "0020002B" },
      { siret: "30000000000003", uai: "0030003C" },
      { siret: "99999999999999", uai: "0009999Z" }, // not_found
      { siret: "10000000000001", uai: "0010001A" }, // duplicate
    ];

    const result = await activateDecaCfaPilotBatch(items, ADMIN_USER_ID);

    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(4); // deduped
    expect(result.items[0]).toMatchObject({ status: "activated", organismeId: eligible.id.toHexString() });
    expect(result.items[1]).toMatchObject({ status: "already_active", organismeId: alreadyActive.id.toHexString() });
    expect(result.items[2]).toMatchObject({ status: "not_eligible", organismeId: notEligible.id.toHexString() });
    expect(result.items[3]).toMatchObject({ status: "not_found" });
    expect(result.counts).toEqual({ activated: 1, already_active: 1, not_eligible: 1, not_found: 1 });
  });

  it("propagates flags + ml_beta_activated_at + computed missionLocaleEffectif", async () => {
    const { id } = await seedOrganisme({
      siret: "10000000000004",
      uai: "0010004D",
      insertMlEffectif: true,
    });

    const before = await activateDecaCfaPilotBatch([{ siret: "10000000000004", uai: "0010004D" }], ADMIN_USER_ID);
    expect(before.items[0].status).toBe("activated");

    const organisme = await organismesDb().findOne({ _id: id });
    expect(organisme?.is_allowed_deca).toBe(true);
    expect((organisme as any)?.is_allowed_collab).toBe(true);

    const organisation = await organisationsDb().findOne({ organisme_id: id.toHexString() });
    expect((organisation as any)?.ml_beta_activated_at).toBeInstanceOf(Date);

    const mlEffectif = await missionLocaleEffectifsDb().findOne({ "effectif_snapshot.organisme_id": id });
    expect((mlEffectif as any)?.computed?.organisme?.ml_beta_activated_at).toBeInstanceOf(Date);
  });

  it("preserves the initial ml_beta_activated_at on replay", async () => {
    const initialDate = new Date("2026-01-15T10:00:00.000Z");
    const { id } = await seedOrganisme({
      siret: "10000000000005",
      uai: "0010005E",
      mlBetaActivatedAt: initialDate,
      insertMlEffectif: true,
    });
    // organisme not yet flagged
    const result = await activateDecaCfaPilotBatch([{ siret: "10000000000005", uai: "0010005E" }], ADMIN_USER_ID);
    expect(result.items[0].status).toBe("already_active");
    expect(result.items[0].mlBetaActivatedAt).toEqual(initialDate);

    const organisation = await organisationsDb().findOne({ organisme_id: id.toHexString() });
    expect((organisation as any)?.ml_beta_activated_at).toEqual(initialDate);

    const mlEffectif = await missionLocaleEffectifsDb().findOne({ "effectif_snapshot.organisme_id": id });
    expect((mlEffectif as any)?.computed?.organisme?.ml_beta_activated_at).toEqual(initialDate);
  });
});

describe("deactivateDecaCfaPilotBatch", () => {
  it("unsets flags, ml_beta_activated_at, and computed missionLocaleEffectif (symétrique)", async () => {
    const { id } = await seedOrganisme({
      siret: "10000000000006",
      uai: "0010006F",
      insertMlEffectif: true,
    });
    await activateDecaCfaPilotBatch([{ siret: "10000000000006", uai: "0010006F" }], ADMIN_USER_ID);

    const result = await deactivateDecaCfaPilotBatch([{ siret: "10000000000006", uai: "0010006F" }], ADMIN_USER_ID);
    expect(result.items[0].status).toBe("deactivated");
    expect(result.counts).toEqual({ deactivated: 1 });

    const organisme = await organismesDb().findOne({ _id: id });
    expect((organisme as any)?.is_allowed_deca).toBeUndefined();
    expect((organisme as any)?.is_allowed_collab).toBeUndefined();

    const organisation = await organisationsDb().findOne({ organisme_id: id.toHexString() });
    expect((organisation as any)?.ml_beta_activated_at).toBeUndefined();

    const mlEffectif = await missionLocaleEffectifsDb().findOne({ "effectif_snapshot.organisme_id": id });
    expect((mlEffectif as any)?.computed?.organisme?.ml_beta_activated_at).toBeUndefined();
  });

  it("returns not_active when the organisme is not flagged, and not_found for unknown siret/uai", async () => {
    await seedOrganisme({ siret: "10000000000007", uai: "0010007G" });
    const result = await deactivateDecaCfaPilotBatch(
      [
        { siret: "10000000000007", uai: "0010007G" },
        { siret: "99999999999999", uai: "0009999Z" },
      ],
      ADMIN_USER_ID
    );
    expect(result.items[0].status).toBe("not_active");
    expect(result.items[1].status).toBe("not_found");
    expect(result.counts).toEqual({ not_active: 1, not_found: 1 });
  });

  it("supports full cycle activate → deactivate → activate (idempotent)", async () => {
    const { id } = await seedOrganisme({
      siret: "10000000000008",
      uai: "0010008H",
    });
    const r1 = await activateDecaCfaPilotBatch([{ siret: "10000000000008", uai: "0010008H" }], ADMIN_USER_ID);
    expect(r1.items[0].status).toBe("activated");
    const firstDate = (r1.items[0] as any).mlBetaActivatedAt as Date;

    const r2 = await deactivateDecaCfaPilotBatch([{ siret: "10000000000008", uai: "0010008H" }], ADMIN_USER_ID);
    expect(r2.items[0].status).toBe("deactivated");

    const r3 = await activateDecaCfaPilotBatch([{ siret: "10000000000008", uai: "0010008H" }], ADMIN_USER_ID);
    // re-activation : ml_beta_activated_at was unset, so this is a fresh activation
    expect(r3.items[0].status).toBe("activated");

    const organisme = await organismesDb().findOne({ _id: id });
    expect((organisme as any)?.is_allowed_deca).toBe(true);
    expect((r3.items[0] as any).mlBetaActivatedAt).not.toEqual(firstDate);
  });
});
