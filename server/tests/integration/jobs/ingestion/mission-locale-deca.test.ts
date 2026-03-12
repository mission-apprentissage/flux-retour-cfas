import { ObjectId } from "bson";
import { STATUT_APPRENANT } from "shared/constants";
import { IEffectif } from "shared/models/data/effectifs.model";
import { IEffectifDECA } from "shared/models/data/effectifsDECA.model";
import { SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeAll, beforeEach, vi } from "vitest";

import { createMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import { effectifsDECADb, missionLocaleEffectifsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { createIndexes } from "@/common/model/indexes";
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

const createBaseErpEffectif = (overrides: Partial<IEffectif> = {}): IEffectif => {
  const now = new Date();
  const dateNaissance = new Date(now.getFullYear() - 20, 0, 1);
  const dateRupture = new Date("2025-12-01");
  const dateFinContrat = new Date("2026-06-30");
  const dateFinFormation = new Date("2026-06-30");

  return {
    _id: new ObjectId(),
    organisme_id: new ObjectId(),
    id_erp_apprenant: "test-erp-id",
    source: "ERP",
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
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as IEffectif;
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
});
