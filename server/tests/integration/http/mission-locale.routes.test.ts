import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";
import { SITUATION_ENUM } from "shared";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { updateOrDeleteMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import {
  effectifsDb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
  regionsDb,
} from "@/common/model/collections";
import { processEffectifsQueue } from "@/jobs/ingestion/process-ingestion";
import { createRupturantEffectifPayload, createRandomOrganisme } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { initTestApp, RequestAsOrganisationFunc, expectUnauthorizedError } from "@tests/utils/testUtils";

const mockScoreEffectifs = vi.fn().mockResolvedValue({ model: "2026-03-16", scores: [0.85] });

vi.mock("@/common/services/classifier/classifier", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/common/services/classifier/classifier")>();
  return {
    ...actual,
    scoreEffectifs: (...args: unknown[]) => mockScoreEffectifs(...args),
  };
});

const UAI = "0802004U";
const SIRET = "77937827200016";

const ORGANISME_ID = new ObjectId();
const ML_ID = new ObjectId();
const ML_DATA = { ml_id: 609, nom: "MA MISSION LOCALE", type: "MISSION_LOCALE" as const };

let EFFECTIF_ID: ObjectId;
let requestAsOrganisation: RequestAsOrganisationFunc;

describe("Mission Locale Routes", () => {
  useNock();
  useMongo();
  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;
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
      const payload = createRupturantEffectifPayload({
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
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

      const payload = createRupturantEffectifPayload({
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
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

      const payload = createRupturantEffectifPayload({
        etablissement_formateur_uai: UAI,
        etablissement_formateur_siret: SIRET,
        etablissement_responsable_uai: UAI,
        etablissement_responsable_siret: SIRET,
        code_postal_apprenant: "75001",
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

    describe("CFA déclare une rupture (cfa_rupture_declaration)", () => {
      it("POST declare-rupture persiste cfa_rupture_declaration sur le ML effectif", async () => {
        const dateRupture = new Date();
        dateRupture.setDate(dateRupture.getDate() - 10);

        const res = await requestAsOrganisation(
          { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
          "post",
          `/api/v1/organismes/${ORGANISME_ID.toString()}/cfa/effectif/${EFFECTIF_ID.toString()}/declare-rupture`,
          { date_rupture: dateRupture.toISOString(), source: "effectifs" }
        );

        expect(res.status).toBe(200);

        const mlEffectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(mlEffectif?.cfa_rupture_declaration).toBeTruthy();
        expect(mlEffectif?.cfa_rupture_declaration?.date_rupture).toBeTruthy();
      });

      it("cfa_rupture_declaration est nettoyé quand un nouveau contrat arrive après la rupture", async () => {
        const dateRupture = new Date();
        dateRupture.setDate(dateRupture.getDate() - 10);

        // CFA déclare la rupture
        await requestAsOrganisation(
          { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
          "post",
          `/api/v1/organismes/${ORGANISME_ID.toString()}/cfa/effectif/${EFFECTIF_ID.toString()}/declare-rupture`,
          { date_rupture: dateRupture.toISOString(), source: "effectifs" }
        );

        // Vérifier que la déclaration existe
        const before = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(before?.cfa_rupture_declaration).toBeTruthy();

        // Simuler un nouveau contrat : mettre à jour le statut de l'effectif en APPRENTI
        const effectif = await effectifsDb().findOne({ _id: EFFECTIF_ID });
        expect(effectif).toBeTruthy();

        const newContractDate = new Date();
        await effectifsDb().updateOne(
          { _id: EFFECTIF_ID },
          {
            $push: {
              "_computed.statut.parcours": {
                valeur: "APPRENTI",
                date: newContractDate,
              },
            } as any,
          }
        );

        // Re-calculer le snapshot
        const updatedEffectif = await effectifsDb().findOne({ _id: EFFECTIF_ID });
        await updateOrDeleteMissionLocaleSnapshot(updatedEffectif!);

        // cfa_rupture_declaration doit être nettoyé
        const after = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(after?.cfa_rupture_declaration).toBeFalsy();
      });
    });

    describe("La ML soumet le formulaire collaboration", () => {
      it.each([
        { situation: SITUATION_ENUM.CHERCHE_CONTRAT },
        { situation: SITUATION_ENUM.REORIENTATION },
        { situation: SITUATION_ENUM.NE_VEUT_PAS_ACCOMPAGNEMENT },
      ])("POST avec situation=$situation persiste en base", async ({ situation }) => {
        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          { situation }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.situation).toBe(situation);
      });

      it("POST avec deja_connu et commentaires persiste en base", async () => {
        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          {
            situation: SITUATION_ENUM.CHERCHE_CONTRAT,
            deja_connu: true,
            commentaires: "Commentaire de test",
          }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.situation).toBe(SITUATION_ENUM.CHERCHE_CONTRAT);
        expect(effectif?.deja_connu).toBe(true);
        expect(effectif?.commentaires).toBe("Commentaire de test");
      });

      it("POST avec acc_conjoint=true déclenche has_unread_notification pour le CFA", async () => {
        // D'abord le CFA accepte l'acc_conjoint
        await requestAsOrganisation(
          { type: "ORGANISME_FORMATION", uai: UAI, siret: SIRET },
          "put",
          `/api/v1/organismes/${ORGANISME_ID.toString()}/mission-locale/effectif/${EFFECTIF_ID.toString()}`,
          { rupture: true, acc_conjoint: true }
        );

        // Puis la ML soumet son retour
        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          { situation: SITUATION_ENUM.REORIENTATION, deja_connu: false }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.organisme_data?.has_unread_notification).toBe(true);
      });
    });
  });
});

describe("Mission Locale Stats Routes - Public", () => {
  useNock();
  useMongo();

  let httpClient: AxiosInstance;

  const ML_ID_STATS = new ObjectId();
  const ML_ID_STATS_ARA = new ObjectId();
  const ML_DATA_STATS = { ml_id: 610, nom: "ML STATS TEST", type: "MISSION_LOCALE" as const };
  const ML_DATA_STATS_ARA = { ml_id: 612, nom: "ML STATS ARA", type: "MISSION_LOCALE" as const };

  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;

    await regionsDb().insertMany([
      {
        _id: new ObjectId(),
        code: "11",
        nom: "Île-de-France",
      },
      {
        _id: new ObjectId(),
        code: "84",
        nom: "Auvergne-Rhône-Alpes",
      },
    ]);

    await organisationsDb().insertMany([
      {
        _id: ML_ID_STATS,
        created_at: new Date(),
        activated_at: new Date("2025-01-01"),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "11" },
        ...ML_DATA_STATS,
      },
      {
        _id: ML_ID_STATS_ARA,
        created_at: new Date(),
        activated_at: new Date("2025-01-01"),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "84" },
        ...ML_DATA_STATS_ARA,
      },
    ]);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const statsBase = {
      abandon: 0,
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
      mineur_cherche_contrat: 0,
      mineur_reorientation: 0,
      mineur_ne_veut_pas_accompagnement: 0,
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
      rqth_cherche_contrat: 0,
      rqth_reorientation: 0,
      rqth_ne_veut_pas_accompagnement: 0,
    };

    await missionLocaleStatsDb().insertMany([
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ID_STATS,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: {
          total: 100,
          a_traiter: 30,
          traite: 70,
          rdv_pris: 20,
          rdv_pris_decouverts: 0,
          nouveau_projet: 15,
          deja_accompagne: 10,
          contacte_sans_retour: 10,
          injoignables: 5,
          coordonnees_incorrectes: 5,
          autre: 5,
          cherche_contrat: 0,
          reorientation: 0,
          ne_veut_pas_accompagnement: 0,
          autre_avec_contact: 2,
          deja_connu: 8,
          ...statsBase,
        },
      },
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ID_STATS_ARA,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: {
          total: 50,
          a_traiter: 20,
          traite: 30,
          rdv_pris: 10,
          rdv_pris_decouverts: 0,
          nouveau_projet: 8,
          deja_accompagne: 5,
          contacte_sans_retour: 3,
          injoignables: 2,
          coordonnees_incorrectes: 1,
          autre: 1,
          cherche_contrat: 0,
          reorientation: 0,
          ne_veut_pas_accompagnement: 0,
          autre_avec_contact: 1,
          deja_connu: 4,
          ...statsBase,
        },
      },
    ]);
  });

  describe("GET /api/v1/mission-locale/stats/traitement", () => {
    it("Retourne les stats de traitement sans authentification", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/traitement");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("latest");
      expect(response.data).toHaveProperty("first");
      expect(response.data).toHaveProperty("evaluationDate");
      expect(response.data).toHaveProperty("period");
      expect(response.data.latest).toHaveProperty("total");
      expect(response.data.latest).toHaveProperty("total_contacte");
      expect(response.data.latest).toHaveProperty("total_repondu");
      expect(response.data.latest).toHaveProperty("total_accompagne");
    });

    it("Accepte le paramètre period", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/traitement?period=3months");

      expect(response.status).toBe(200);
      expect(response.data.period).toBe("3months");
    });

    it("Rejette une période invalide", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/traitement?period=invalid");

      expect(response.status).toBe(400);
    });

    it("Filtre par région quand le paramètre region est fourni", async () => {
      const responseIDF = await httpClient.get("/api/v1/mission-locale/stats/traitement?region=11");

      expect(responseIDF.status).toBe(200);
      expect(responseIDF.data.latest.total).toBe(100);

      const responseARA = await httpClient.get("/api/v1/mission-locale/stats/traitement?region=84");

      expect(responseARA.status).toBe(200);
      expect(responseARA.data.latest.total).toBe(50);
    });

    it("Retourne les stats de toutes les régions sans le paramètre region", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/traitement");

      expect(response.status).toBe(200);
      expect(response.data.latest.total).toBe(150);
    });
  });

  describe("GET /api/v1/mission-locale/stats/synthese/deployment", () => {
    it("Retourne les stats de déploiement sans authentification", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/synthese/deployment");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("summary");
      expect(response.data).toHaveProperty("regionsActives");
      expect(response.data).toHaveProperty("evaluationDate");
      expect(response.data).toHaveProperty("period");
      expect(response.data.summary).toHaveProperty("mlCount");
      expect(response.data.summary).toHaveProperty("activatedMlCount");
    });

    it("Accepte le paramètre period", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/synthese/deployment?period=all");

      expect(response.status).toBe(200);
      expect(response.data.period).toBe("all");
    });
  });

  describe("GET /api/v1/mission-locale/stats/synthese/regions", () => {
    it("Retourne les stats par région sans authentification", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/synthese/regions");

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("regions");
      expect(response.data).toHaveProperty("period");
      expect(Array.isArray(response.data.regions)).toBe(true);
    });

    it("Accepte le paramètre period", async () => {
      const response = await httpClient.get("/api/v1/mission-locale/stats/synthese/regions?period=30days");

      expect(response.status).toBe(200);
      expect(response.data.period).toBe("30days");
    });
  });
});

describe("Mission Locale Stats Routes - Admin", () => {
  useNock();
  useMongo();

  let requestAsOrganisation: RequestAsOrganisationFunc;
  let httpClient: AxiosInstance;

  const ML_ID_ADMIN = new ObjectId();
  const ML_ID_ADMIN_ARA = new ObjectId();
  const ML_DATA_ADMIN = { ml_id: 611, nom: "ML ADMIN TEST", type: "MISSION_LOCALE" as const };
  const ML_DATA_ADMIN_ARA = { ml_id: 613, nom: "ML ADMIN ARA", type: "MISSION_LOCALE" as const };

  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;

    await regionsDb().insertMany([
      {
        _id: new ObjectId(),
        code: "11",
        nom: "Île-de-France",
      },
      {
        _id: new ObjectId(),
        code: "84",
        nom: "Auvergne-Rhône-Alpes",
      },
    ]);

    await organisationsDb().insertMany([
      {
        _id: ML_ID_ADMIN,
        created_at: new Date(),
        activated_at: new Date("2025-01-01"),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "11" },
        ...ML_DATA_ADMIN,
      },
      {
        _id: ML_ID_ADMIN_ARA,
        created_at: new Date(),
        activated_at: new Date("2025-01-01"),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "84" },
        ...ML_DATA_ADMIN_ARA,
      },
    ]);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const statsBase = {
      abandon: 0,
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
      mineur_cherche_contrat: 0,
      mineur_reorientation: 0,
      mineur_ne_veut_pas_accompagnement: 0,
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
      rqth_cherche_contrat: 0,
      rqth_reorientation: 0,
      rqth_ne_veut_pas_accompagnement: 0,
    };

    await missionLocaleStatsDb().insertMany([
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ID_ADMIN,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: {
          total: 50,
          a_traiter: 20,
          traite: 30,
          rdv_pris: 10,
          rdv_pris_decouverts: 0,
          nouveau_projet: 5,
          deja_accompagne: 5,
          contacte_sans_retour: 5,
          injoignables: 2,
          coordonnees_incorrectes: 2,
          autre: 1,
          cherche_contrat: 0,
          reorientation: 0,
          ne_veut_pas_accompagnement: 0,
          autre_avec_contact: 1,
          deja_connu: 4,
          ...statsBase,
        },
      },
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ID_ADMIN_ARA,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: {
          total: 80,
          a_traiter: 30,
          traite: 50,
          rdv_pris: 15,
          rdv_pris_decouverts: 0,
          nouveau_projet: 10,
          deja_accompagne: 8,
          contacte_sans_retour: 7,
          injoignables: 5,
          coordonnees_incorrectes: 3,
          autre: 2,
          cherche_contrat: 0,
          reorientation: 0,
          ne_veut_pas_accompagnement: 0,
          autre_avec_contact: 2,
          deja_connu: 6,
          ...statsBase,
        },
      },
    ]);
  });

  describe("GET /api/v1/admin/mission-locale/stats/national/rupturants", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/national/rupturants");
      expectUnauthorizedError(response);
    });

    it("Retourne les stats des rupturants pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/rupturants"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("timeSeries");
      expect(response.data).toHaveProperty("summary");
      expect(response.data).toHaveProperty("evaluationDate");
      expect(response.data).toHaveProperty("period");
      expect(response.data.summary).toHaveProperty("a_traiter");
      expect(response.data.summary).toHaveProperty("traites");
      expect(response.data.summary).toHaveProperty("total");
    });

    it("Accepte le paramètre period", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/rupturants?period=3months"
      );

      expect(response.status).toBe(200);
      expect(response.data.period).toBe("3months");
    });

    it("Filtre par région quand le paramètre region est fourni", async () => {
      const responseIDF = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/rupturants?region=11"
      );

      expect(responseIDF.status).toBe(200);
      expect(responseIDF.data.summary.total).toBe(50);

      const responseARA = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/rupturants?region=84"
      );

      expect(responseARA.status).toBe(200);
      expect(responseARA.data.summary.total).toBe(80);
    });

    it("Retourne les stats de toutes les régions sans le paramètre region", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/rupturants"
      );

      expect(response.status).toBe(200);
      expect(response.data.summary.total).toBe(130);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/national/dossiers-traites", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/national/dossiers-traites");
      expectUnauthorizedError(response);
    });

    it("Retourne les détails des dossiers traités pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("details");
      expect(response.data).toHaveProperty("evaluationDate");
      expect(response.data).toHaveProperty("period");
      expect(response.data.details).toHaveProperty("rdv_pris");
      expect(response.data.details).toHaveProperty("nouveau_projet");
      expect(response.data.details).toHaveProperty("deja_accompagne");
      expect(response.data.details).toHaveProperty("contacte_sans_retour");
      expect(response.data.details).toHaveProperty("injoignables");
    });

    it("Accepte le paramètre period", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites?period=all"
      );

      expect(response.status).toBe(200);
      expect(response.data.period).toBe("all");
    });

    it("Filtre par région quand le paramètre region est fourni", async () => {
      const responseIDF = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites?region=11"
      );

      expect(responseIDF.status).toBe(200);
      expect(responseIDF.data.details.rdv_pris.current).toBe(10);

      const responseARA = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites?region=84"
      );

      expect(responseARA.status).toBe(200);
      expect(responseARA.data.details.rdv_pris.current).toBe(15);
    });

    it("Retourne les stats de toutes les régions sans le paramètre region", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites"
      );

      expect(response.status).toBe(200);
      expect(response.data.details.rdv_pris.current).toBe(25);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/national/couverture-regions", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/national/couverture-regions");
      expectUnauthorizedError(response);
    });

    it("Retourne la couverture par région pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/couverture-regions"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("regions");
      expect(response.data).toHaveProperty("period");
      expect(Array.isArray(response.data.regions)).toBe(true);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/traitement/ml", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/traitement/ml");
      expectUnauthorizedError(response);
    });

    it("Retourne les stats de traitement par ML pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("data");
      expect(response.data).toHaveProperty("pagination");
      expect(response.data).toHaveProperty("period");
      expect(response.data.pagination).toHaveProperty("page");
      expect(response.data.pagination).toHaveProperty("limit");
      expect(response.data.pagination).toHaveProperty("total");
      expect(response.data.pagination).toHaveProperty("totalPages");
    });

    it("Accepte les paramètres de pagination", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml?page=1&limit=5"
      );

      expect(response.status).toBe(200);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(5);
    });

    it("Accepte les paramètres de tri", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml?sort_by=nom&sort_order=asc"
      );

      expect(response.status).toBe(200);
    });

    it("Filtre par région quand le paramètre region est fourni", async () => {
      const responseIDF = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml?region=11"
      );

      expect(responseIDF.status).toBe(200);
      expect(responseIDF.data.data.length).toBe(1);
      expect(responseIDF.data.data[0].nom).toBe("ML ADMIN TEST");

      const responseARA = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml?region=84"
      );

      expect(responseARA.status).toBe(200);
      expect(responseARA.data.data.length).toBe(1);
      expect(responseARA.data.data[0].nom).toBe("ML ADMIN ARA");
    });

    it("Retourne les MLs de toutes les régions sans le paramètre region", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/ml"
      );

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBe(2);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/traitement/regions", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/traitement/regions");
      expectUnauthorizedError(response);
    });

    it("Retourne les stats de traitement par région pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/regions"
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it("Accepte le paramètre period", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/traitement/regions?period=30days"
      );

      expect(response.status).toBe(200);
    });
  });

  describe("GET /api/v1/admin/mission-locale/stats/accompagnement-conjoint", () => {
    it("Requiert une authentification", async () => {
      const response = await httpClient.get("/api/v1/admin/mission-locale/stats/accompagnement-conjoint");
      expectUnauthorizedError(response);
    });

    it("Retourne les stats d'accompagnement conjoint pour un admin", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty("cfaPartenaires");
      expect(response.data).toHaveProperty("mlConcernees");
      expect(response.data).toHaveProperty("regionsActives");
      expect(response.data).toHaveProperty("totalJeunesRupturants");
      expect(response.data).toHaveProperty("totalDossiersPartages");
      expect(response.data).toHaveProperty("totalDossiersTraites");
      expect(response.data).toHaveProperty("pourcentageTraites");
      expect(response.data).toHaveProperty("motifs");
      expect(response.data).toHaveProperty("statutsTraitement");
      expect(response.data).toHaveProperty("dejaConnu");
      expect(response.data).toHaveProperty("evaluationDate");
    });

    it("Retourne les motifs correctement structurés", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data.motifs).toHaveProperty("mobilite");
      expect(response.data.motifs).toHaveProperty("logement");
      expect(response.data.motifs).toHaveProperty("sante");
      expect(response.data.motifs).toHaveProperty("finance");
      expect(response.data.motifs).toHaveProperty("administratif");
      expect(response.data.motifs).toHaveProperty("reorientation");
      expect(response.data.motifs).toHaveProperty("recherche_emploi");
      expect(response.data.motifs).toHaveProperty("autre");
    });

    it("Retourne les statuts de traitement correctement structurés", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint"
      );

      expect(response.status).toBe(200);
      expect(response.data.statutsTraitement).toHaveProperty("rdv_pris");
      expect(response.data.statutsTraitement).toHaveProperty("nouveau_projet");
      expect(response.data.statutsTraitement).toHaveProperty("deja_accompagne");
      expect(response.data.statutsTraitement).toHaveProperty("contacte_sans_retour");
      expect(response.data.statutsTraitement).toHaveProperty("injoignables");
      expect(response.data.statutsTraitement).toHaveProperty("coordonnees_incorrectes");
      expect(response.data.statutsTraitement).toHaveProperty("autre");
    });

    it("Accepte le paramètre region", async () => {
      const responseIDF = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint?region=11"
      );

      expect(responseIDF.status).toBe(200);
      expect(responseIDF.data).toHaveProperty("totalJeunesRupturants");
      expect(responseIDF.data).toHaveProperty("statutsTraitement");

      const responseARA = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/accompagnement-conjoint?region=84"
      );

      expect(responseARA.status).toBe(200);
      expect(responseARA.data).toHaveProperty("totalJeunesRupturants");
      expect(responseARA.data).toHaveProperty("statutsTraitement");
    });
  });
});

describe("Classifier Feedback Routes", () => {
  useNock();
  useMongo();

  const CF_ORGANISME_ID = new ObjectId();
  const CF_ML_ID = new ObjectId();
  const CF_ML_DATA = { ml_id: 609, nom: "ML CLASSIFIER TEST", type: "MISSION_LOCALE" as const };

  let requestAsOrganisation: RequestAsOrganisationFunc;
  let EFFECTIF_ID: ObjectId;

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;

    await organisationsDb().insertOne({
      _id: CF_ML_ID,
      created_at: new Date(),
      email: "",
      telephone: "",
      site_web: "",
      ...CF_ML_DATA,
    });

    await organismesDb().insertOne({
      _id: CF_ORGANISME_ID,
      ...createRandomOrganisme({ uai: "0802004U", siret: "77937827200016" }),
    });

    // Create an effectif via the normal flow
    const payload = createRupturantEffectifPayload({
      etablissement_formateur_uai: "0802004U",
      etablissement_formateur_siret: "77937827200016",
      etablissement_responsable_uai: "0802004U",
      etablissement_responsable_siret: "77937827200016",
      code_postal_apprenant: "75001",
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

  describe("Contact opportun dans la réponse API", () => {
    it("expose contact_opportun: true quand score >= 0.75 et pas mineur ni RQTH", async () => {
      await missionLocaleEffectifsDb().updateOne(
        { effectif_id: EFFECTIF_ID },
        {
          $set: {
            classification_reponse_appel: { score: 0.85, model: "2026-03-16", scored_at: new Date() },
          },
        }
      );

      const res = await requestAsOrganisation(
        CF_ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );

      const allEffectifs = res.data.a_traiter.flatMap((m: { data: unknown[] }) => m.data);
      const effectif = allEffectifs.find((e: { id: string }) => e.id === EFFECTIF_ID.toString());
      expect(effectif?.contact_opportun).toBe(true);
    });

    it("expose contact_opportun: false quand score < 0.75", async () => {
      await missionLocaleEffectifsDb().updateOne(
        { effectif_id: EFFECTIF_ID },
        {
          $set: {
            classification_reponse_appel: { score: 0.3, model: "2026-03-16", scored_at: new Date() },
          },
        }
      );

      const res = await requestAsOrganisation(
        CF_ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );

      const allEffectifs = res.data.a_traiter.flatMap((m: { data: unknown[] }) => m.data);
      const effectif = allEffectifs.find((e: { id: string }) => e.id === EFFECTIF_ID.toString());
      expect(effectif?.contact_opportun).toBe(false);
    });

    it("n'expose plus presque_6_mois dans la réponse", async () => {
      const res = await requestAsOrganisation(
        CF_ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );

      const allEffectifs = res.data.a_traiter.flatMap((m: { data: unknown[] }) => m.data);
      if (allEffectifs.length > 0) {
        expect(allEffectifs[0]).not.toHaveProperty("presque_6_mois");
      }
    });
  });

  describe("WhatsApp callback dans la liste à traiter", () => {
    it("un effectif whatsapp_callback_requested apparaît dans le prioritaire à traiter mais pas dans les mois à traiter", async () => {
      await missionLocaleEffectifsDb().updateOne(
        { effectif_id: EFFECTIF_ID },
        {
          $set: {
            situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
            whatsapp_callback_requested: true,
          },
        }
      );

      const res = await requestAsOrganisation(
        CF_ML_DATA,
        "get",
        `/api/v1/organisation/mission-locale/effectifs-per-month`
      );

      // Doit apparaître dans le prioritaire (encart prioritaire de à traiter)
      const prioritaireData = res.data.prioritaire?.effectifs ?? [];
      const inPrioritaire = prioritaireData.find((e: { id: string }) => e.id === EFFECTIF_ID.toString());
      expect(inPrioritaire).toBeDefined();

      // Ne doit PAS apparaître dans les tableaux par mois de à traiter
      const aTraiterEffectifs = res.data.a_traiter.flatMap((m: { data: unknown[] }) => m.data);
      const inATraiterMois = aTraiterEffectifs.find((e: { id: string }) => e.id === EFFECTIF_ID.toString());
      expect(inATraiterMois).toBeUndefined();

      // Doit aussi apparaître dans injoignable
      const injoignableEffectifs = res.data.injoignable.flatMap((m: { data: unknown[] }) => m.data);
      const inInjoignable = injoignableEffectifs.find((e: { id: string }) => e.id === EFFECTIF_ID.toString());
      expect(inInjoignable).toBeDefined();
    });
  });
});
