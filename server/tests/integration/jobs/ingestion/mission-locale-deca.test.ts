import { ObjectId } from "bson";
import { MongoServerError } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeAll, beforeEach, vi } from "vitest";

import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import * as collectionsModule from "@/common/model/collections";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

const mockScoreEffectifs = vi.fn().mockResolvedValue({ model: "2026-03-16", scores: [0.5] });

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/services/classifier/classifier")>();
  return {
    ...actual,
    scoreEffectifs: (...args: unknown[]) => mockScoreEffectifs(...args),
  };
});

const UAI = "0802004U";
const SIRET = "77937827200016";
const ML_ID = 609;

const createBaseDecaEffectif = (overrides: Partial<IEffectifDECA> = {}): IEffectifDECA => {
  const now = new Date();
  const dateNaissance = new Date(now.getFullYear() - 20, 0, 1);
  const dateRupture = new Date("2025-12-01");
  const dateFinContrat = new Date("2026-06-30");
  const dateFinFormation = new Date("2026-06-30");

  return {
    _id: new ObjectId(),
    deca_raw_id: new ObjectId(),
    organisme_id: new ObjectId(),
    id_erp_apprenant: "test-erp-id",
    source: "DECA",
    annee_scolaire: "2025-2026",
    apprenant: {
      nom: "DUPONT",
      prenom: "Jean",
      date_de_naissance: dateNaissance,
      telephone: "0612345678",
      courriel: "jean.dupont@example.com",
      historique_statut: [],
      has_nir: false,
      adresse: {
        code_postal: "75001",
        mission_locale_id: ML_ID,
      },
    },
    formation: {
      cfd: "50022137",
      rncp: "RNCP12345",
      periode: [2025, 2026],
      date_fin: dateFinFormation,
    },
    contrats: [
      {
        siret: "12345678901234",
        date_debut: new Date("2025-09-01"),
        date_fin: dateFinContrat,
        date_rupture: dateRupture,
      },
    ],
    _computed: {
      organisme: {
        uai: UAI,
        siret: SIRET,
        region: "11",
      },
      statut: {
        en_cours: STATUT_APPRENANT.RUPTURANT,
        parcours: [
          { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
          { date: dateRupture, valeur: STATUT_APPRENANT.RUPTURANT },
        ],
      },
    },
    is_deca_compatible: true,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as IEffectifDECA;
};

describe("Filtrage DECA pour les snapshots Mission Locale", () => {
  useMongo();

  beforeAll(async () => {
    await createIndexes();
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-12-15T10:00:00Z"));

    await organismesDb().insertOne({
      _id: new ObjectId(),
      ...createRandomOrganisme({ uai: UAI, siret: SIRET }),
    });

    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "MISSION_LOCALE",
      nom: "MA MISSION LOCALE",
      created_at: new Date(),
      ml_id: ML_ID,
      email: "",
      telephone: "",
      site_web: "",
    });

    return () => {
      vi.useRealTimers();
    };
  });

  describe("createMissionLocaleSnapshot - filtres DECA", () => {
    it("Accepte un effectif DECA valide avec tous les critères requis", async () => {
      const effectif = createBaseDecaEffectif();
      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).not.toBeNull();
      expect(result?.upserted).toBe(true);

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).not.toBeNull();
    });

    it("Rejette un effectif DECA avec date_rupture avant le 01/11/2025", async () => {
      const effectif = createBaseDecaEffectif({
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2025-10-15"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-10-15"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Rejette un effectif DECA avec date_rupture >= date_fin_contrat", async () => {
      const effectif = createBaseDecaEffectif({
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2026-07-01"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2026-07-01"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Rejette un effectif DECA sans contact (ni téléphone ni email)", async () => {
      const effectif = createBaseDecaEffectif({
        apprenant: {
          nom: "DUPONT",
          prenom: "Jean",
          date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
          telephone: null,
          courriel: null,
          historique_statut: [],
          has_nir: false,
          adresse: {
            code_postal: "75001",
            mission_locale_id: ML_ID,
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Rejette un effectif DECA sans RNCP", async () => {
      const effectif = createBaseDecaEffectif({
        formation: {
          cfd: "50022137",
          rncp: null,
          periode: [2025, 2026],
          date_fin: new Date("2026-06-30"),
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Rejette un effectif DECA sans UAI", async () => {
      const effectif = createBaseDecaEffectif({
        _computed: {
          organisme: { uai: null, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-12-01"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Rejette un effectif DECA avec rupture trop proche de la fin de formation (< 90 jours)", async () => {
      const dateFinFormation = new Date("2025-12-20");
      const dateRupture = new Date("2025-12-01");

      const effectif = createBaseDecaEffectif({
        formation: {
          cfd: "50022137",
          rncp: "RNCP12345",
          periode: [2025, 2026],
          date_fin: dateFinFormation,
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: dateRupture,
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: dateRupture, valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result).toEqual({ upserted: false });

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).toBeNull();
    });

    it("Accepte un effectif DECA avec rupture à plus de 90 jours de la fin de formation", async () => {
      const dateFinFormation = new Date("2026-06-30");
      const dateRupture = new Date("2025-12-01");

      const effectif = createBaseDecaEffectif({
        formation: {
          cfd: "50022137",
          rncp: "RNCP12345",
          periode: [2025, 2026],
          date_fin: dateFinFormation,
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: dateRupture,
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: dateRupture, valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result?.upserted).toBe(true);
    });

    it("Accepte un effectif DECA avec seulement un téléphone", async () => {
      const effectif = createBaseDecaEffectif({
        apprenant: {
          nom: "DUPONT",
          prenom: "Jean",
          date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
          telephone: "0612345678",
          courriel: null,
          historique_statut: [],
          has_nir: false,
          adresse: {
            code_postal: "75001",
            mission_locale_id: ML_ID,
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result?.upserted).toBe(true);
    });

    it("Accepte un effectif DECA avec seulement un email", async () => {
      const effectif = createBaseDecaEffectif({
        apprenant: {
          nom: "DUPONT",
          prenom: "Jean",
          date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1),
          telephone: null,
          courriel: "jean.dupont@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: {
            code_postal: "75001",
            mission_locale_id: ML_ID,
          },
        },
      });

      const result = await createMissionLocaleSnapshot(effectif);

      expect(result?.upserted).toBe(true);
    });
  });

  const makeApprenant = (nom: string, prenom: string, age: number, mlId = ML_ID) => ({
    nom,
    prenom,
    date_de_naissance: new Date(new Date().getFullYear() - age, 0, 1),
    telephone: "0612345678",
    courriel: `${prenom.toLowerCase()}.${nom.toLowerCase()}@example.com`,
    historique_statut: [] as never[],
    has_nir: false,
    adresse: { code_postal: "75001", mission_locale_id: mlId },
  });

  const createBaseErpEffectif = (overrides: Partial<IEffectif> = {}): IEffectif => {
    const dateRupture = new Date("2025-12-01");

    return {
      _id: new ObjectId(),
      organisme_id: new ObjectId(),
      id_erp_apprenant: "test-erp-id",
      source: SOURCE_APPRENANT.ERP,
      annee_scolaire: "2025-2026",
      apprenant: makeApprenant("DUPONT", "Jean", 20),
      formation: {
        cfd: "50022137",
        rncp: "RNCP12345",
        periode: [2025, 2026],
        date_fin: new Date("2026-06-30"),
      },
      contrats: [
        {
          siret: "12345678901234",
          date_debut: new Date("2025-09-01"),
          date_fin: new Date("2026-06-30"),
          date_rupture: dateRupture,
        },
      ],
      _computed: {
        organisme: {
          uai: UAI,
          siret: SIRET,
          region: "11",
        },
        statut: {
          en_cours: STATUT_APPRENANT.RUPTURANT,
          parcours: [
            { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
            { date: dateRupture, valeur: STATUT_APPRENANT.RUPTURANT },
          ],
        },
      },
      created_at: new Date(),
      updated_at: new Date(),
      ...overrides,
    } as IEffectif;
  };

  describe("Dedup ERP prioritaire", () => {
    it("DECA inséré, puis ERP arrive pour même personne → DECA soft-deleted, ERP inséré", async () => {
      const decaEffectif = createBaseDecaEffectif({ apprenant: makeApprenant("DUPONT", "Jean", 20) });
      const decaResult = await createMissionLocaleSnapshot(decaEffectif);
      expect(decaResult?.upserted).toBe(true);

      const erpEffectif = createBaseErpEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("DUPONT", "Jean", 20),
      });
      const erpResult = await createMissionLocaleSnapshot(erpEffectif);
      expect(erpResult?.upserted).toBe(true);

      const allMlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      const active = allMlEffectifs.filter((e) => !e.soft_deleted);
      const softDeleted = allMlEffectifs.filter((e) => e.soft_deleted);

      expect(active.length).toBe(1);
      expect(softDeleted.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(erpEffectif._id.toString());
      expect((softDeleted[0].effectif_snapshot as IEffectifDECA)?.is_deca_compatible).toBe(true);
    });

    it("ERP existe, puis DECA arrive pour même personne → DECA rejeté, ERP intact", async () => {
      const erpEffectif = createBaseErpEffectif({ apprenant: makeApprenant("MARTIN", "Marie", 22) });
      const erpResult = await createMissionLocaleSnapshot(erpEffectif);
      expect(erpResult?.upserted).toBe(true);

      const decaEffectif = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("MARTIN", "Marie", 22),
      });
      const decaResult = await createMissionLocaleSnapshot(decaEffectif);
      expect(decaResult?.upserted).toBe(false);

      const allMlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      const active = allMlEffectifs.filter((e) => !e.soft_deleted);

      expect(active.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(erpEffectif._id.toString());
    });

    it("Deux DECA pour même personne → premier reste, second rejeté", async () => {
      const deca1 = createBaseDecaEffectif({ apprenant: makeApprenant("DURAND", "Pierre", 19) });
      const result1 = await createMissionLocaleSnapshot(deca1);
      expect(result1?.upserted).toBe(true);

      const deca2 = createBaseDecaEffectif({ _id: new ObjectId(), apprenant: makeApprenant("DURAND", "Pierre", 19) });
      const result2 = await createMissionLocaleSnapshot(deca2);
      expect(result2?.upserted).toBe(false);

      const active = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(active.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(deca1._id.toString());
    });

    it("DECA inséré, puis ERP non-RUPTURANT (FIN_DE_FORMATION) → ml record migré vers ERP", async () => {
      const decaEffectif = createBaseDecaEffectif({ apprenant: makeApprenant("VILLENEUVE", "Téo", 21) });
      const decaResult = await createMissionLocaleSnapshot(decaEffectif);
      expect(decaResult?.upserted).toBe(true);

      const dateFin = new Date("2026-01-10");
      const erpEffectif = createBaseErpEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("VILLENEUVE", "Téo", 21),
        organisme_id: decaEffectif.organisme_id,
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.FIN_DE_FORMATION,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: dateFin, valeur: STATUT_APPRENANT.FIN_DE_FORMATION },
            ],
          },
        },
      });
      await createMissionLocaleSnapshot(erpEffectif);

      const allMlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(allMlEffectifs.length).toBe(1);
      expect(allMlEffectifs[0].effectif_id.toString()).toBe(erpEffectif._id.toString());
      expect((allMlEffectifs[0].effectif_snapshot as IEffectifDECA)?.is_deca_compatible).toBeFalsy();
    });

    it("Deux ERP pour même personne, même ML → premier reste, second rejeté", async () => {
      const erp1 = createBaseErpEffectif({ apprenant: makeApprenant("GARCIA", "Lucas", 20) });
      const result1 = await createMissionLocaleSnapshot(erp1);
      expect(result1?.upserted).toBe(true);

      const erp2 = createBaseErpEffectif({ _id: new ObjectId(), apprenant: makeApprenant("GARCIA", "Lucas", 20) });
      const result2 = await createMissionLocaleSnapshot(erp2);
      expect(result2?.upserted).toBe(false);

      const active = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(active.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(erp1._id.toString());
    });
  });

  describe("Race condition E11000", () => {
    it("Insertion concurrente détectée via index unique → retourne upserted: false", async () => {
      const realDb = missionLocaleEffectifsDb();
      const e11000Error = new MongoServerError({ message: "E11000 duplicate key error" });
      e11000Error.code = 11000;

      // Mock missionLocaleEffectifsDb pour intercepter findOneAndUpdate
      let findOneAndUpdateCallCount = 0;
      const spy = vi.spyOn(collectionsModule, "missionLocaleEffectifsDb").mockImplementation(() => {
        return new Proxy(realDb, {
          get(target, prop) {
            if (prop === "findOneAndUpdate") {
              return async (...args: unknown[]) => {
                findOneAndUpdateCallCount++;
                if (findOneAndUpdateCallCount === 1) {
                  throw e11000Error;
                }
                return (target.findOneAndUpdate as (...a: unknown[]) => unknown).apply(target, args);
              };
            }
            const val = target[prop as keyof typeof target];
            return typeof val === "function" ? val.bind(target) : val;
          },
        }) as any;
      });

      const erpEffectif = createBaseErpEffectif({ apprenant: makeApprenant("MOREAU", "Alice", 20) });
      const result = await createMissionLocaleSnapshot(erpEffectif);

      // Doit retourner upserted: false sans throw
      expect(result?.upserted).toBe(false);

      spy.mockRestore();
    });

    it("Erreur non-E11000 après soft-delete → restaure le record soft-deleted et throw", async () => {
      // D'abord insérer un DECA
      const decaEffectif = createBaseDecaEffectif({ apprenant: makeApprenant("LAMBERT", "Hugo", 21) });
      const decaResult = await createMissionLocaleSnapshot(decaEffectif);
      expect(decaResult?.upserted).toBe(true);

      const realDb = missionLocaleEffectifsDb();

      // Mock missionLocaleEffectifsDb pour intercepter findOneAndUpdate
      let findOneAndUpdateCallCount = 0;
      const spy = vi.spyOn(collectionsModule, "missionLocaleEffectifsDb").mockImplementation(() => {
        return new Proxy(realDb, {
          get(target, prop) {
            if (prop === "findOneAndUpdate") {
              return async (...args: unknown[]) => {
                findOneAndUpdateCallCount++;
                if (findOneAndUpdateCallCount === 1) {
                  throw new Error("Simulated connection error");
                }
                return (target.findOneAndUpdate as (...a: unknown[]) => unknown).apply(target, args);
              };
            }
            const val = target[prop as keyof typeof target];
            return typeof val === "function" ? val.bind(target) : val;
          },
        }) as any;
      });

      // L'ERP va soft-delete le DECA mais l'upsert va échouer
      const erpEffectif = createBaseErpEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("LAMBERT", "Hugo", 21),
      });
      await expect(createMissionLocaleSnapshot(erpEffectif)).rejects.toThrow("Simulated connection error");

      spy.mockRestore();

      // Le record DECA doit être restauré (soft_deleted retiré)
      const records = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(records.length).toBe(1);
      expect(records[0].effectif_id.toString()).toBe(decaEffectif._id.toString());
    });
  });

  describe("Dedup cross-ML (changement de mission locale)", () => {
    const ML_ID_2 = 610;

    beforeEach(async () => {
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        type: "MISSION_LOCALE",
        nom: "DEUXIEME MISSION LOCALE",
        created_at: new Date(),
        ml_id: ML_ID_2,
        email: "",
        telephone: "",
        site_web: "",
      });
    });

    it("ERP dans ML-A, puis ERP pour même personne dans ML-B → ancien soft-deleted, nouveau inséré", async () => {
      const erpML1 = createBaseErpEffectif({ apprenant: makeApprenant("LEROY", "Sophie", 21) });
      const result1 = await createMissionLocaleSnapshot(erpML1);
      expect(result1?.upserted).toBe(true);

      const erpML2 = createBaseErpEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("LEROY", "Sophie", 21, ML_ID_2),
      });
      const result2 = await createMissionLocaleSnapshot(erpML2);
      expect(result2?.upserted).toBe(true);

      const allMlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      const active = allMlEffectifs.filter((e) => !e.soft_deleted);
      const softDeleted = allMlEffectifs.filter((e) => e.soft_deleted);

      expect(active.length).toBe(1);
      expect(softDeleted.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(erpML2._id.toString());
    });

    it("ERP dans ML-A, puis DECA pour même personne dans ML-B → DECA rejeté, ERP intact", async () => {
      const erpML1 = createBaseErpEffectif({ apprenant: makeApprenant("BERNARD", "Luc", 23) });
      const result1 = await createMissionLocaleSnapshot(erpML1);
      expect(result1?.upserted).toBe(true);

      const decaML2 = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("BERNARD", "Luc", 23, ML_ID_2),
      });
      const result2 = await createMissionLocaleSnapshot(decaML2);
      expect(result2?.upserted).toBe(false);

      const active = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(active.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(erpML1._id.toString());
    });

    it("DECA dans ML-A, puis DECA pour même personne dans ML-B → ancien soft-deleted, nouveau inséré", async () => {
      const decaML1 = createBaseDecaEffectif({ apprenant: makeApprenant("PETIT", "Emma", 18) });
      const result1 = await createMissionLocaleSnapshot(decaML1);
      expect(result1?.upserted).toBe(true);

      const decaML2 = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: makeApprenant("PETIT", "Emma", 18, ML_ID_2),
      });
      const result2 = await createMissionLocaleSnapshot(decaML2);
      expect(result2?.upserted).toBe(true);

      const allMlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      const active = allMlEffectifs.filter((e) => !e.soft_deleted);
      const softDeleted = allMlEffectifs.filter((e) => e.soft_deleted);

      expect(active.length).toBe(1);
      expect(softDeleted.length).toBe(1);
      expect(active[0].effectif_id.toString()).toBe(decaML2._id.toString());
    });
  });

  describe("Déduplication cross-source ERP/DECA", () => {
    it("Bloque un doublon cross-source avec date_de_naissance décalée CET (23:00 UTC vs 00:00 UTC)", async () => {
      // Premier record avec date_de_naissance à 23:00 UTC (= minuit CET, artefact timezone)
      const firstEffectif = createBaseDecaEffectif({
        apprenant: {
          nom: "CHAMBARD",
          prenom: "Paul",
          date_de_naissance: new Date("2007-01-08T23:00:00Z"),
          telephone: "0612345678",
          courriel: "paul@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result1 = await createMissionLocaleSnapshot(firstEffectif);
      expect(result1?.upserted).toBe(true);

      // Même personne avec date_de_naissance à 00:00 UTC
      const secondEffectif = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "CHAMBARD",
          prenom: "Paul",
          date_de_naissance: new Date("2007-01-09T00:00:00Z"),
          telephone: "0612345678",
          courriel: "paul@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result2 = await createMissionLocaleSnapshot(secondEffectif);

      // Le second insert doit être bloqué (même personne après normalisation)
      expect(result2).toEqual({ upserted: false });

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
    });

    it("Bloque un doublon cross-source avec date_de_naissance décalée CEST (22:00 UTC vs 00:00 UTC)", async () => {
      const firstEffectif = createBaseDecaEffectif({
        apprenant: {
          nom: "TOTTEL",
          prenom: "Corentin",
          date_de_naissance: new Date("2009-06-25T22:00:00Z"),
          telephone: "0612345678",
          courriel: "corentin@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result1 = await createMissionLocaleSnapshot(firstEffectif);
      expect(result1?.upserted).toBe(true);

      const secondEffectif = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "TOTTEL",
          prenom: "Corentin",
          date_de_naissance: new Date("2009-06-26T00:00:00Z"),
          telephone: "0612345678",
          courriel: "corentin@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result2 = await createMissionLocaleSnapshot(secondEffectif);

      expect(result2).toEqual({ upserted: false });

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
    });

    it("Bloque un doublon même si date_rupture diffère entre les sources", async () => {
      const firstEffectif = createBaseDecaEffectif({
        apprenant: {
          nom: "MEDDOUR",
          prenom: "Mohand",
          date_de_naissance: new Date("2007-02-19T23:00:00Z"),
          telephone: "0612345678",
          courriel: "mohand@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2025-12-01"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-12-01"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result1 = await createMissionLocaleSnapshot(firstEffectif);
      expect(result1?.upserted).toBe(true);

      // Même personne, date_rupture décalée de 1 jour
      const secondEffectif = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "MEDDOUR",
          prenom: "Mohand",
          date_de_naissance: new Date("2007-02-20T00:00:00Z"),
          telephone: "0612345678",
          courriel: "mohand@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2025-12-02"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-12-02"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      const result2 = await createMissionLocaleSnapshot(secondEffectif);

      expect(result2).toEqual({ upserted: false });

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
    });

    it("ERP remplace un DECA existant pour la même personne", async () => {
      // DECA arrive en premier
      const decaEffectif = createBaseDecaEffectif({
        apprenant: {
          nom: "FORTIN",
          prenom: "Alyssia",
          date_de_naissance: new Date("2007-10-17T00:00:00Z"),
          telephone: null as any,
          courriel: "alyssia@iloud.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result1 = await createMissionLocaleSnapshot(decaEffectif);
      expect(result1?.upserted).toBe(true);

      // ERP arrive ensuite pour la même personne (avec tel + bon email)
      const erpEffectif = createBaseErpEffectif({
        apprenant: {
          nom: "FORTIN",
          prenom: "Alyssia",
          date_de_naissance: new Date("2007-10-16T22:00:00Z"),
          telephone: "0627845664",
          courriel: "alyssia@icloud.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result2 = await createMissionLocaleSnapshot(erpEffectif);
      expect(result2?.upserted).toBe(true);

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
      // Le keeper est l'ERP
      expect(mlEffectifs[0].effectif_snapshot.source).toBe("ERP");
      expect(mlEffectifs[0].effectif_snapshot.apprenant.telephone).toBe("0627845664");
    });

    it("DECA ne remplace pas un ERP existant", async () => {
      // ERP arrive en premier
      const erpEffectif = createBaseErpEffectif({
        apprenant: {
          nom: "BONNEAU",
          prenom: "Ida",
          date_de_naissance: new Date("2009-03-27T23:00:00Z"),
          telephone: "0612345678",
          courriel: "ida@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result1 = await createMissionLocaleSnapshot(erpEffectif);
      expect(result1?.upserted).toBe(true);

      // DECA arrive ensuite
      const decaEffectif = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "BONNEAU",
          prenom: "Ida",
          date_de_naissance: new Date("2009-03-28T00:00:00Z"),
          telephone: "0612345678",
          courriel: "ida@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result2 = await createMissionLocaleSnapshot(decaEffectif);
      expect(result2).toEqual({ upserted: false });

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
      expect(mlEffectifs[0].effectif_snapshot.source).toBe("ERP");
    });

    it("ERP remplace DECA et merge les données utilisateur du DECA", async () => {
      // DECA arrive en premier
      const decaEffectif = createBaseDecaEffectif({
        apprenant: {
          nom: "BRUNSON",
          prenom: "Mathis",
          date_de_naissance: new Date("2005-08-22T00:00:00Z"),
          telephone: "0612345678",
          courriel: "mathis@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      await createMissionLocaleSnapshot(decaEffectif);

      // Un conseiller ML renseigne une situation sur le record DECA
      await missionLocaleEffectifsDb().updateOne(
        { effectif_id: decaEffectif._id },
        { $set: { situation: SITUATION_ENUM.RDV_PRIS, commentaires: "Contacté par téléphone" } }
      );

      // ERP arrive ensuite
      const erpEffectif = createBaseErpEffectif({
        apprenant: {
          nom: "BRUNSON",
          prenom: "Mathis",
          date_de_naissance: new Date("2005-08-21T22:00:00Z"),
          telephone: "0698765432",
          courriel: "mathis@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result2 = await createMissionLocaleSnapshot(erpEffectif);
      expect(result2?.upserted).toBe(true);

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(1);
      // Le keeper est l'ERP avec les données ML mergées du DECA
      expect(mlEffectifs[0].effectif_snapshot.source).toBe("ERP");
      expect(mlEffectifs[0].situation).toBe("RDV_PRIS");
      expect(mlEffectifs[0].commentaires).toBe("Contacté par téléphone");
    });

    it("Autorise deux personnes différentes dans la même ML", async () => {
      const effectif1 = createBaseDecaEffectif({
        apprenant: {
          nom: "DUPONT",
          prenom: "Jean",
          date_de_naissance: new Date("2005-03-15T00:00:00Z"),
          telephone: "0612345678",
          courriel: "jean@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const effectif2 = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "MARTIN",
          prenom: "Marie",
          date_de_naissance: new Date("2006-07-20T00:00:00Z"),
          telephone: "0698765432",
          courriel: "marie@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: { code_postal: "75001", mission_locale_id: ML_ID },
        },
      });

      const result1 = await createMissionLocaleSnapshot(effectif1);
      const result2 = await createMissionLocaleSnapshot(effectif2);

      expect(result1?.upserted).toBe(true);
      expect(result2?.upserted).toBe(true);

      const mlEffectifs = await missionLocaleEffectifsDb()
        .find({ soft_deleted: { $ne: true } })
        .toArray();
      expect(mlEffectifs.length).toBe(2);
    });
  });

  describe("createMissionLocaleSnapshot - scoring classifier", () => {
    beforeEach(() => {
      vi.useRealTimers();
      mockScoreEffectifs.mockReset();
      mockScoreEffectifs.mockResolvedValue({ model: "2026-03-16", scores: [0.85] });
    });

    it("appelle le classifier et stocke le score lors de l'insertion", async () => {
      const effectif = createBaseErpEffectif();
      const result = await createMissionLocaleSnapshot(effectif);

      expect(result?.upserted).toBe(true);

      await vi.waitFor(async () => {
        expect(mockScoreEffectifs).toHaveBeenCalledOnce();
        const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
        expect(mlEffectif?.classification_reponse_appel).toBeDefined();
        expect(mlEffectif?.classification_reponse_appel?.score).toBe(0.85);
        expect(mlEffectif?.classification_reponse_appel?.model).toBe("2026-03-16");
      });
    });

    it("ne score pas lors d'une mise à jour (effectif déjà existant)", async () => {
      const effectif = createBaseErpEffectif();
      await createMissionLocaleSnapshot(effectif);
      await new Promise((r) => setTimeout(r, 100));
      mockScoreEffectifs.mockClear();
      mockScoreEffectifs.mockResolvedValue({ model: "2026-03-16", scores: [0.85] });

      // Deuxième appel = update, pas insert
      const result2 = await createMissionLocaleSnapshot(effectif);
      expect(result2?.upserted).toBe(false);
      await new Promise((r) => setTimeout(r, 100));
      expect(mockScoreEffectifs).not.toHaveBeenCalled();
    });

    it("crée l'effectif même si le classifier échoue", async () => {
      mockScoreEffectifs.mockRejectedValue(new Error("Classifier down"));

      const effectif = createBaseErpEffectif();
      const result = await createMissionLocaleSnapshot(effectif);

      expect(result?.upserted).toBe(true);

      await vi.waitFor(() => expect(mockScoreEffectifs).toHaveBeenCalledOnce());

      const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: effectif._id });
      expect(mlEffectif).not.toBeNull();
      expect(mlEffectif?.classification_reponse_appel).toBeUndefined();
    });
  });
});
