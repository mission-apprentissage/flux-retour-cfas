import { ObjectId } from "bson";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeAll, beforeEach } from "vitest";

import {
  effectifsDb,
  effectifsDECADb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
} from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { migrateOrphanMlRecordsDecaToErp } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

const ML_OBJECTID = new ObjectId();
const ORG_ID = new ObjectId();
const ANNEE = "2025-2026";

describe("migrateOrphanMlRecordsDecaToErp", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
  });

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await missionLocaleEffectifsLogDb().deleteMany({});
    await effectifsDb().deleteMany({});
    await effectifsDECADb().deleteMany({});
  });

  const seedDecaWithOrphanMlRecord = async (overrides: {
    nom: string;
    prenom: string;
    ddn: Date;
    mlId?: number;
    organismeId?: ObjectId;
  }) => {
    const orgId = overrides.organismeId ?? ORG_ID;
    const sampleOrganisme = { _id: orgId, ...createRandomOrganisme() };
    const decaEffectif = {
      _id: new ObjectId(),
      deca_raw_id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: overrides.nom,
          prenom: overrides.prenom,
          date_de_naissance: overrides.ddn,
          adresse: { mission_locale_id: overrides.mlId ?? 100 },
        },
        source: "DECA" as any,
      })),
      organisme_id: orgId,
    };
    await effectifsDECADb().insertOne(decaEffectif as any);

    const mlRecord = {
      _id: new ObjectId(),
      mission_locale_id: ML_OBJECTID,
      effectif_id: decaEffectif._id,
      effectif_snapshot: { ...decaEffectif, organisme_id: orgId },
      effectif_snapshot_date: new Date(),
      identifiant_normalise: { nom: overrides.nom, prenom: overrides.prenom, date_de_naissance: overrides.ddn },
      date_rupture: null,
      created_at: new Date(),
      current_status: { value: null, date: null },
      brevo: { token: null, token_created_at: null },
      soft_deleted: false,
    };
    await missionLocaleEffectifsDb().insertOne(mlRecord as any);

    return { decaEffectif, mlRecord, sampleOrganisme };
  };

  it("repointe le ml record vers l'ERP twin quand il existe", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { decaEffectif, mlRecord, sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "VILLENEUVE",
      prenom: "Téo",
      ddn,
    });

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "VILLENEUVE",
          prenom: "Téo",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(1);

    const after = await missionLocaleEffectifsDb().findOne({ _id: mlRecord._id });
    expect(after?.effectif_id.toString()).toBe(erpEffectif._id.toString());
    expect(after?.effectif_snapshot?._id?.toString?.()).toBe(erpEffectif._id.toString());

    const decaAfter = await effectifsDECADb().findOne({ _id: decaEffectif._id });
    expect(decaAfter).toBeTruthy();
  });

  it("ne fait rien si pas d'ERP twin", async () => {
    await seedDecaWithOrphanMlRecord({
      nom: "DUPONT",
      prenom: "Jean",
      ddn: new Date("2005-01-01T00:00:00Z"),
    });

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(0);
    expect(summary.skippedNoErpTwin).toBe(1);
  });

  it("skip si le ml_id de l'adresse diffère entre DECA et ERP", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "MARTIN",
      prenom: "Marie",
      ddn,
      mlId: 100,
    });

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "MARTIN",
          prenom: "Marie",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 200 }, // ML différent
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.migrated).toBe(0);
    expect(summary.skippedMlIdMismatch).toBe(1);
  });

  it("matche un ERP twin avec casse différente (Villeneuve vs VILLENEUVE) et date avec heure", async () => {
    const ddnNormalized = new Date("2005-06-15T00:00:00Z");
    const ddnRaw = new Date("2005-06-15T08:30:00Z");
    const { mlRecord, sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "VILLENEUVE",
      prenom: "Téo",
      ddn: ddnNormalized,
    });

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "Villeneuve",
          prenom: "TÉO",
          date_de_naissance: ddnRaw,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(1);

    const after = await missionLocaleEffectifsDb().findOne({ _id: mlRecord._id });
    expect(after?.effectif_id.toString()).toBe(erpEffectif._id.toString());
  });

  it("skip si nom+ddn matchent mais prénom diffère", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "DUPONT",
      prenom: "Marie",
      ddn,
    });

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "DUPONT",
          prenom: "Sophie",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(0);
    expect(summary.skippedPrenomMismatch).toBe(1);
  });

  it("homonyme : 2 ERP même nom+ddn dans le même organisme → choisit celui dont le prénom matche", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { mlRecord, sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "DUPONT",
      prenom: "Marie",
      ddn,
    });

    const erpHomonym = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "DUPONT", prenom: "Sophie", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
      })),
    };
    const erpRight = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "DUPONT", prenom: "Marie", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
      })),
    };
    await effectifsDb().insertMany([erpHomonym, erpRight] as any[]);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.migrated).toBe(1);
    expect(summary.skippedPrenomMismatch).toBe(0);
    const after = await missionLocaleEffectifsDb().findOne({ _id: mlRecord._id });
    expect(after?.effectif_id.toString()).toBe(erpRight._id.toString());
  });

  it("multi-organismes : migre chaque ml record vers son ERP twin local sans fuite cross-org", async () => {
    const ddn1 = new Date("2005-06-15T00:00:00Z");
    const ddn2 = new Date("2006-03-10T00:00:00Z");
    const orgA = new ObjectId();
    const orgB = new ObjectId();

    const { mlRecord: mlA, sampleOrganisme: sampleA } = await seedDecaWithOrphanMlRecord({
      nom: "MARTIN",
      prenom: "Lucie",
      ddn: ddn1,
      organismeId: orgA,
    });
    const { mlRecord: mlB, sampleOrganisme: sampleB } = await seedDecaWithOrphanMlRecord({
      nom: "BERNARD",
      prenom: "Paul",
      ddn: ddn2,
      organismeId: orgB,
    });

    const erpA = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleA,
        annee_scolaire: ANNEE,
        apprenant: { nom: "Martin", prenom: "Lucie", date_de_naissance: ddn1, adresse: { mission_locale_id: 100 } },
      })),
    };
    const erpB = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleB,
        annee_scolaire: ANNEE,
        apprenant: { nom: "Bernard", prenom: "Paul", date_de_naissance: ddn2, adresse: { mission_locale_id: 100 } },
      })),
    };
    const erpDecoy = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleB,
        annee_scolaire: ANNEE,
        apprenant: { nom: "Martin", prenom: "Lucie", date_de_naissance: ddn1, adresse: { mission_locale_id: 100 } },
      })),
    };
    await effectifsDb().insertMany([erpA, erpB, erpDecoy] as any[]);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(2);
    expect(summary.migrated).toBe(2);

    const afterA = await missionLocaleEffectifsDb().findOne({ _id: mlA._id });
    const afterB = await missionLocaleEffectifsDb().findOne({ _id: mlB._id });
    expect(afterA?.effectif_id.toString()).toBe(erpA._id.toString());
    expect(afterB?.effectif_id.toString()).toBe(erpB._id.toString());
  });

  it("Option A : skip migration si l'ERP cible n'est plus RUPTURANT et orphan non qualifié", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const orgId = new ObjectId();
    const sampleOrganisme = { _id: orgId, ...createRandomOrganisme() };

    // Orphan DECA snapshot RUPTURANT (avec _computed.statut.en_cours forcé).
    const decaEffectif = {
      _id: new ObjectId(),
      deca_raw_id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "DUPONT", prenom: "Lucas", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
        source: "DECA" as any,
      })),
      organisme_id: orgId,
    };
    await effectifsDECADb().insertOne(decaEffectif as any);

    const orphanId = new ObjectId();
    await missionLocaleEffectifsDb().insertOne({
      _id: orphanId,
      mission_locale_id: ML_OBJECTID,
      effectif_id: decaEffectif._id,
      effectif_snapshot: {
        ...decaEffectif,
        organisme_id: orgId,
        _computed: { ...decaEffectif._computed, statut: { en_cours: "RUPTURANT", parcours: [] } },
      },
      effectif_snapshot_date: new Date(),
      identifiant_normalise: { nom: "DUPONT", prenom: "Lucas", date_de_naissance: ddn },
      date_rupture: new Date("2025-12-01"),
      created_at: new Date(),
      current_status: { value: "RUPTURANT", date: new Date("2025-12-01") },
      brevo: { token: null, token_created_at: null },
      soft_deleted: false,
      situation: null,
      cfa_rupture_declaration: null,
    } as any);

    // ERP twin non-RUPTURANT (ex: APPRENTI, le contrat a repris).
    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "DUPONT", prenom: "Lucas", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
      })),
    };
    erpEffectif._computed = {
      ...erpEffectif._computed,
      statut: { en_cours: "APPRENTI", parcours: [] },
    } as any;
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.skippedNonRupturant).toBe(1);
    expect(summary.migrated).toBe(0);
    expect(summary.mergedIntoSquatter).toBe(0);

    // Orphan reste tel quel : effectif_id DECA, snapshot DECA-RUPTURANT.
    const after = await missionLocaleEffectifsDb().findOne({ _id: orphanId });
    expect(after?.effectif_id.toString()).toBe(decaEffectif._id.toString());
    expect(after?.effectif_snapshot?._computed?.statut?.en_cours).toBe("RUPTURANT");
  });

  it("Option A : migre quand même si l'orphan a une situation conseiller (visibilité préservée par Option B)", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const orgId = new ObjectId();
    const sampleOrganisme = { _id: orgId, ...createRandomOrganisme() };

    const decaEffectif = {
      _id: new ObjectId(),
      deca_raw_id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "MARTIN", prenom: "Léa", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
        source: "DECA" as any,
      })),
      organisme_id: orgId,
    };
    await effectifsDECADb().insertOne(decaEffectif as any);

    const orphanId = new ObjectId();
    await missionLocaleEffectifsDb().insertOne({
      _id: orphanId,
      mission_locale_id: ML_OBJECTID,
      effectif_id: decaEffectif._id,
      effectif_snapshot: {
        ...decaEffectif,
        organisme_id: orgId,
        _computed: { ...decaEffectif._computed, statut: { en_cours: "RUPTURANT", parcours: [] } },
      },
      effectif_snapshot_date: new Date(),
      identifiant_normalise: { nom: "MARTIN", prenom: "Léa", date_de_naissance: ddn },
      date_rupture: new Date("2025-12-01"),
      created_at: new Date(),
      current_status: { value: "RUPTURANT", date: new Date("2025-12-01") },
      brevo: { token: null, token_created_at: null },
      soft_deleted: false,
      situation: SITUATION_ENUM.RDV_PRIS, // conseiller a déjà qualifié → Option B garde la visibilité
      cfa_rupture_declaration: null,
    } as any);

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: { nom: "MARTIN", prenom: "Léa", date_de_naissance: ddn, adresse: { mission_locale_id: 100 } },
      })),
    };
    erpEffectif._computed = {
      ...erpEffectif._computed,
      statut: { en_cours: "FIN_DE_FORMATION", parcours: [] },
    } as any;
    await effectifsDb().insertOne(erpEffectif as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.skippedNonRupturant).toBe(0);
    expect(summary.migrated).toBe(1);

    const after = await missionLocaleEffectifsDb().findOne({ _id: orphanId });
    expect(after?.effectif_id.toString()).toBe(erpEffectif._id.toString());
    // La situation conseiller est préservée → Option B la garde visible côté stats/listes.
    expect(after?.situation).toBe(SITUATION_ENUM.RDV_PRIS);
  });

  it("squatter ERP soft-deleted : ressuscite, merge orphan, préserve logs et brevo.history", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { mlRecord: orphanMlRecord, sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "LEROY",
      prenom: "Clarisse",
      ddn,
    });

    // Donner un brevo.token + des données métier à l'orphan DECA pour vérifier qu'on les préserve.
    const orphanToken = "orphan-token-uuid";
    await missionLocaleEffectifsDb().updateOne(
      { _id: orphanMlRecord._id },
      {
        $set: {
          "brevo.token": orphanToken,
          "brevo.token_created_at": new Date("2025-01-01"),
          situation: SITUATION_ENUM.RDV_PRIS,
          commentaires: "données métier orphan à préserver",
        },
      }
    );

    // Log historique attaché à l'orphan : doit être réassigné au keeper.
    const orphanLogId = new ObjectId();
    await missionLocaleEffectifsLogDb().insertOne({
      _id: orphanLogId,
      mission_locale_effectif_id: orphanMlRecord._id,
      created_at: new Date(),
      created_by: new ObjectId(),
      read_by: [],
      situation: "RDV_PRIS",
    } as any);

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "LEROY",
          prenom: "Clarisse",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    // Squatter ERP soft-deleted occupant déjà (ml, erpEffectif._id) — bloquerait $set effectif_id sans le squatter handler.
    const squatterId = new ObjectId();
    const squatterToken = "squatter-token-uuid";
    await missionLocaleEffectifsDb().insertOne({
      _id: squatterId,
      mission_locale_id: ML_OBJECTID,
      effectif_id: erpEffectif._id,
      effectif_snapshot: { ...erpEffectif, organisme_id: sampleOrganisme._id },
      effectif_snapshot_date: new Date(),
      identifiant_normalise: undefined, // unset par un ancien soft-delete
      date_rupture: null,
      created_at: new Date(),
      current_status: { value: null, date: null },
      brevo: { token: squatterToken, token_created_at: new Date("2024-01-01") },
      soft_deleted: true,
    } as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(0);
    expect(summary.mergedIntoSquatter).toBe(1);

    // Squatter ressuscité, snapshot rafraîchi vers ERP, données métier de l'orphan mergées.
    const squatterAfter = await missionLocaleEffectifsDb().findOne({ _id: squatterId });
    expect(squatterAfter?.soft_deleted).toBe(false);
    expect(squatterAfter?.effectif_id.toString()).toBe(erpEffectif._id.toString());
    expect(squatterAfter?.effectif_snapshot?._id?.toString?.()).toBe(erpEffectif._id.toString());
    expect(squatterAfter?.situation).toBe("RDV_PRIS");
    expect(squatterAfter?.commentaires).toBe("données métier orphan à préserver");
    // identifiant_normalise backfillé depuis l'orphan (squatter n'en avait pas).
    expect(squatterAfter?.identifiant_normalise?.nom).toBe("LEROY");

    // brevo.token courant conservé sur le squatter, token de l'orphan archivé en history.
    expect(squatterAfter?.brevo?.token).toBe(squatterToken);
    expect(squatterAfter?.brevo?.history?.some((h) => h.token === orphanToken)).toBe(true);

    // Orphan soft-deleted, identifiant_normalise unset.
    const orphanAfter = await missionLocaleEffectifsDb().findOne({ _id: orphanMlRecord._id });
    expect(orphanAfter?.soft_deleted).toBe(true);
    expect(orphanAfter?.identifiant_normalise).toBeUndefined();

    // Log réassigné au squatter.
    const logAfter = await missionLocaleEffectifsLogDb().findOne({ _id: orphanLogId });
    expect(logAfter?.mission_locale_effectif_id?.toString()).toBe(squatterId.toString());
  });

  it("squatter ERP actif (cas hypothétique) : merge orphan dedans, pas d'E11000", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { mlRecord: orphanMlRecord, sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "BENEJEAN",
      prenom: "Louise",
      ddn,
    });

    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "BENEJEAN",
          prenom: "Louise",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    // Squatter actif (anomalie : sans identifiant_normalise — ne devrait pas exister mais on teste la défense).
    const squatterId = new ObjectId();
    await missionLocaleEffectifsDb().insertOne({
      _id: squatterId,
      mission_locale_id: ML_OBJECTID,
      effectif_id: erpEffectif._id,
      effectif_snapshot: { ...erpEffectif, organisme_id: sampleOrganisme._id },
      effectif_snapshot_date: new Date(),
      date_rupture: null,
      created_at: new Date(),
      current_status: { value: null, date: null },
      brevo: { token: "active-squatter", token_created_at: new Date() },
      soft_deleted: false,
    } as any);

    const summary = await migrateOrphanMlRecordsDecaToErp();

    expect(summary.scanned).toBe(1);
    expect(summary.mergedIntoSquatter).toBe(1);
    expect(summary.migrated).toBe(0);

    const squatterAfter = await missionLocaleEffectifsDb().findOne({ _id: squatterId });
    expect(squatterAfter?.soft_deleted).toBe(false);

    const orphanAfter = await missionLocaleEffectifsDb().findOne({ _id: orphanMlRecord._id });
    expect(orphanAfter?.soft_deleted).toBe(true);
  });

  it("est idempotent : un second run sur même état ne migre pas à nouveau", async () => {
    const ddn = new Date("2005-06-15T00:00:00Z");
    const { sampleOrganisme } = await seedDecaWithOrphanMlRecord({
      nom: "DURAND",
      prenom: "Lucas",
      ddn,
    });
    const erpEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "DURAND",
          prenom: "Lucas",
          date_de_naissance: ddn,
          adresse: { mission_locale_id: 100 },
        },
      })),
    };
    await effectifsDb().insertOne(erpEffectif as any);

    const first = await migrateOrphanMlRecordsDecaToErp();
    expect(first.migrated).toBe(1);

    const second = await migrateOrphanMlRecordsDecaToErp();
    expect(second.scanned).toBe(0);
    expect(second.migrated).toBe(0);
  });
});
