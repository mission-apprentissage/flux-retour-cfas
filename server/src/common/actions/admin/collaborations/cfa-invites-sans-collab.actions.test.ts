import { ObjectId } from "bson";
import type { IMissionLocaleEffectif } from "shared/models";
import type { IMissionLocaleCfaInvitation } from "shared/models/data/missionLocaleCfaInvitations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import { describe, expect, it } from "vitest";

import { missionLocaleCfaInvitationsDb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getCfaInvitesSansCollab, listCfaInvitesSansCollab } from "./cfa-invites-sans-collab.actions";

useMongo();

const ML_A = new ObjectId();
const ML_B = new ObjectId();

let siretCounter = 10000000000000;

const insertOrganisme = async (overrides: Partial<IOrganisme> = {}) => {
  const _id = new ObjectId();
  await organismesDb().insertOne(
    {
      _id,
      siret: `${++siretCounter}`,
      nom: "CFA Test",
      adresse: { code_postal: "75001", commune: "Paris", complete: "1 rue de Rivoli 75001 Paris" },
      ...overrides,
    } as IOrganisme,
    { bypassDocumentValidation: true }
  );
  return _id;
};

const insertInvitation = async (organismeId: ObjectId, missionLocaleId: ObjectId, createdAt: Date) => {
  const organisme = await organismesDb().findOne({ _id: organismeId });
  await missionLocaleCfaInvitationsDb().insertOne({
    _id: new ObjectId(),
    mission_locale_id: missionLocaleId,
    author_id: new ObjectId(),
    organisme_id: organismeId,
    organisation_id: new ObjectId(),
    siret: organisme?.siret ?? "00000000000000",
    uai: "0751234A",
    destinataires: [],
    created_at: createdAt,
  } as IMissionLocaleCfaInvitation);
};

const insertCollab = async (organismeId: ObjectId, softDeleted = false, reponseAt?: Date) => {
  await missionLocaleEffectifsDb().insertOne(
    {
      _id: new ObjectId(),
      mission_locale_id: ML_A,
      effectif_id: new ObjectId(),
      created_at: new Date(),
      effectif_snapshot: { organisme_id: organismeId },
      organisme_data: {
        acc_conjoint: true,
        has_unread_notification: false,
        ...(reponseAt ? { reponse_at: reponseAt } : {}),
      },
      ...(softDeleted ? { soft_deleted: true } : {}),
    } as unknown as IMissionLocaleEffectif,
    { bypassDocumentValidation: true }
  );
};

const defaultQuery = { page: 1, limit: 10, sort_by: "invitations" as const, sort_order: "desc" as const };

describe("getCfaInvitesSansCollab", () => {
  it("regroupe les envois par CFA et compte les ML distinctes", async () => {
    const cfa = await insertOrganisme({ nom: "CFA Deux Fois" });
    await insertInvitation(cfa, ML_A, new Date("2026-09-01"));
    await insertInvitation(cfa, ML_A, new Date("2026-09-05"));
    await insertInvitation(cfa, ML_B, new Date("2026-09-03"));

    const result = await getCfaInvitesSansCollab(defaultQuery);

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      organisme_id: cfa.toString(),
      raison_sociale: "CFA Deux Fois",
      uai: "0751234A",
      adresse: { code_postal: "75001", commune: "Paris", complete: "1 rue de Rivoli 75001 Paris" },
      invitations_recues: 3,
      ml_invitantes: 2,
      derniere_invitation_at: new Date("2026-09-05"),
    });
  });

  it("exclut un CFA ayant au moins une collaboration non supprimée, garde celui dont la collab est soft-deleted", async () => {
    const avecCollab = await insertOrganisme({ nom: "CFA Avec Collab" });
    const collabSupprimee = await insertOrganisme({ nom: "CFA Collab Supprimée" });
    await insertInvitation(avecCollab, ML_A, new Date("2026-09-01"));
    await insertInvitation(collabSupprimee, ML_A, new Date("2026-09-01"));
    await insertCollab(avecCollab);
    await insertCollab(collabSupprimee, true);

    const result = await getCfaInvitesSansCollab(defaultQuery);

    expect(result.data.map((row) => row.raison_sociale)).toEqual(["CFA Collab Supprimée"]);
  });

  it("trie et pagine", async () => {
    const un = await insertOrganisme({ nom: "Un", adresse: { code_postal: "13001", commune: "Marseille" } as never });
    const trois = await insertOrganisme({ nom: "Trois", adresse: { code_postal: "69001", commune: "Lyon" } as never });
    const deux = await insertOrganisme({
      nom: "Deux",
      adresse: { code_postal: "33000", commune: "Bordeaux" } as never,
    });
    await insertInvitation(un, ML_A, new Date("2026-09-01"));
    for (let i = 0; i < 3; i++) await insertInvitation(trois, ML_A, new Date(`2026-09-0${i + 1}`));
    for (let i = 0; i < 2; i++) await insertInvitation(deux, ML_B, new Date(`2026-09-0${i + 1}`));

    const byInvitations = await getCfaInvitesSansCollab(defaultQuery);
    expect(byInvitations.data.map((row) => row.raison_sociale)).toEqual(["Trois", "Deux", "Un"]);

    const byLocalisation = await getCfaInvitesSansCollab({
      ...defaultQuery,
      sort_by: "localisation",
      sort_order: "asc",
    });
    expect(byLocalisation.data.map((row) => row.adresse?.code_postal)).toEqual(["13001", "33000", "69001"]);

    const page2 = await getCfaInvitesSansCollab({ ...defaultQuery, page: 2, limit: 10 });
    expect(page2.total).toBe(3);
    expect(page2.pagination).toEqual({ page: 2, limit: 10, total_pages: 1 });
    expect(page2.data).toEqual([]);
  });

  it("restreint aux CFA ouverts du référentiel sur le territoire et ignore les collaborations antérieures au cutoff", async () => {
    const idf = { code_postal: "75001", commune: "Paris", region: "11" };
    const referentiel = { est_dans_le_referentiel: "present" } as const;
    const sansCollab = await insertOrganisme({ nom: "Sans collab", adresse: idf, has_account: true, ...referentiel });
    const autreRegion = await insertOrganisme({
      nom: "Autre région",
      adresse: { commune: "Lyon", region: "84" },
      ...referentiel,
    });
    const collabAncienne = await insertOrganisme({ nom: "Collab 2025", adresse: idf, ...referentiel });
    const collabRecente = await insertOrganisme({ nom: "Collab 2026", adresse: idf, ...referentiel });
    const ferme = await insertOrganisme({ nom: "Fermé", adresse: idf, ferme: true, ...referentiel });
    const horsReferentiel = await insertOrganisme({ nom: "Hors référentiel", adresse: idf });
    for (const id of [sansCollab, autreRegion, collabAncienne, collabRecente, ferme, horsReferentiel]) {
      await insertInvitation(id, ML_A, new Date("2026-02-01"));
    }
    await insertCollab(collabAncienne, false, new Date("2025-11-15"));
    await insertCollab(collabRecente, false, new Date("2026-03-01"));

    const options = { territoire: { regions: ["11"] }, collaborationsDepuis: new Date("2026-01-01") };
    const result = await getCfaInvitesSansCollab({ ...defaultQuery, sort_by: "nom", sort_order: "asc" }, options);
    expect(result.total).toBe(2);
    expect(result.data.map((row) => [row.raison_sociale, row.has_account])).toEqual([
      ["Collab 2025", false],
      ["Sans collab", true],
    ]);

    const sansOptions = await getCfaInvitesSansCollab(defaultQuery);
    expect(sansOptions.data.map((row) => row.raison_sociale).sort()).toEqual([
      "Autre région",
      "Fermé",
      "Hors référentiel",
      "Sans collab",
    ]);

    const all = await listCfaInvitesSansCollab({ sort_by: "compte", sort_order: "desc" }, options);
    expect(all.map((row) => row.raison_sociale)).toEqual(["Sans collab", "Collab 2025"]);
  });
});
