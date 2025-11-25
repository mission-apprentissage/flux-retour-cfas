import { ObjectId } from "bson";
import { it, expect, describe, beforeEach } from "vitest";

import {
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
} from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import {
  createRandomDossierApprenantApiInputV3WithFixedDates,
  createRandomOrganisme,
} from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

const UAI = "0802004U";
const SIRET = "77937827200016";

const ORGANISME_ID = new ObjectId();
const ML_ID = new ObjectId();
const ML_DATA = { ml_id: 609, nom: "MA MISSION LOCALE", type: "MISSION_LOCALE" as const };

let EFFECTIF_ID: ObjectId;
let requestAsOrganisation: RequestAsOrganisationFunc;
let httpClient: Awaited<ReturnType<typeof initTestApp>>["httpClient"];

function createMockStats(overrides: Record<string, number> = {}) {
  return {
    total: 100,
    a_traiter: 30,
    traite: 70,
    rdv_pris: 20,
    nouveau_projet: 15,
    deja_accompagne: 10,
    contacte_sans_retour: 25,
    injoignables: 0,
    coordonnees_incorrectes: 5,
    autre: 5,
    autre_avec_contact: 0,
    deja_connu: 10,
    mineur: 0,
    mineur_a_traiter: 0,
    mineur_traite: 0,
    mineur_rdv_pris: 0,
    mineur_nouveau_projet: 0,
    mineur_deja_accompagne: 0,
    mineur_contacte_sans_retour: 0,
    mineur_injoignables: 0,
    mineur_coordonnees_incorrectes: 0,
    mineur_autre: 0,
    mineur_autre_avec_contact: 0,
    rqth: 0,
    rqth_a_traiter: 0,
    rqth_traite: 0,
    rqth_rdv_pris: 0,
    rqth_nouveau_projet: 0,
    rqth_deja_accompagne: 0,
    rqth_contacte_sans_retour: 0,
    rqth_injoignables: 0,
    rqth_coordonnees_incorrectes: 0,
    rqth_autre: 0,
    rqth_autre_avec_contact: 0,
    abandon: 0,
    ...overrides,
  };
}

describe("Mission Locale Routes", () => {
  useNock();
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
    httpClient = app.httpClient;
    await organisationsDb().insertOne({
      _id: ML_ID,
      created_at: new Date(),
      email: "",
      telephone: "",
      site_web: "",
      ...ML_DATA,
    });

    await organismesDb().insertOne({ _id: ORGANISME_ID, ...createRandomOrganisme({ uai: UAI, siret: SIRET }) });
  });

  describe("CFA non activé", () => {
    it("La ML doit voir le nouvel effectif", async () => {
      const payload = createRandomDossierApprenantApiInputV3WithFixedDates({
        annee_scolaire: "2025-2026",
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
        date_de_naissance_apprenant: new Date("2005-01-01"),
        date_inscription_formation: new Date("2025-09-01"),
        date_entree_formation: new Date("2025-09-01"),
        date_fin_formation: new Date("2026-08-01"),
      });

      await effectifsQueueDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        ...payload,
      });

      await processEffectifsQueue();
      const res = await requestAsOrganisation(
        ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );
      expect(res.data.a_traiter.reduce((acc, curr) => acc + (curr.data.length || 0), 0)).toStrictEqual(1);
    });
  });

  describe("Effectif traité avant l'activation du  CFA", () => {
    beforeEach(async () => {
      await missionLocaleEffectifsDb().deleteMany({});
      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/mission-locale/activate", {
        date: new Date("2025-01-01").toISOString(),
        missionLocaleId: ML_ID.toString(),
      });

      const payload = createRandomDossierApprenantApiInputV3WithFixedDates({
        annee_scolaire: "2025-2026",
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
        date_de_naissance_apprenant: new Date("2005-01-01"),
        date_inscription_formation: new Date("2025-09-01"),
        date_entree_formation: new Date("2025-09-01"),
        date_fin_formation: new Date("2026-08-01"),
      });

      const { insertedId } = await effectifsQueueDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        ...payload,
      });
      await processEffectifsQueue();

      const effQ = await effectifsQueueDb().findOne({ _id: insertedId }, { projection: { effectif_id: 1 } });
      EFFECTIF_ID = effQ?.effectif_id as ObjectId;

      await requestAsOrganisation(ML_DATA, "post", `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`, {
        situation: "RDV_PRIS",
      });

      await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/mission-locale/organismes/activate",
        {
          date: new Date().toISOString(),
          organismes_ids_list: [ORGANISME_ID.toString()],
        }
      );
    });

    it("La ML doit voir le nouvel effectif en tant que traite", async () => {
      const res = await requestAsOrganisation(
        ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );
      expect(res.data.traite.reduce((acc, curr) => acc + (curr.data.length || 0), 0)).toStrictEqual(1);
    });
  });

  describe("CFA activé", async () => {
    beforeEach(async () => {
      await missionLocaleEffectifsDb().deleteMany({});
      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/mission-locale/activate", {
        date: new Date("2025-01-01").toISOString(),
        missionLocaleId: ML_ID.toString(),
      });

      await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/mission-locale/organismes/activate",
        {
          date: new Date().toISOString(),
          organismes_ids_list: [ORGANISME_ID.toString()],
        }
      );

      const payload = createRandomDossierApprenantApiInputV3WithFixedDates({
        annee_scolaire: "2025-2026",
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
        date_de_naissance_apprenant: new Date("2005-01-01"),
        date_inscription_formation: new Date("2025-09-01"),
        date_entree_formation: new Date("2025-09-01"),
        date_fin_formation: new Date("2026-08-01"),
      });

      const { insertedId } = await effectifsQueueDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        ...payload,
      });
      await processEffectifsQueue();
      const effQ = await effectifsQueueDb().findOne({ _id: insertedId }, { projection: { effectif_id: 1 } });
      EFFECTIF_ID = effQ?.effectif_id as ObjectId;
    });

    it("La ML ne doit pas voir l'effectif", async () => {
      const res = await requestAsOrganisation(
        ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );
      expect(res.data.a_traiter).toStrictEqual([]);
    });

    it("Le CFA voit l'effectif", async () => {
      const res = await requestAsOrganisation(
        { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
        "get",
        `/api/v1/organismes/${ORGANISME_ID.toString()}/mission-locale/effectifs-per-month`
      );

      expect(res.data.a_traiter.reduce((acc, curr) => acc + (curr.data.length || 0), 0)).toStrictEqual(1);
    });

    it("Le CFA ne voit pas l'effectif qui a retrouvé un nouveau contrat", async () => {
      await missionLocaleEffectifsDb().updateOne(
        { effectif_id: EFFECTIF_ID },
        {
          $set: {
            current_status: {
              value: "APPRENTI",
              date: new Date(),
            },
          },
        }
      );

      const res = await requestAsOrganisation(
        { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
        "get",
        `/api/v1/organismes/${ORGANISME_ID.toString()}/mission-locale/effectifs-per-month`
      );
      expect(res.data.a_traiter.reduce((acc, curr) => acc + (curr.data.length || 0), 0)).toStrictEqual(0);
    });

    describe("Le CFA traite un jeune", () => {
      it("CFA refuse l'acc conjoint => Le jeune n'est pas visible par la ML", async () => {
        const res = await requestAsOrganisation(
          { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
          "put",
          `/api/v1/organismes/${ORGANISME_ID.toString()}/mission-locale/effectif/${EFFECTIF_ID.toString()}`,
          {
            rupture: true,
            acc_conjoint: false,
          }
        );

        expect(res.status).toBe(200);

        const res2 = await requestAsOrganisation(
          ML_DATA,
          "get",
          `/api/v1/organisation/mission-locale/effectifs-per-month`
        );
        expect(res2.data.a_traiter).toStrictEqual([]);
      });

      it("CFA accepte l'acc conjoint => Le jeune est visible par la ML", async () => {
        const res = await requestAsOrganisation(
          { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
          "put",
          `/api/v1/organismes/${ORGANISME_ID.toString()}/mission-locale/effectif/${EFFECTIF_ID.toString()}`,
          {
            rupture: true,
            acc_conjoint: true,
          }
        );

        expect(res.status).toBe(200);

        const res2 = await requestAsOrganisation(
          ML_DATA,
          "get",
          `/api/v1/organisation/mission-locale/effectifs-per-month`
        );
        expect(res2.data.a_traiter.reduce((acc, curr) => acc + (curr.data.length || 0), 0)).toStrictEqual(1);
      });
    });
  });

  describe("Statistiques Mission Locale", () => {
    describe("GET /api/v1/mission-locale/stats/synthese", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques de synthèse pour la période par défaut (30days)", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Paris",
            ml_id: 1,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          },
          {
            _id: ml2Id,
            nom: "ML Lyon",
            ml_id: 2,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-15"),
            adresse: { region: "84" },
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats(),
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({
              total: 50,
              a_traiter: 20,
              traite: 30,
              rdv_pris: 10,
              nouveau_projet: 5,
              deja_accompagne: 5,
              contacte_sans_retour: 10,
              coordonnees_incorrectes: 3,
              autre: 2,
              deja_connu: 5,
            }),
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/synthese");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("summary");
        expect(response.data.summary).toHaveProperty("mlCount");
        expect(response.data.summary).toHaveProperty("activatedMlCount");
        expect(response.data.summary).toHaveProperty("previousActivatedMlCount");
        expect(response.data.summary).toHaveProperty("date");
        expect(response.data.summary.mlCount).toBe(2);
        expect(response.data.summary.activatedMlCount).toBe(2);

        expect(response.data).toHaveProperty("regions");
        expect(response.data.regions).toBeInstanceOf(Array);

        expect(response.data).toHaveProperty("traitement");
        expect(response.data.traitement).toHaveProperty("latest");
        expect(response.data.traitement).toHaveProperty("first");
        expect(response.data.traitement.latest).toHaveProperty("total");
        expect(response.data.traitement.latest).toHaveProperty("total_contacte");
        expect(response.data.traitement.latest).toHaveProperty("total_repondu");
        expect(response.data.traitement.latest).toHaveProperty("total_accompagne");

        expect(response.data).toHaveProperty("evaluationDate");
        expect(response.data).toHaveProperty("period");
      });

      it("Doit retourner les statistiques pour une période de 3 mois", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 3,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: { region: "11" },
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: createMockStats(),
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/synthese?period=3months");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("summary");
        expect(response.data).toHaveProperty("regions");
        expect(response.data).toHaveProperty("traitement");
        expect(response.data.period).toBe("3months");
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/synthese?period=invalid");

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/v1/mission-locale/stats/traitement-ml", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques de traitement par ML avec pagination par défaut", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Paris",
          ml_id: 1,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: { region: "11" },
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: createMockStats(),
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("data");
        expect(response.data).toHaveProperty("pagination");
        expect(response.data).toHaveProperty("period");

        expect(response.data.data).toBeInstanceOf(Array);
        expect(response.data.pagination).toHaveProperty("page");
        expect(response.data.pagination).toHaveProperty("limit");
        expect(response.data.pagination).toHaveProperty("total");
        expect(response.data.pagination).toHaveProperty("totalPages");

        expect(response.data.pagination.page).toBe(1);
        expect(response.data.pagination.limit).toBe(10);
        expect(response.data.period).toBe("30days");

        if (response.data.data.length > 0) {
          const ml = response.data.data[0];
          expect(ml).toHaveProperty("id");
          expect(ml).toHaveProperty("nom");
          expect(ml).toHaveProperty("region_code");
          expect(ml).toHaveProperty("region_nom");
          expect(ml).toHaveProperty("total_jeunes");
          expect(ml).toHaveProperty("a_traiter");
          expect(ml).toHaveProperty("traites");
          expect(ml).toHaveProperty("pourcentage_traites");
          expect(ml).toHaveProperty("pourcentage_evolution");
          expect(ml).toHaveProperty("details");
          expect(ml.details).toHaveProperty("rdv_pris");
          expect(ml.details).toHaveProperty("nouveau_projet");
          expect(ml.details).toHaveProperty("deja_accompagne");
          expect(ml.details).toHaveProperty("contacte_sans_retour");
          expect(ml.details).toHaveProperty("injoignables");
          expect(ml.details).toHaveProperty("coordonnees_incorrectes");
          expect(ml.details).toHaveProperty("autre");
        }
      });

      it("Doit supporter la pagination personnalisée", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const mls: Array<{
          _id: ObjectId;
          nom: string;
          ml_id: number;
          type: "MISSION_LOCALE";
          created_at: Date;
          activated_at: Date;
          adresse: { region: string };
        }> = [];
        for (let i = 1; i <= 15; i++) {
          const mlId = new ObjectId();
          mls.push({
            _id: mlId,
            nom: `ML Test ${i}`,
            ml_id: i,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          });
          await missionLocaleStatsDb().insertOne({
            _id: new ObjectId(),
            mission_locale_id: mlId,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({ total: 100 + i, a_traiter: 30 + i, traite: 70 }),
          });
        }
        await organisationsDb().insertMany(mls);

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?page=2&limit=5");

        expect(response.status).toBe(200);
        expect(response.data.pagination.page).toBe(2);
        expect(response.data.pagination.limit).toBe(5);
        expect(response.data.pagination.total).toBe(15);
        expect(response.data.pagination.totalPages).toBe(3);
        expect(response.data.data.length).toBe(5);
      });

      it("Doit supporter le tri par total_jeunes décroissant (par défaut)", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Petite",
            ml_id: 1,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          },
          {
            _id: ml2Id,
            nom: "ML Grande",
            ml_id: 2,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "84" },
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({ total: 50, a_traiter: 20, traite: 30 }),
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({ total: 150, a_traiter: 50, traite: 100 }),
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml");

        expect(response.status).toBe(200);
        expect(response.data.data.length).toBe(2);
        expect(response.data.data[0].nom).toBe("ML Grande");
        expect(response.data.data[1].nom).toBe("ML Petite");
      });

      it("Doit supporter le tri par nom ascendant", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Zebra",
            ml_id: 1,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          },
          {
            _id: ml2Id,
            nom: "ML Alpha",
            ml_id: 2,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "84" },
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats(),
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats(),
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?sort_by=nom&sort_order=asc");

        expect(response.status).toBe(200);
        expect(response.data.data.length).toBe(2);
        expect(response.data.data[0].nom).toBe("ML Alpha");
        expect(response.data.data[1].nom).toBe("ML Zebra");
      });

      it("Doit retourner les statistiques pour différentes périodes", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 1,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: { region: "11" },
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: createMockStats(),
        });

        const response30d = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?period=30days");
        expect(response30d.status).toBe(200);
        expect(response30d.data.period).toBe("30days");

        const response3m = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?period=3months");
        expect(response3m.status).toBe(200);
        expect(response3m.data.period).toBe("3months");

        const responseAll = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?period=all");
        expect(responseAll.status).toBe(200);
        expect(responseAll.data.period).toBe("all");
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-ml?period=invalid");

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/v1/mission-locale/stats/traitement-regions", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques de traitement par région", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Île-de-France",
            ml_id: 1,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          },
          {
            _id: ml2Id,
            nom: "ML Auvergne-Rhône-Alpes",
            ml_id: 2,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-15"),
            adresse: { region: "84" },
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({ total: 100, a_traiter: 30, traite: 70 }),
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: createMockStats({ total: 50, a_traiter: 20, traite: 30 }),
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-regions");

        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Array);

        if (response.data.length > 0) {
          const region = response.data[0];
          expect(region).toHaveProperty("code");
          expect(region).toHaveProperty("nom");
          expect(region).toHaveProperty("total_jeunes");
          expect(region).toHaveProperty("a_traiter");
          expect(region).toHaveProperty("traites");
          expect(region).toHaveProperty("pourcentage_traites");
          expect(region).toHaveProperty("ml_actives");
        }
      });

      it("Doit retourner les statistiques pour différentes périodes", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 1,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: { region: "11" },
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: createMockStats(),
        });

        const response30d = await httpClient.get("/api/v1/mission-locale/stats/traitement-regions?period=30days");
        expect(response30d.status).toBe(200);

        const response3m = await httpClient.get("/api/v1/mission-locale/stats/traitement-regions?period=3months");
        expect(response3m.status).toBe(200);

        const responseAll = await httpClient.get("/api/v1/mission-locale/stats/traitement-regions?period=all");
        expect(responseAll.status).toBe(200);
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement-regions?period=invalid");

        expect(response.status).toBe(400);
      });
    });
  });
});
