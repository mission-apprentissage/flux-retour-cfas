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
    describe("GET /api/v1/mission-locale/stats/summary", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques agrégées pour la période par défaut (all)", async () => {
        const currentDate = new Date("2025-03-15");
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
          },
          {
            _id: ml2Id,
            nom: "ML Lyon",
            ml_id: 2,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-15"),
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
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
            },
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
              total: 50,
              a_traiter: 20,
              traite: 30,
              rdv_pris: 10,
              nouveau_projet: 5,
              deja_accompagne: 5,
              contacte_sans_retour: 10,
              injoignables: 0,
              coordonnees_incorrectes: 3,
              autre: 2,
              autre_avec_contact: 0,
              deja_connu: 5,
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
            },
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/summary");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("mlCount");
        expect(response.data).toHaveProperty("activatedMlCount");
        expect(response.data).toHaveProperty("previousActivatedMlCount");
        expect(response.data).toHaveProperty("date");
        expect(response.data.mlCount).toBe(2);
        expect(response.data.activatedMlCount).toBe(2);
      });

      it("Doit retourner les statistiques pour une période de 30 jours", async () => {
        const currentDate = new Date("2025-03-15");
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 3,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/summary?period=30days");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("mlCount");
        expect(response.data).toHaveProperty("activatedMlCount");
        expect(response.data).toHaveProperty("previousActivatedMlCount");
        expect(response.data).toHaveProperty("date");
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/summary?period=invalid");

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/v1/mission-locale/stats/regions", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques par région pour la période par défaut (30days)", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Île-de-France",
            ml_id: 4,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            adresse: { region: "11" },
            activated_at: new Date("2025-02-01"),
          },
          {
            _id: ml2Id,
            nom: "ML Auvergne-Rhône-Alpes",
            ml_id: 5,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            adresse: { region: "84" },
            activated_at: new Date("2025-02-15"),
          },
        ]);

        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
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
            },
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
              total: 50,
              a_traiter: 20,
              traite: 30,
              rdv_pris: 10,
              nouveau_projet: 5,
              deja_accompagne: 5,
              contacte_sans_retour: 10,
              injoignables: 0,
              coordonnees_incorrectes: 3,
              autre: 2,
              autre_avec_contact: 0,
              deja_connu: 5,
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
            },
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/regions");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("regions");
        expect(response.data.regions).toBeInstanceOf(Array);
        expect(response.data.regions.length).toBeGreaterThan(0);

        const region = response.data.regions[0];
        expect(region).toHaveProperty("code");
        expect(region).toHaveProperty("nom");
        expect(region).toHaveProperty("ml_total");
        expect(region).toHaveProperty("ml_activees");
        expect(region).toHaveProperty("ml_engagees");
        expect(region).toHaveProperty("engagement_rate");
      });

      it("Doit retourner les statistiques pour une période de 3 mois", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 6,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          adresse: { region: "11" },
          activated_at: new Date("2025-02-01"),
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/regions?period=3months");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("regions");
        expect(response.data.regions).toBeInstanceOf(Array);
      });

      it("Doit retourner les statistiques pour toute la période (all)", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 7,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          adresse: { region: "11" },
          activated_at: new Date("2025-02-01"),
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/regions?period=all");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("regions");
        expect(response.data.regions).toBeInstanceOf(Array);
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/regions?period=invalid");

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/v1/mission-locale/stats/national", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques nationales pour la période par défaut (30days)", async () => {
        const currentDate = new Date("2025-03-15");
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Paris",
          ml_id: 1,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: {
            region: "11", // Île-de-France
          },
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
            deja_connu: 8,
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/national");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("rupturantsTimeSeries");
        expect(response.data).toHaveProperty("rupturantsSummary");
        expect(response.data).toHaveProperty("detailsTraites");
        expect(response.data).toHaveProperty("period");

        expect(response.data.rupturantsTimeSeries).toHaveLength(6);

        expect(response.data.rupturantsSummary).toHaveProperty("a_traiter");
        expect(response.data.rupturantsSummary.a_traiter).toHaveProperty("current");
        expect(response.data.rupturantsSummary.a_traiter).toHaveProperty("variation");
        expect(response.data.rupturantsSummary).toHaveProperty("traites");
        expect(response.data.rupturantsSummary).toHaveProperty("total");

        expect(response.data.detailsTraites).toHaveProperty("rdv_pris");
        expect(response.data.detailsTraites).toHaveProperty("nouveau_projet");
        expect(response.data.detailsTraites).toHaveProperty("contacte_sans_retour");
        expect(response.data.detailsTraites).toHaveProperty("injoignables");
        expect(response.data.detailsTraites).toHaveProperty("coordonnees_incorrectes");
        expect(response.data.detailsTraites).toHaveProperty("autre");
        expect(response.data.detailsTraites).toHaveProperty("deja_connu");
        expect(response.data.detailsTraites).toHaveProperty("total");
      });

      it("Doit accepter les différentes périodes", async () => {
        const response30d = await httpClient.get("/api/v1/mission-locale/stats/national?period=30days");
        expect(response30d.status).toBe(200);
        expect(response30d.data.period).toBe("30days");

        const response3m = await httpClient.get("/api/v1/mission-locale/stats/national?period=3months");
        expect(response3m.status).toBe(200);
        expect(response3m.data.period).toBe("3months");

        const responseAll = await httpClient.get("/api/v1/mission-locale/stats/national?period=all");
        expect(responseAll.status).toBe(200);
        expect(responseAll.data.period).toBe("all");
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/national?period=invalid");

        expect(response.status).toBe(400);
      });
    });

    describe("GET /api/v1/mission-locale/stats/traitement", () => {
      beforeEach(async () => {
        await missionLocaleStatsDb().deleteMany({});
        await organisationsDb().deleteMany({});
      });

      it("Doit retourner les statistiques de traitement pour la période par défaut (30days)", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 30);
        oldDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Paris",
          ml_id: 1,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
          adresse: {
            region: "11",
          },
        });

        // Stats anciennes (first)
        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: oldDate,
          created_at: new Date(),
          stats: {
            total: 50,
            a_traiter: 20,
            traite: 30,
            rdv_pris: 10,
            nouveau_projet: 5,
            deja_accompagne: 5,
            contacte_sans_retour: 10,
            injoignables: 0,
            coordonnees_incorrectes: 3,
            autre: 2,
            autre_avec_contact: 0,
            deja_connu: 5,
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
          },
        });

        // Stats récentes (latest)
        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
            deja_connu: 8,
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement");

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("latest");
        expect(response.data).toHaveProperty("first");
        expect(response.data).toHaveProperty("evaluationDate");
        expect(response.data).toHaveProperty("period");

        // Vérifier la structure de latest
        expect(response.data.latest).toHaveProperty("total");
        expect(response.data.latest).toHaveProperty("total_contacte");
        expect(response.data.latest).toHaveProperty("total_repondu");
        expect(response.data.latest).toHaveProperty("total_accompagne");

        // Vérifier la structure de first
        expect(response.data.first).toHaveProperty("total");
        expect(response.data.first).toHaveProperty("total_contacte");
        expect(response.data.first).toHaveProperty("total_repondu");
        expect(response.data.first).toHaveProperty("total_accompagne");

        // Vérifier que latest contient les données récentes
        expect(response.data.latest.total).toBe(100);
        expect(response.data.first.total).toBe(50);

        expect(response.data.period).toBe("30days");
      });

      it("Doit retourner les statistiques pour une période de 3 mois", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();

        await organisationsDb().insertOne({
          _id: ml1Id,
          nom: "ML Test",
          ml_id: 2,
          type: "MISSION_LOCALE",
          created_at: new Date("2025-01-01"),
          activated_at: new Date("2025-02-01"),
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement?period=3months");

        expect(response.status).toBe(200);
        expect(response.data.period).toBe("3months");
      });

      it("Doit retourner les statistiques pour toute la période (all)", async () => {
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
        });

        await missionLocaleStatsDb().insertOne({
          _id: new ObjectId(),
          mission_locale_id: ml1Id,
          computed_day: currentDate,
          created_at: new Date(),
          stats: {
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
          },
        });

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement?period=all");

        expect(response.status).toBe(200);
        expect(response.data.period).toBe("all");
      });

      it("Doit valider le paramètre period", async () => {
        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement?period=invalid");

        expect(response.status).toBe(400);
      });

      it("Doit calculer correctement les totaux agrégés avec plusieurs MLs", async () => {
        const currentDate = new Date();
        currentDate.setUTCHours(0, 0, 0, 0);

        const oldDate = new Date();
        oldDate.setDate(oldDate.getDate() - 30);
        oldDate.setUTCHours(0, 0, 0, 0);

        const ml1Id = new ObjectId();
        const ml2Id = new ObjectId();

        await organisationsDb().insertMany([
          {
            _id: ml1Id,
            nom: "ML Paris",
            ml_id: 4,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-01"),
            adresse: { region: "11" },
          },
          {
            _id: ml2Id,
            nom: "ML Lyon",
            ml_id: 5,
            type: "MISSION_LOCALE",
            created_at: new Date("2025-01-01"),
            activated_at: new Date("2025-02-15"),
            adresse: { region: "84" },
          },
        ]);

        // Stats anciennes
        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: oldDate,
            created_at: new Date(),
            stats: {
              total: 50,
              a_traiter: 20,
              traite: 30,
              rdv_pris: 10,
              nouveau_projet: 5,
              deja_accompagne: 5,
              contacte_sans_retour: 10,
              injoignables: 0,
              coordonnees_incorrectes: 3,
              autre: 2,
              autre_avec_contact: 0,
              deja_connu: 5,
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
            },
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: oldDate,
            created_at: new Date(),
            stats: {
              total: 30,
              a_traiter: 15,
              traite: 15,
              rdv_pris: 5,
              nouveau_projet: 3,
              deja_accompagne: 2,
              contacte_sans_retour: 5,
              injoignables: 0,
              coordonnees_incorrectes: 2,
              autre: 1,
              autre_avec_contact: 0,
              deja_connu: 2,
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
            },
          },
        ]);

        // Stats récentes
        await missionLocaleStatsDb().insertMany([
          {
            _id: new ObjectId(),
            mission_locale_id: ml1Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
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
              deja_connu: 8,
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
            },
          },
          {
            _id: new ObjectId(),
            mission_locale_id: ml2Id,
            computed_day: currentDate,
            created_at: new Date(),
            stats: {
              total: 60,
              a_traiter: 25,
              traite: 35,
              rdv_pris: 12,
              nouveau_projet: 8,
              deja_accompagne: 5,
              contacte_sans_retour: 10,
              injoignables: 0,
              coordonnees_incorrectes: 3,
              autre: 2,
              autre_avec_contact: 0,
              deja_connu: 5,
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
            },
          },
        ]);

        const response = await httpClient.get("/api/v1/mission-locale/stats/traitement");

        expect(response.status).toBe(200);

        // Vérifier agrégation des totaux (100 + 60 = 160)
        expect(response.data.latest.total).toBe(160);
        expect(response.data.first.total).toBe(80); // 50 + 30

        // Vérifier total_contacte = total - (a_traiter + injoignables + coordonnees_incorrectes + autre)
        // Latest: 160 - (30+25) - (0) - (5+3) - (5+2) = 160 - 55 - 0 - 8 - 7 = 90
        // total_contacte = traite = 70 + 35 = 105
        expect(response.data.latest.total_contacte).toBe(105);
        expect(response.data.first.total_contacte).toBe(45); // 30 + 15

        // Vérifier total_repondu = rdv_pris + nouveau_projet + deja_accompagne + autre_avec_contact
        // Latest: (20+12) + (15+8) + (10+5) + (0+0) = 32 + 23 + 15 + 0 = 70
        expect(response.data.latest.total_repondu).toBe(70);
        expect(response.data.first.total_repondu).toBe(30); // (10+5) + (5+3) + (5+2) + (0+0) = 15 + 8 + 7 + 0 = 30

        // Vérifier total_accompagne = rdv_pris + deja_accompagne
        // Latest: (20+12) + (10+5) = 32 + 15 = 47
        expect(response.data.latest.total_accompagne).toBe(47);
        expect(response.data.first.total_accompagne).toBe(22); // (10+5) + (5+2) = 15 + 7 = 22
      });
    });
  });
});
