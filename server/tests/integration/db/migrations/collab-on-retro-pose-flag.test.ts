import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { getAnneesScolaireListFromDate } from "shared/utils";
import { describe, expect, it } from "vitest";

import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { up } from "@/db/migrations/20260916120000-collab-on-retro-pose-flag";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

useMongo();

const PARTHENAY_DOUBLON_ORGANISATION_ID = new ObjectId("68e69fc89c04f0a8e7505868");

const ANNEE_SCOLAIRE = getAnneesScolaireListFromDate(new Date())[0];

const insertOrganisme = async (overrides: { is_allowed_collab?: boolean } = {}) => {
  const organisme = { _id: new ObjectId(), ...createRandomOrganisme({ siret: "19040492100016" }), ...overrides };
  await organismesDb().insertOne(organisme);
  return organisme;
};

const insertOrganisation = async (organismeId: ObjectId, activatedAt: Date | null, _id = new ObjectId()) => {
  const organisation = {
    _id,
    type: "ORGANISME_FORMATION",
    created_at: new Date(),
    siret: "00000000000000",
    uai: null,
    organisme_id: organismeId.toString(),
    ...(activatedAt ? { ml_beta_activated_at: activatedAt } : {}),
  } as IOrganisation;
  await organisationsDb().insertOne(organisation, { bypassDocumentValidation: true });
  return organisation;
};

const insertDossiers = async (organisme: Awaited<ReturnType<typeof insertOrganisme>>, count: number) => {
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const effectifId = new ObjectId();
    const snapshot = await createSampleEffectif({
      organisme,
      annee_scolaire: ANNEE_SCOLAIRE,
      apprenant: { date_de_naissance: new Date(now.getFullYear() - 20, 0, 1) },
    });
    await missionLocaleEffectifsDb().insertOne({
      _id: new ObjectId(),
      mission_locale_id: new ObjectId(),
      effectif_id: effectifId,
      effectif_snapshot: { ...snapshot, _id: effectifId, organisme_id: organisme._id },
      effectif_snapshot_date: now,
      date_rupture: new Date("2026-01-15"),
      current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date("2026-01-15") },
      created_at: new Date("2026-02-04"),
    } as IMissionLocaleEffectif);
  }
};

describe("migration collab-on-retro-pose-flag", () => {
  it("pose is_allowed_collab et dénormalise computed.organisme sur un organisme avec date ML, sans flag, avec dossiers", async () => {
    const activatedAt = new Date("2025-11-03T10:57:51.346Z");
    const organisme = await insertOrganisme();
    const organisation = await insertOrganisation(organisme._id, activatedAt);
    await insertDossiers(organisme, 3);

    await up();

    const updatedOrganisme = await organismesDb().findOne({ _id: organisme._id });
    expect(updatedOrganisme?.is_allowed_collab).toBe(true);

    const updatedOrganisation = await organisationsDb().findOne({ _id: organisation._id });
    expect(updatedOrganisation).toMatchObject({ ml_beta_activated_at: activatedAt });

    const dossiers = await missionLocaleEffectifsDb()
      .find({ "effectif_snapshot.organisme_id": organisme._id })
      .toArray();
    expect(dossiers).toHaveLength(3);
    for (const dossier of dossiers) {
      expect(dossier.computed?.organisme).toEqual({ is_allowed_collab: true, ml_beta_activated_at: activatedAt });
    }
  });

  it("ignore un organisme avec date ML mais sans aucun dossier ML", async () => {
    const organisme = await insertOrganisme();
    await insertOrganisation(organisme._id, new Date("2025-09-04"));

    await up();

    const updatedOrganisme = await organismesDb().findOne({ _id: organisme._id });
    expect(updatedOrganisme?.is_allowed_collab).toBeUndefined();
  });

  it("laisse inchangé un organisme déjà en Collab ON", async () => {
    const organisme = await insertOrganisme({ is_allowed_collab: true });
    await insertOrganisation(organisme._id, new Date("2025-09-04"));
    await insertDossiers(organisme, 2);

    await up();

    const updatedOrganisme = await organismesDb().findOne({ _id: organisme._id });
    expect(updatedOrganisme?.is_allowed_collab).toBe(true);

    const dossiers = await missionLocaleEffectifsDb()
      .find({ "effectif_snapshot.organisme_id": organisme._id })
      .toArray();
    for (const dossier of dossiers) {
      expect(dossier.computed).toBeUndefined();
    }
  });

  it("ignore un organisme sans date ML", async () => {
    const organisme = await insertOrganisme();
    await insertOrganisation(organisme._id, null);
    await insertDossiers(organisme, 1);

    await up();

    const updatedOrganisme = await organismesDb().findOne({ _id: organisme._id });
    expect(updatedOrganisme?.is_allowed_collab).toBeUndefined();
  });

  it("retire la date ML du doublon Parthenay", async () => {
    const organisme = await insertOrganisme();
    await insertOrganisation(organisme._id, new Date("2026-05-04"), PARTHENAY_DOUBLON_ORGANISATION_ID);

    await up();

    const doublon = await organisationsDb().findOne({ _id: PARTHENAY_DOUBLON_ORGANISATION_ID });
    expect(doublon).not.toBeNull();
    expect(doublon).not.toHaveProperty("ml_beta_activated_at");
    const updatedOrganisme = await organismesDb().findOne({ _id: organisme._id });
    expect(updatedOrganisme?.is_allowed_collab).toBeUndefined();
  });
});
