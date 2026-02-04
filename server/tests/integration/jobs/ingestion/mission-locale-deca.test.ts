import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { effectifsDECADb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { hydrateDecaFromExistingEffectifs } from "@/jobs/hydrate/deca/hydrate-deca-raw";
import { createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";

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

  describe("hydrateDecaFromExistingEffectifs", () => {
    it("Traite les effectifs DECA avec ruptures dans la période définie", async () => {
      const effectif1 = createBaseDecaEffectif({
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

      const effectif2 = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "MARTIN",
          prenom: "Marie",
          date_de_naissance: new Date(new Date().getFullYear() - 22, 0, 1),
          telephone: "0698765432",
          courriel: "marie.martin@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: {
            code_postal: "75002",
            mission_locale_id: ML_ID,
          },
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-09-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2025-12-10"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-09-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-12-10"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      // Effectif hors période (avant 2025-11-01)
      const effectif3 = createBaseDecaEffectif({
        _id: new ObjectId(),
        apprenant: {
          nom: "DURAND",
          prenom: "Pierre",
          date_de_naissance: new Date(new Date().getFullYear() - 19, 0, 1),
          telephone: "0611223344",
          courriel: "pierre.durand@example.com",
          historique_statut: [],
          has_nir: false,
          adresse: {
            code_postal: "75003",
            mission_locale_id: ML_ID,
          },
        },
        contrats: [
          {
            siret: "12345678901234",
            date_debut: new Date("2025-06-01"),
            date_fin: new Date("2026-06-30"),
            date_rupture: new Date("2025-09-15"),
          },
        ],
        _computed: {
          organisme: { uai: UAI, siret: SIRET, region: "11" },
          statut: {
            en_cours: STATUT_APPRENANT.RUPTURANT,
            parcours: [
              { date: new Date("2025-06-01"), valeur: STATUT_APPRENANT.APPRENTI },
              { date: new Date("2025-09-15"), valeur: STATUT_APPRENANT.RUPTURANT },
            ],
          },
        },
      });

      await effectifsDECADb().insertMany([effectif1, effectif2, effectif3]);

      await hydrateDecaFromExistingEffectifs();

      const mlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();

      expect(mlEffectifs.length).toBe(2);

      const effectifIds = mlEffectifs.map((e) => e.effectif_id.toString());
      expect(effectifIds).toContain(effectif1._id.toString());
      expect(effectifIds).toContain(effectif2._id.toString());
      expect(effectifIds).not.toContain(effectif3._id.toString());
    });

    it("Ne crée pas de doublon si l'effectif ML existe déjà", async () => {
      const effectif = createBaseDecaEffectif();

      await effectifsDECADb().insertOne(effectif);

      await hydrateDecaFromExistingEffectifs();

      let mlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      expect(mlEffectifs.length).toBe(1);

      await hydrateDecaFromExistingEffectifs();

      mlEffectifs = await missionLocaleEffectifsDb().find({}).toArray();
      expect(mlEffectifs.length).toBe(1);
    });
  });
});
