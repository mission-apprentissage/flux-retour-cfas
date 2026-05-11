import { ObjectId } from "bson";
import { it, expect, describe, beforeAll, beforeEach } from "vitest";

import { effectifsDb, missionLocaleEffectifsDb, organismesDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { migrateOrphanMlRecordsCrossFamily } from "@/jobs/hydrate/mission-locale/hydrate-mission-locale";
import { createSampleEffectif, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

const ANNEE = "2025-2026";

async function setupFamily() {
  const responsableId = new ObjectId();
  const formateurId = new ObjectId();
  const responsableSiret = "13002374000439";
  const formateurSiret = "13002374000199";

  const responsable = {
    _id: responsableId,
    ...createRandomOrganisme(),
    organismesFormateurs: [{ _id: formateurId, siret: formateurSiret }],
  };
  responsable.siret = responsableSiret;

  const formateur = {
    _id: formateurId,
    ...createRandomOrganisme(),
    organismesResponsables: [{ _id: responsableId, siret: responsableSiret }],
  };
  formateur.siret = formateurSiret;

  await organismesDb().insertMany([responsable as any, formateur as any]);
  return { responsableId, formateurId };
}

async function insertEffectif(
  organismeId: ObjectId,
  apprenant: { nom: string; prenom: string; date_de_naissance: Date },
  updated_at: Date
) {
  const sampleOrganisme = { _id: organismeId, ...createRandomOrganisme() };
  const effectif = {
    _id: new ObjectId(),
    ...(await createSampleEffectif({
      organisme: sampleOrganisme as any,
      annee_scolaire: ANNEE,
      apprenant,
    })),
    organisme_id: organismeId,
    updated_at,
  };
  await effectifsDb().insertOne(effectif as any);
  return effectif;
}

async function insertMlRecord(
  effectif: any,
  organismeId: ObjectId,
  identifiant: { nom: string; prenom: string; date_de_naissance: Date },
  overrides: Record<string, any> = {}
) {
  const mlRecord = {
    _id: new ObjectId(),
    mission_locale_id: new ObjectId(),
    effectif_id: effectif._id,
    effectif_snapshot: { ...effectif, organisme_id: organismeId },
    effectif_snapshot_date: new Date(),
    identifiant_normalise: identifiant,
    soft_deleted: false,
    date_rupture: null,
    created_at: new Date(),
    current_status: { value: null, date: null },
    brevo: { token: null, token_created_at: null },
    ...overrides,
  };
  await missionLocaleEffectifsDb().insertOne(mlRecord as any);
  return mlRecord;
}

describe("migrateOrphanMlRecordsCrossFamily", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
  });

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await effectifsDb().deleteMany({});
    await organismesDb().deleteMany({});
  });

  it("repoint un ml record d'un responsable vers un effectif plus récent sur un formateur de la même famille", async () => {
    const { responsableId, formateurId } = await setupFamily();

    const ddn = new Date("2005-06-15T00:00:00.000Z");
    const identifiant = { nom: "DESCAMPS", prenom: "Lucie", date_de_naissance: ddn };

    const oldEffectif = await insertEffectif(responsableId, identifiant, new Date("2025-09-01"));
    await insertMlRecord(oldEffectif, responsableId, identifiant, {
      situation: "INJOIGNABLE_APRES_RELANCES",
      effectif_snapshot: {
        ...oldEffectif,
        organisme_id: responsableId,
        _computed: { ...(oldEffectif as any)._computed, statut: { en_cours: "RUPTURANT", parcours: [] } },
      },
    });

    const newEffectif = await insertEffectif(formateurId, identifiant, new Date("2026-04-01"));

    const summary = await migrateOrphanMlRecordsCrossFamily();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(1);

    const after = await missionLocaleEffectifsDb().findOne({ "identifiant_normalise.nom": "DESCAMPS" });
    expect(after?.effectif_id?.toString()).toBe(newEffectif._id.toString());
    expect(after?.effectif_snapshot?.organisme_id?.toString?.()).toBe(formateurId.toString());
    expect(after?.situation).toBe("INJOIGNABLE_APRES_RELANCES");
  });

  it("skip un record avec cfa_rupture_declaration (respect de la décision CFA)", async () => {
    const { responsableId, formateurId } = await setupFamily();

    const ddn = new Date("2005-06-15T00:00:00.000Z");
    const identifiant = { nom: "DUPONT", prenom: "Jean", date_de_naissance: ddn };

    const oldEffectif = await insertEffectif(responsableId, identifiant, new Date("2025-09-01"));
    await insertMlRecord(oldEffectif, responsableId, identifiant, {
      cfa_rupture_declaration: {
        date_rupture: new Date("2026-01-15"),
        declared_at: new Date("2026-01-20"),
        declared_by: new ObjectId(),
      },
    });
    await insertEffectif(formateurId, identifiant, new Date("2026-04-01"));

    const summary = await migrateOrphanMlRecordsCrossFamily();

    expect(summary.scanned).toBe(1);
    expect(summary.skippedHasRuptureDeclaration).toBe(1);
    expect(summary.migrated).toBe(0);

    const after = await missionLocaleEffectifsDb().findOne({ "identifiant_normalise.nom": "DUPONT" });
    expect(after?.effectif_id?.toString()).toBe(oldEffectif._id.toString());
  });

  it("skip si déjà rattaché à l'effectif le plus récent (rien à migrer)", async () => {
    const { responsableId, formateurId } = await setupFamily();

    const ddn = new Date("2005-06-15T00:00:00.000Z");
    const identifiant = { nom: "MARTIN", prenom: "Pierre", date_de_naissance: ddn };

    await insertEffectif(responsableId, identifiant, new Date("2025-09-01"));
    const newEffectif = await insertEffectif(formateurId, identifiant, new Date("2026-04-01"));
    await insertMlRecord(newEffectif, formateurId, identifiant);

    const summary = await migrateOrphanMlRecordsCrossFamily();

    expect(summary.scanned).toBe(1);
    expect(summary.skippedAlreadyOnBest).toBe(1);
    expect(summary.migrated).toBe(0);
  });

  it("matche un effectif legacy avec nom non normalisé (Dupont mixed-case) et date local-midnight", async () => {
    // Guard anti-régression : avant refactor cache, filtre Mongo strict ratait les legacy.
    const { responsableId, formateurId } = await setupFamily();

    const ddnNormalized = new Date("2005-06-15T00:00:00.000Z");
    const identifiantNormalized = { nom: "DUPONT", prenom: "Marie", date_de_naissance: ddnNormalized };

    const oldEffectif = await insertEffectif(responsableId, identifiantNormalized, new Date("2025-09-01"));
    await insertMlRecord(oldEffectif, responsableId, identifiantNormalized);

    const sampleOrganisme = { _id: formateurId, ...createRandomOrganisme() };
    const legacyEffectif = {
      _id: new ObjectId(),
      ...(await createSampleEffectif({
        organisme: sampleOrganisme as any,
        annee_scolaire: ANNEE,
        apprenant: {
          nom: "Dupont",
          prenom: "marie",
          date_de_naissance: ddnNormalized,
        },
      })),
      organisme_id: formateurId,
      updated_at: new Date("2026-04-01"),
    };
    await effectifsDb().insertOne(legacyEffectif as any);

    const summary = await migrateOrphanMlRecordsCrossFamily();

    expect(summary.scanned).toBe(1);
    expect(summary.migrated).toBe(1);

    const after = await missionLocaleEffectifsDb().findOne({ "identifiant_normalise.nom": "DUPONT" });
    expect(after?.effectif_id?.toString()).toBe(legacyEffectif._id.toString());
  });

  it("skip si la migration cacherait un rupturant non qualifié (garde-fou migrateMlRecordEffectifId)", async () => {
    const { responsableId, formateurId } = await setupFamily();

    const ddn = new Date("2005-06-15T00:00:00.000Z");
    const identifiant = { nom: "DURAND", prenom: "Marie", date_de_naissance: ddn };

    const oldEffectif = await insertEffectif(responsableId, identifiant, new Date("2025-09-01"));
    await insertMlRecord(oldEffectif, responsableId, identifiant, {
      effectif_snapshot: {
        ...oldEffectif,
        organisme_id: responsableId,
        _computed: { ...(oldEffectif as any)._computed, statut: { en_cours: "RUPTURANT", parcours: [] } },
      },
    });
    await insertEffectif(formateurId, identifiant, new Date("2026-04-01"));

    const summary = await migrateOrphanMlRecordsCrossFamily();

    expect(summary.scanned).toBe(1);
    expect(summary.skippedNonRupturant).toBe(1);
    expect(summary.migrated).toBe(0);

    const after = await missionLocaleEffectifsDb().findOne({ "identifiant_normalise.nom": "DURAND" });
    expect(after?.effectif_id?.toString()).toBe(oldEffectif._id.toString());
  });
});
