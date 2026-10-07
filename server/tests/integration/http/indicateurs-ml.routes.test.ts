import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";
import type { IMissionLocaleEffectif, IMissionLocaleStats } from "shared/models";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import {
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  missionLocaleStatsDb,
  organisationsDb,
  organismesDb,
  regionsDb,
  telechargementListesNominativesLogsDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

const ADMIN: IOrganisationCreate = { type: "ADMINISTRATEUR" };
const ARML_IDF: IOrganisationCreate = { type: "ARML", nom: "ARML IDF", region_list: ["11"] };
const ARML_IDF_ARA: IOrganisationCreate = { type: "ARML", nom: "ARML IDF ARA", region_list: ["11", "84"] };
const ARML_SANS_REGION: IOrganisationCreate = { type: "ARML", nom: "ARML sans périmètre", region_list: [] };
const DREETS_IDF: IOrganisationCreate = { type: "DREETS", code_region: "11" };
const DDETS_PARIS: IOrganisationCreate = { type: "DDETS", code_departement: "75" };

const expectForbidden = (response: { status: number; data: { error: string; message: string } }, message: string) => {
  expect(response.status).toBe(403);
  expect(response.data).toEqual({ error: "Forbidden", message });
};

const ML_IDF = new ObjectId();
const ML_ARA = new ObjectId();
const ML_HDF = new ObjectId();
const ML_SANS_REGION = new ObjectId();
const CFA_A = new ObjectId();
const CFA_B = new ObjectId();

const STATS_ZEROS = Object.fromEntries(
  [
    "abandon",
    "mineur",
    "mineur_a_traiter",
    "mineur_traite",
    "mineur_rdv_pris",
    "mineur_nouveau_projet",
    "mineur_deja_accompagne",
    "mineur_contacte_sans_retour",
    "mineur_injoignables",
    "mineur_coordonnees_incorrectes",
    "mineur_autre",
    "mineur_autre_avec_contact",
    "mineur_cherche_contrat",
    "mineur_reorientation",
    "mineur_ne_veut_pas_accompagnement",
    "mineur_ne_souhaite_pas_etre_recontacte",
    "rqth",
    "rqth_a_traiter",
    "rqth_traite",
    "rqth_rdv_pris",
    "rqth_nouveau_projet",
    "rqth_deja_accompagne",
    "rqth_contacte_sans_retour",
    "rqth_injoignables",
    "rqth_coordonnees_incorrectes",
    "rqth_autre",
    "rqth_autre_avec_contact",
    "rqth_cherche_contrat",
    "rqth_reorientation",
    "rqth_ne_veut_pas_accompagnement",
    "rqth_ne_souhaite_pas_etre_recontacte",
  ].map((key) => [key, 0])
);

const STATS_IDF = {
  total: 100,
  a_traiter: 30,
  traite: 70,
  rdv_pris: 20,
  rdv_pris_decouverts: 7,
  nouveau_projet: 15,
  deja_accompagne: 10,
  contacte_sans_retour: 10,
  injoignables: 5,
  coordonnees_incorrectes: 5,
  autre: 5,
  cherche_contrat: 0,
  reorientation: 0,
  ne_veut_pas_accompagnement: 0,
  ne_souhaite_pas_etre_recontacte: 0,
  autre_avec_contact: 2,
  deja_connu: 8,
  ...STATS_ZEROS,
};

const STATS_ARA = {
  total: 50,
  a_traiter: 20,
  traite: 30,
  rdv_pris: 10,
  rdv_pris_decouverts: 3,
  nouveau_projet: 8,
  deja_accompagne: 5,
  contacte_sans_retour: 3,
  injoignables: 2,
  coordonnees_incorrectes: 1,
  autre: 1,
  cherche_contrat: 0,
  reorientation: 0,
  ne_veut_pas_accompagnement: 0,
  ne_souhaite_pas_etre_recontacte: 0,
  autre_avec_contact: 1,
  deja_connu: 4,
  ...STATS_ZEROS,
};

const STATS_HDF = {
  ...STATS_ARA,
  total: 7,
  a_traiter: 3,
  traite: 4,
  rdv_pris: 4,
  rdv_pris_decouverts: 0,
  nouveau_projet: 0,
  deja_accompagne: 0,
  contacte_sans_retour: 0,
  injoignables: 0,
  coordonnees_incorrectes: 0,
  autre: 0,
  autre_avec_contact: 0,
  deja_connu: 0,
};

const SEGMENTS_IDF = {
  rupture: {
    total: 60,
    a_traiter: 20,
    traite: 40,
    repondu: 25,
    rdv_pris: 15,
    rdv_pris_decouverts: 5,
    projet_pro_securise: 5,
    ne_souhaite_pas_accompagnement: 3,
    a_recontacter: 8,
    injoignable: 4,
    autre: 5,
    autre_avec_contact: 2,
    deja_connu_accompagne: 6,
  },
  collab: {
    total: 12,
    a_traiter: 2,
    traite: 10,
    repondu: 7,
    rdv_pris: 5,
    rdv_pris_decouverts: 2,
    projet_pro_securise: 1,
    ne_souhaite_pas_accompagnement: 1,
    a_recontacter: 1,
    injoignable: 1,
    autre: 1,
    autre_avec_contact: 0,
    deja_connu_accompagne: 4,
    situation_rupture: 8,
    situation_abandon: 1,
    situation_prevention_inevitable: 1,
    situation_prevention_tres_eleve: 1,
    situation_prevention_modere: 1,
    situation_besoin_aide_hors_rupture: 0,
    delai_premiere_activite_jours_total: 30,
    delai_premiere_activite_count: 10,
  },
};

const buildCollabDossier = (missionLocaleId: ObjectId, organismeId: ObjectId, motif: string[]) =>
  ({
    _id: new ObjectId(),
    mission_locale_id: missionLocaleId,
    effectif_id: new ObjectId(),
    created_at: new Date("2026-03-01"),
    situation: null,
    effectif_snapshot: {
      organisme_id: organismeId,
      apprenant: { date_de_naissance: new Date(new Date().getFullYear() - 20, 0, 1) },
    },
    organisme_data: {
      acc_conjoint: true,
      acc_conjoint_at: new Date("2026-03-10"),
      reponse_at: new Date("2026-03-10"),
      has_unread_notification: false,
      motif,
    },
  }) as unknown as IMissionLocaleEffectif;

describe("Indicateurs ML routes (territoriales)", () => {
  useNock();
  useMongo();

  let httpClient: AxiosInstance;
  let requestAsOrganisation: RequestAsOrganisationFunc;

  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;

    await regionsDb().insertMany([
      { _id: new ObjectId(), code: "11", nom: "Île-de-France" },
      { _id: new ObjectId(), code: "84", nom: "Auvergne-Rhône-Alpes" },
      { _id: new ObjectId(), code: "32", nom: "Hauts-de-France" },
    ]);

    const mlBase = {
      created_at: new Date(),
      activated_at: new Date("2025-01-01"),
      email: "",
      telephone: "",
      site_web: "",
    };
    await organisationsDb().insertMany([
      { _id: ML_IDF, ...mlBase, adresse: { region: "11" }, ml_id: 701, nom: "ML IDF", type: "MISSION_LOCALE" },
      { _id: ML_ARA, ...mlBase, adresse: { region: "84" }, ml_id: 702, nom: "ML ARA", type: "MISSION_LOCALE" },
      { _id: ML_SANS_REGION, ...mlBase, ml_id: 703, nom: "ML SANS REGION", type: "MISSION_LOCALE" },
      { _id: ML_HDF, ...mlBase, adresse: { region: "32" }, ml_id: 704, nom: "ML HDF", type: "MISSION_LOCALE" },
    ]);

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await missionLocaleStatsDb().insertMany([
      {
        _id: new ObjectId(),
        mission_locale_id: ML_IDF,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: STATS_IDF as IMissionLocaleStats["stats"],
        segments: SEGMENTS_IDF,
      },
      {
        _id: new ObjectId(),
        mission_locale_id: ML_ARA,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: STATS_ARA as IMissionLocaleStats["stats"],
      },
      {
        _id: new ObjectId(),
        mission_locale_id: ML_HDF,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: STATS_HDF as IMissionLocaleStats["stats"],
      },
    ]);

    await missionLocaleEffectifsDb().insertMany(
      [
        buildCollabDossier(ML_IDF, CFA_A, ["MOBILITE", "LOGEMENT"]),
        buildCollabDossier(ML_IDF, CFA_A, ["MOBILITE"]),
        buildCollabDossier(ML_ARA, CFA_B, []),
      ],
      { bypassDocumentValidation: true }
    );
  });

  it("Requiert une authentification", async () => {
    const response = await httpClient.get("/api/v1/organisation/indicateurs-ml/traitement");
    expect(response.status).toBe(401);
  });

  describe("paramètre segment", () => {
    it("Rejette un segment inconnu", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/rupturants?segment=foo"
      );
      expect(response.status).toBe(400);
    });

    it("Lit segments.rupture par défaut et se replie sur stats pour les documents sans segments", async () => {
      const response = await requestAsOrganisation(ADMIN, "get", "/api/v1/organisation/indicateurs-ml/traitement");

      expect(response.status).toBe(200);
      expect(response.data.segment).toBe("rupture");
      expect(response.data.latest.total).toBe(60 + 50 + 7);
      expect(response.data.latest.total_contacte).toBe(40 + 30 + 4);
      expect(response.data.latest.total_repondu).toBe(25 + (10 + 8 + 1) + 4);
      expect(response.data.latest.total_accompagne).toBe(5 + 3);
    });

    it("segment=all lit stats et segment=collab renvoie 0 sans segments", async () => {
      const all = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/traitement?segment=all"
      );
      expect(all.data.latest.total).toBe(157);

      const collab = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/traitement?segment=collab"
      );
      expect(collab.data.latest.total).toBe(12);
      expect(collab.data.latest.total_contacte).toBe(10);
    });

    it("dossiers-traites applique D14 au repli (autre = autre + déjà accompagné)", async () => {
      const rupture = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/dossiers-traites"
      );
      expect(rupture.status).toBe(200);
      expect(rupture.data.detailsV2.total).toBe(40 + 30 + 4);
      expect(rupture.data.detailsV2.autre.current).toBe(5 + (1 + 5));
      expect(rupture.data.detailsV2.injoignable.current).toBe(4 + (2 + 1));
      expect(rupture.data.deja_connu_accompagne).toBe(6);

      const all = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/dossiers-traites?segment=all"
      );
      expect(all.data.detailsV2.total).toBe(70 + 30 + 4);
      expect(all.data.deja_connu_accompagne).toBeNull();

      const collab = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/dossiers-traites?segment=collab"
      );
      expect(collab.data.detailsV2.total).toBe(10);
      expect(collab.data.traites).toBe(10);
    });

    it("rupturants renvoie la série et le résumé du segment", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/rupturants?segment=collab&period=all"
      );
      expect(response.status).toBe(200);
      expect(response.data.summary.total).toBe(12);
      expect(response.data.summary.a_traiter.current).toBe(2);
      expect(response.data.summary.traites.current).toBe(10);
      expect(response.data.timeSeries.at(-1).stats[0].total).toBe(12);
    });

    it("traitement/regions lit tous les segments par défaut et accepte segment=collab", async () => {
      const all = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/regions"
      );
      expect(all.status).toBe(200);
      const idf = all.data.find((r: { code: string }) => r.code === "11");
      expect(idf).toMatchObject({ total_jeunes: 100, a_traiter: 30, traites: 70, pourcentage_traites: 70 });

      const collab = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/regions?segment=collab"
      );
      const idfCollab = collab.data.find((r: { code: string }) => r.code === "11");
      const araCollab = collab.data.find((r: { code: string }) => r.code === "84");
      expect(idfCollab).toMatchObject({ total_jeunes: 12, a_traiter: 2, traites: 10 });
      expect(araCollab).toMatchObject({ total_jeunes: 0, a_traiter: 0, traites: 0 });
    });
  });

  describe("GET /stats/traitement/ml", () => {
    it("Renvoie les tranches V2 et le délai moyen du segment collab, triable", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml?segment=collab&sort_by=delai_moyen_jours&sort_order=desc"
      );

      expect(response.status).toBe(200);
      expect(response.data.segment).toBe("collab");
      expect(response.data.data[0]).toMatchObject({
        nom: "ML IDF",
        total_jeunes: 12,
        a_traiter: 2,
        traites: 10,
        pourcentage_traites: 83,
        delai_moyen_jours: 3,
        details: {
          rdv_pris: 5,
          projet_pro_securise: 1,
          ne_souhaite_pas_accompagnement: 1,
          a_recontacter: 1,
          injoignable: 1,
          autre: 1,
        },
      });
      const ara = response.data.data.find((ml: { nom: string }) => ml.nom === "ML ARA");
      expect(ara).toMatchObject({ total_jeunes: 0, delai_moyen_jours: null });
    });

    it("Distingue les ML activées de celles qui n'ont pas de date d'activation", async () => {
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "11" },
        ml_id: 705,
        nom: "ML NON ACTIVEE",
        type: "MISSION_LOCALE",
      } as never);

      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml?limit=100"
      );
      const byName = Object.fromEntries(
        response.data.data.map((ml: { nom: string; is_activated: boolean }) => [ml.nom, ml.is_activated])
      );
      expect(byName["ML NON ACTIVEE"]).toBe(false);
      expect(byName["ML IDF"]).toBe(true);
    });

    it("Filtre par département, utilisation du service et engagement", async () => {
      await organisationsDb().updateOne({ _id: ML_IDF }, { $set: { "adresse.departement": "92" } });
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "11", departement: "75" },
        ml_id: 707,
        nom: "ML PARIS NON ACTIVEE",
        type: "MISSION_LOCALE",
      } as never);

      const noms = async (query: string) => {
        const response = await requestAsOrganisation(
          DREETS_IDF,
          "get",
          `/api/v1/organisation/indicateurs-ml/stats/traitement/ml?limit=100&${query}`
        );
        expect(response.status, query).toBe(200);
        return response.data.data.map((ml: { nom: string }) => ml.nom).sort();
      };

      expect(await noms("departements=92")).toEqual(["ML IDF"]);
      expect(await noms("departements=75,92")).toEqual(["ML IDF", "ML PARIS NON ACTIVEE"]);
      expect(await noms("utilise_service=false")).toEqual(["ML PARIS NON ACTIVEE"]);
      expect(await noms("engagee=true")).toEqual(["ML IDF"]);
      expect(await noms("engagee=false&utilise_service=true")).toEqual([]);
    });

    it("Refuse un département hors périmètre ou inconnu", async () => {
      for (const departements of ["69", "XX"]) {
        expectForbidden(
          await requestAsOrganisation(
            DREETS_IDF,
            "get",
            `/api/v1/organisation/indicateurs-ml/stats/traitement/ml?departements=${departements}`
          ),
          "Accès non autorisé à ce département"
        );
      }
    });

    it("Le délai moyen est null hors segment collab et sort_by est énuméré", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml?sort_by=total_jeunes"
      );
      expect(response.status).toBe(200);
      expect(response.data.data[0]).toMatchObject({ nom: "ML IDF", total_jeunes: 60, delai_moyen_jours: null });

      const ascending = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml?segment=collab&sort_by=delai_moyen_jours&sort_order=asc"
      );
      expect(ascending.data.data[0]).toMatchObject({ nom: "ML IDF", delai_moyen_jours: 3 });
      expect(ascending.data.data.at(-1).delai_moyen_jours).toBeNull();
      expect(response.data.data[0].details).toEqual({
        rdv_pris: 15,
        projet_pro_securise: 5,
        ne_souhaite_pas_accompagnement: 3,
        a_recontacter: 8,
        injoignable: 4,
        autre: 5,
      });

      const invalid = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml?sort_by=foo"
      );
      expect(invalid.status).toBe(400);
    });
  });

  describe("périmètre territorial", () => {
    it("Une ARML ne voit que sa région et ne peut pas en demander une autre", async () => {
      const own = await requestAsOrganisation(ARML_IDF, "get", "/api/v1/organisation/indicateurs-ml/stats/rupturants");
      expect(own.status).toBe(200);
      expect(own.data.summary.total).toBe(60);

      const other = await requestAsOrganisation(
        ARML_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/rupturants?region=84"
      );
      expectForbidden(other, "Accès non autorisé à cette région");
    });

    it("Refuse une organisation territoriale sans périmètre au lieu de lui ouvrir le national", async () => {
      const response = await requestAsOrganisation(
        ARML_SANS_REGION,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/rupturants"
      );
      expectForbidden(response, "Aucun périmètre territorial n'est rattaché à votre organisation");
    });

    it("Restreint chaque lecteur au périmètre de l'ARML, avec ou sans paramètre", async () => {
      const scoped: Array<[string, (data: Record<string, unknown>) => unknown, unknown]> = [
        ["/traitement", (d) => (d.latest as { total: number }).total, 60],
        ["/stats/rupturants", (d) => (d.summary as { total: number }).total, 60],
        ["/stats/dossiers-traites", (d) => d.traites, 40],
        ["/stats/traitement/ml", (d) => (d.pagination as { total: number }).total, 1],
        ["/stats/traitement/regions", (d) => (d as unknown as Array<{ code: string }>).map((r) => r.code), ["11"]],
        ["/stats/couverture-regions", (d) => (d.regions as Array<{ code: string }>).map((r) => r.code), ["11"]],
        ["/synthese/regions", (d) => (d.regions as Array<{ code: string }>).map((r) => r.code), ["11"]],
        ["/stats/collaborations", (d) => (d.objectifs as { total_dossiers: number }).total_dossiers, 2],
      ];
      for (const [path, pick, expected] of scoped) {
        const response = await requestAsOrganisation(ARML_IDF, "get", `/api/v1/organisation/indicateurs-ml${path}`);
        expect(response.status, path).toBe(200);
        expect(pick(response.data), path).toEqual(expected);
      }

      for (const path of ["/traitement", "/stats/dossiers-traites", "/stats/traitement/ml", "/stats/collaborations"]) {
        const other = await requestAsOrganisation(
          ARML_IDF,
          "get",
          `/api/v1/organisation/indicateurs-ml${path}?region=84`
        );
        expectForbidden(other, "Accès non autorisé à cette région");
      }

      for (const path of ["detail", "membres"]) {
        const other = await requestAsOrganisation(
          ARML_IDF,
          "get",
          `/api/v1/organisation/indicateurs-ml/mission-locale/${ML_ARA}/${path}`
        );
        expectForbidden(other, "Accès non autorisé à cette Mission Locale");
      }

      for (const path of ["/stats/whatsapp", "/stats/prequalif"]) {
        const response = await requestAsOrganisation(ARML_IDF, "get", `/api/v1/organisation/indicateurs-ml${path}`);
        expect(response.status, path).toBe(403);
      }
    });

    it("Un admin sans région voit tout", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/ml"
      );
      expect(response.data.pagination.total).toBe(4);
    });

    it("Une ARML à deux régions sans paramètre region est limitée à ses régions", async () => {
      const traitement = await requestAsOrganisation(
        ARML_IDF_ARA,
        "get",
        "/api/v1/organisation/indicateurs-ml/traitement"
      );
      expect(traitement.status).toBe(200);
      expect(traitement.data.latest.total).toBe(60 + 50);

      const rupturants = await requestAsOrganisation(
        ARML_IDF_ARA,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/rupturants"
      );
      expect(rupturants.data.summary.total).toBe(60 + 50);

      const exportData = await requestAsOrganisation(
        ARML_IDF_ARA,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/export"
      );
      expect(exportData.data.rows_rupture.map((r: { nom: string }) => r.nom).sort()).toEqual(["ML ARA", "ML IDF"]);
      expect(exportData.data.regionData).toHaveLength(2);
    });
  });

  describe("GET /synthese/deployment et /synthese/regions", () => {
    const deployment = (org: IOrganisationCreate, query = "") =>
      requestAsOrganisation(org, "get", `/api/v1/organisation/indicateurs-ml/synthese/deployment${query}`);

    it("Une DREETS voit le déploiement de sa région, et le national sur demande", async () => {
      const own = await deployment(DREETS_IDF);
      expect(own.status).toBe(200);
      expect(own.data.summary).toMatchObject({ mlCount: 1, activatedMlCount: 1, engagedMlCount: 1 });

      const national = await deployment(DREETS_IDF, "?national=true");
      expect(national.data.summary).toMatchObject({ mlCount: 4, activatedMlCount: 4, engagedMlCount: 1 });

      const notNational = await deployment(DREETS_IDF, "?national=false");
      expect(notNational.data.summary).toMatchObject({ mlCount: 1, activatedMlCount: 1 });

      expect((await deployment(DREETS_IDF, "?national=oui")).status).toBe(400);

      const regions = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/synthese/regions"
      );
      expect(regions.data.regions.map((r: { code: string }) => r.code)).toEqual(["11"]);
    });

    it("Compare au premier snapshot sur toute la période, en régional comme en national", async () => {
      const regional = await deployment(DREETS_IDF, "?period=all");
      expect(regional.data.summary).toMatchObject({ activatedMlCount: 1, previousActivatedMlCount: 1 });

      const national = await deployment(DREETS_IDF, "?period=all&national=true");
      expect(national.data.summary).toMatchObject({ activatedMlCount: 4, previousActivatedMlCount: 4 });
    });

    it("Refuse à une DREETS une autre région", async () => {
      expectForbidden(await deployment(DREETS_IDF, "?region=84"), "Accès non autorisé à cette région");
    });

    it("Un admin peut cibler n'importe quelle région", async () => {
      const response = await deployment(ADMIN, "?region=84");
      expect(response.data.summary).toMatchObject({ mlCount: 1, activatedMlCount: 1, engagedMlCount: 0 });
    });
  });

  describe("GET /stats/couverture-departements", () => {
    it("Ventile les ML de la région par département", async () => {
      await organisationsDb().updateOne({ _id: ML_IDF }, { $set: { "adresse.departement": "92" } });
      await organisationsDb().insertOne({
        _id: new ObjectId(),
        created_at: new Date(),
        activated_at: new Date("2025-01-01"),
        email: "",
        telephone: "",
        site_web: "",
        adresse: { region: "11", departement: "75" },
        ml_id: 706,
        nom: "ML PARIS",
        type: "MISSION_LOCALE",
      } as never);

      const response = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/couverture-departements?region=11"
      );

      expect(response.status).toBe(200);
      const byCode = Object.fromEntries(response.data.departements.map((d: { code: string }) => [d.code, d]));
      expect(Object.keys(byCode).sort()).toEqual(["75", "92"]);
      expect(byCode["92"]).toMatchObject({
        nom: "Hauts-de-Seine",
        ml_total: 1,
        ml_activees: 1,
        ml_engagees: 1,
        a_traiter: 30,
        traites: 70,
      });
      expect(byCode["75"]).toMatchObject({ nom: "Paris", ml_total: 1, ml_activees: 1, ml_engagees: 0, traites: 0 });
    });

    it("Regroupe les ML sans département dans une ligne « Département inconnu »", async () => {
      const response = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/couverture-departements?region=11"
      );

      expect(response.data.departements).toEqual([
        expect.objectContaining({ code: "inconnu", nom: "Département inconnu", ml_total: 1, traites: 70 }),
      ]);
    });

    it("Refuse une région hors périmètre et exige une région", async () => {
      expectForbidden(
        await requestAsOrganisation(
          DREETS_IDF,
          "get",
          "/api/v1/organisation/indicateurs-ml/stats/couverture-departements?region=84"
        ),
        "Accès non autorisé à cette région"
      );
      const sansRegion = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/couverture-departements"
      );
      expect(sansRegion.status).toBe(400);
    });
  });

  describe("GET /stats/cfa/adoption", () => {
    const buildOrganisme = (id: ObjectId, region: string, extra: Record<string, unknown> = {}) => ({
      _id: id,
      created_at: new Date(),
      updated_at: new Date(),
      adresse: { region },
      est_dans_le_referentiel: "present",
      ...extra,
    });

    beforeEach(async () => {
      await organismesDb().insertMany(
        [
          buildOrganisme(CFA_A, "11", { has_account: true }),
          buildOrganisme(new ObjectId(), "11"),
          buildOrganisme(new ObjectId(), "11", { ferme: true, has_account: true }),
          buildOrganisme(new ObjectId(), "11", { est_dans_le_referentiel: "absent" }),
          buildOrganisme(CFA_B, "84", { has_account: true }),
        ] as never[],
        { bypassDocumentValidation: true }
      );
    });

    it("Compte les CFA du référentiel non fermés de la région et ceux qui ont collaboré", async () => {
      const response = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/cfa/adoption"
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        estimation: 2,
        compatibles: 0,
        avec_compte: 1,
        avec_collaboration: { current: 1 },
      });
    });

    it("Ouvre le national et refuse une autre région", async () => {
      const national = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/cfa/adoption?national=true"
      );
      expect(national.data).toMatchObject({ estimation: 3, avec_compte: 2, avec_collaboration: { current: 2 } });

      expectForbidden(
        await requestAsOrganisation(
          DREETS_IDF,
          "get",
          "/api/v1/organisation/indicateurs-ml/stats/cfa/adoption?region=84"
        ),
        "Accès non autorisé à cette région"
      );
    });
  });

  describe("GET /stats/cfa/etablissements", () => {
    const BASE = "/api/v1/organisation/indicateurs-ml/stats/cfa/etablissements";
    const CFA_ALPHA = new ObjectId();
    const CFA_GAMMA = new ObjectId();
    const DERNIERE_CONNEXION = new Date("2026-09-01T10:00:00.000Z");

    const buildOrganisme = (id: ObjectId, adresse: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
      _id: id,
      created_at: new Date(),
      updated_at: new Date(),
      siret: id.toString().slice(0, 14),
      adresse,
      est_dans_le_referentiel: "present",
      ...extra,
    });
    const noms = (response: { data: { data: Array<{ nom: string }> } }) => response.data.data.map((row) => row.nom);

    beforeEach(async () => {
      const idf = { region: "11", departement: "75", commune: "Paris", code_postal: "75011" };
      await organismesDb().insertMany(
        [
          buildOrganisme(CFA_A, idf, {
            enseigne: "Beta",
            nature: "responsable",
            qualiopi: true,
            has_account: true,
            is_allowed_collab: true,
          }),
          buildOrganisme(
            CFA_ALPHA,
            { region: "11", departement: "77", commune: "Melun", code_postal: "77000" },
            { raison_sociale: " Alpha", uai: "0771234A", qualiopi: false }
          ),
          buildOrganisme(CFA_GAMMA, idf, {
            enseigne: "Gamma",
            nature: "formateur",
            is_allowed_collab: true,
            collab_suspended_at: new Date(),
          }),
          buildOrganisme(new ObjectId(), idf, { enseigne: "Fermé", ferme: true }),
          buildOrganisme(CFA_B, { region: "84", departement: "69", commune: "Lyon" }, { enseigne: "Delta" }),
        ] as never[],
        { bypassDocumentValidation: true }
      );
      const { insertedId: organisationId } = await organisationsDb().insertOne(
        { _id: new ObjectId(), type: "ORGANISME_FORMATION", organisme_id: CFA_A.toString() } as never,
        { bypassDocumentValidation: true }
      );
      await usersMigrationDb().insertMany(
        [
          {
            _id: new ObjectId(),
            organisation_id: organisationId,
            account_status: "CONFIRMED",
            last_connection: DERNIERE_CONNEXION,
          },
          {
            _id: new ObjectId(),
            organisation_id: organisationId,
            account_status: "PENDING_EMAIL_VALIDATION",
            last_connection: new Date(),
          },
        ] as never[],
        { bypassDocumentValidation: true }
      );
    });

    it("Liste les CFA de la région, triés par collaborations, avec compte et dernière connexion", async () => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", BASE);

      expect(response.status).toBe(200);
      expect(response.data.pagination).toEqual({ page: 1, limit: 10, total: 3, totalPages: 1 });
      expect(noms(response)).toEqual(["Beta", "Alpha", "Gamma"]);
      expect(response.data.data[0]).toMatchObject({
        id: CFA_A.toString(),
        has_account: true,
        collab_active: true,
        derniere_activite: DERNIERE_CONNEXION.toISOString(),
      });
      expect(response.data.data[0].nb_collaborations).toBeGreaterThan(0);
      expect(response.data.data[2]).toMatchObject({
        collab_active: false,
        nb_collaborations: 0,
        derniere_activite: null,
      });
    });

    it.each([
      ["natures=inconnue", ["Alpha"]],
      ["utilisateur=false", ["Alpha", "Gamma"]],
      ["qualiopi=true", ["Beta"]],
      ["collab_active=true", ["Beta"]],
      ["collab_active=false", ["Alpha", "Gamma"]],
      ["departements=77", ["Alpha"]],
      ["search=0771", ["Alpha"]],
      ["search=melun", ["Alpha"]],
      ["sort_by=nom&sort_order=asc", ["Alpha", "Beta", "Gamma"]],
      ["sort_by=activite&sort_order=asc", ["Beta", "Alpha", "Gamma"]],
    ])("Filtre et trie : %s", async (query, expected) => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?${query}`);

      expect(response.status).toBe(200);
      expect(noms(response)).toEqual(expected);
    });

    it("Pagine, refuse un territoire hors périmètre et exporte sans pagination", async () => {
      const page2 = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?limit=2&page=2`);
      expect(noms(page2)).toEqual(["Gamma"]);
      expect(page2.data.pagination.totalPages).toBe(2);

      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?region=84`),
        "Accès non autorisé à cette région"
      );
      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?departements=69`),
        "Accès non autorisé à ce département"
      );

      const exportAdmin = await requestAsOrganisation(ADMIN, "get", `${BASE}/export?sort_by=nom&sort_order=asc`);
      expect(exportAdmin.status).toBe(200);
      expect(noms({ data: exportAdmin.data })).toEqual(["Alpha", "Beta", "Delta", "Gamma"]);
    });
  });

  describe("GET /stats/cfa/invites-sans-collab", () => {
    it("Limite les alertes à la région de la DREETS et refuse une autre région", async () => {
      const BASE = "/api/v1/organisation/indicateurs-ml/stats/cfa/invites-sans-collab";
      await organismesDb().insertMany(
        [
          {
            _id: CFA_A,
            siret: "11111111100011",
            nom: "CFA IDF",
            adresse: { region: "11" },
            est_dans_le_referentiel: "present",
          },
          {
            _id: CFA_B,
            siret: "22222222200022",
            nom: "CFA ARA",
            adresse: { region: "84" },
            est_dans_le_referentiel: "present",
          },
        ] as never[],
        { bypassDocumentValidation: true }
      );
      await missionLocaleCfaInvitationsDb().insertMany(
        [CFA_A, CFA_B].map((organismeId) => ({
          _id: new ObjectId(),
          mission_locale_id: ML_IDF,
          author_id: new ObjectId(),
          organisme_id: organismeId,
          organisation_id: new ObjectId(),
          siret: "00000000000000",
          destinataires: [],
          created_at: new Date(),
        })) as never[],
        { bypassDocumentValidation: true }
      );
      await missionLocaleEffectifsDb().deleteMany({});

      const region = await requestAsOrganisation(DREETS_IDF, "get", BASE);
      expect(region.status).toBe(200);
      expect(region.data.data.map((row: { raison_sociale: string }) => row.raison_sociale)).toEqual(["CFA IDF"]);

      const exportAdmin = await requestAsOrganisation(ADMIN, "get", `${BASE}/export`);
      expect(exportAdmin.data.data).toHaveLength(2);

      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?region=84`),
        "Accès non autorisé à cette région"
      );
    });
  });

  describe("GET /stats/collaborations/mensuel", () => {
    const BASE = "/api/v1/organisation/indicateurs-ml/stats/collaborations/mensuel";
    const monthKey = (date: Date) =>
      new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit" }).format(date);

    it("Regroupe par mois d'envoi les dossiers envoyés, contactés et acceptés du territoire", async () => {
      const now = new Date();
      const ceMois = new Date(now.getTime() - 60_000);
      const moisDernier = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 11));
      const dossier = (envoi: Date, situation: string | null, extra: Record<string, unknown> = {}) => {
        const base = buildCollabDossier(ML_IDF, CFA_A, []);
        return {
          ...base,
          situation,
          organisme_data: { ...base.organisme_data, acc_conjoint_at: envoi },
          ...extra,
        };
      };
      await missionLocaleEffectifsDb().insertMany(
        [
          dossier(moisDernier, "RDV_PRIS"),
          dossier(moisDernier, "CONTACTE_SANS_RETOUR"),
          dossier(moisDernier, null),
          dossier(ceMois, null),
          dossier(ceMois, "RDV_PRIS", { soft_deleted: true }),
        ] as never[],
        { bypassDocumentValidation: true }
      );

      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?period=3months`);

      expect(response.status).toBe(200);
      const mois = response.data.mois as Array<{ mois: string }>;
      expect(mois.length).toBeGreaterThanOrEqual(3);
      expect(mois[mois.length - 1].mois).toBe(monthKey(now));
      expect(mois.find((row) => row.mois === monthKey(moisDernier))).toEqual({
        mois: monthKey(moisDernier),
        envoyes: 3,
        contactes: 2,
        acceptes: 1,
      });
      expect(mois.find((row) => row.mois === monthKey(now))).toMatchObject({ envoyes: 1, contactes: 0, acceptes: 0 });

      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?region=84`),
        "Accès non autorisé à cette région"
      );
    });
  });

  describe("Activité des CFA : NPS et injoignables", () => {
    const CFA_C = new ObjectId();
    const CFA_D = new ObjectId();
    const UTILISATEUR_1 = new ObjectId();
    const UTILISATEUR_2 = new ObjectId();

    const dossier = (organismeId: ObjectId, extra: { situation?: string; note?: number; auteur?: ObjectId } = {}) => {
      const base = buildCollabDossier(ML_IDF, organismeId, []);
      return {
        ...base,
        situation: extra.situation ?? null,
        organisme_data: {
          ...base.organisme_data,
          acc_conjoint_by: extra.auteur,
          ...(extra.note !== undefined ? { form_feedback: { note: extra.note, responded_at: new Date() } } : {}),
        },
      };
    };

    beforeEach(async () => {
      const organisme = (id: ObjectId, region: string, nom: string) => ({
        _id: id,
        siret: id.toString().slice(0, 14),
        nom,
        enseigne: nom,
        adresse: { region, commune: nom },
        est_dans_le_referentiel: "present",
      });
      await organismesDb().insertMany(
        [
          organisme(CFA_A, "11", "CFA A"),
          organisme(CFA_B, "84", "CFA B"),
          organisme(CFA_C, "11", "CFA C"),
          organisme(CFA_D, "11", "CFA D"),
        ] as never[],
        { bypassDocumentValidation: true }
      );
    });

    it("Calcule le NPS adapté (5 promoteur, 4 neutre, 0 à 3 détracteur) sur les CFA du territoire", async () => {
      await missionLocaleEffectifsDb().insertMany(
        [
          dossier(CFA_A, { note: 5, auteur: UTILISATEUR_1 }),
          dossier(CFA_A, { note: 5, auteur: UTILISATEUR_1 }),
          dossier(CFA_A, { note: 4, auteur: UTILISATEUR_2 }),
          dossier(CFA_A, { note: 2, auteur: UTILISATEUR_2 }),
          dossier(CFA_B, { note: 5, auteur: new ObjectId() }),
        ] as never[],
        { bypassDocumentValidation: true }
      );

      const region = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/cfa/nps"
      );
      expect(region.data).toEqual({ nps: 25, total_reponses: 4, utilisateurs: 2, cfa: 1 });

      const national = await requestAsOrganisation(
        DREETS_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/cfa/nps?national=true"
      );
      expect(national.data).toEqual({ nps: 40, total_reponses: 5, utilisateurs: 3, cfa: 2 });
    });

    it("Signale les CFA à plus de 25 % d'injoignables, à partir de 4 dossiers traités", async () => {
      const BASE = "/api/v1/organisation/indicateurs-ml/stats/cfa/injoignables";
      await missionLocaleEffectifsDb().insertMany(
        [
          dossier(CFA_A, { situation: "INJOIGNABLE_APRES_RELANCES" }),
          dossier(CFA_A, { situation: "COORDONNEES_INCORRECT" }),
          dossier(CFA_A, { situation: "RDV_PRIS" }),
          dossier(CFA_A, { situation: "RDV_PRIS" }),
          ...["INJOIGNABLE_APRES_RELANCES", "RDV_PRIS", "AUTRE", "RDV_PRIS"].map((situation) =>
            dossier(CFA_C, { situation })
          ),
          ...[1, 2, 3].map(() => dossier(CFA_D, { situation: "INJOIGNABLE_APRES_RELANCES" })),
          dossier(CFA_B, { situation: "INJOIGNABLE_APRES_RELANCES" }),
        ] as never[],
        { bypassDocumentValidation: true }
      );

      const response = await requestAsOrganisation(DREETS_IDF, "get", BASE);
      expect(response.status).toBe(200);
      expect(response.data.total).toBe(1);
      expect(response.data.data[0]).toMatchObject({
        organisme_id: CFA_A.toString(),
        traites: 4,
        injoignables: 2,
        taux: 50,
      });

      const exportResponse = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}/export`);
      expect(exportResponse.data.data).toHaveLength(1);

      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?region=84`),
        "Accès non autorisé à cette région"
      );
    });
  });

  describe("GET /stats/collaborations/dossiers", () => {
    const BASE = "/api/v1/organisation/indicateurs-ml/stats/collaborations/dossiers";
    const CFA_C = new ObjectId();
    const ML_USER = new ObjectId();
    const D_A_TRAITER = new ObjectId();
    const D_RDV = new ObjectId();
    const D_RECONTACTER = new ObjectId();

    const dossier = (
      id: ObjectId,
      organismeId: ObjectId,
      {
        situation = null,
        envoi = new Date("2026-03-10"),
        nom = "Martin",
      }: { situation?: string | null; envoi?: Date; nom?: string }
    ) => {
      const base = buildCollabDossier(ML_IDF, organismeId, ["MOBILITE"]);
      return {
        ...base,
        _id: id,
        situation,
        effectif_snapshot: {
          ...base.effectif_snapshot,
          apprenant: { nom, prenom: "Test", telephone: "0600000000", courriel: "jeune@example.org" },
        },
        organisme_data: { ...base.organisme_data, acc_conjoint_at: envoi },
      };
    };

    beforeEach(async () => {
      await missionLocaleEffectifsDb().deleteMany({});
      await organismesDb().insertMany(
        [
          { _id: CFA_A, siret: "11111111100011", nom: "CFA A", adresse: { region: "11", departement: "75" } },
          { _id: CFA_C, siret: "33333333300033", nom: "Lycée Eiffel", adresse: { region: "11", departement: "77" } },
          { _id: CFA_B, siret: "22222222200022", nom: "CFA B", adresse: { region: "84", departement: "69" } },
        ] as never[],
        { bypassDocumentValidation: true }
      );
      await missionLocaleEffectifsDb().insertMany(
        [
          dossier(D_A_TRAITER, CFA_A, {}),
          dossier(D_RDV, CFA_A, { situation: "RDV_PRIS" }),
          dossier(D_RECONTACTER, CFA_C, { situation: "CONTACTE_SANS_RETOUR", nom: "Dupont" }),
          dossier(new ObjectId(), CFA_B, {}),
          dossier(new ObjectId(), CFA_A, { envoi: new Date("2025-12-01") }),
        ] as never[],
        { bypassDocumentValidation: true }
      );
      await usersMigrationDb().insertOne({ _id: ML_USER, organisation_id: ML_IDF } as never, {
        bypassDocumentValidation: true,
      });
      await missionLocaleEffectifsLogDb().insertMany(
        [
          { mission_locale_effectif_id: D_RDV, created_at: new Date("2026-03-15"), created_by: ML_USER },
          { mission_locale_effectif_id: D_RECONTACTER, created_at: new Date("2026-04-05"), created_by: ML_USER },
        ].map((log) => ({ _id: new ObjectId(), read_by: [], ...log })) as never[],
        { bypassDocumentValidation: true }
      );
    });

    it("Liste les dossiers envoyés depuis 2026 par les CFA de la région, sans coordonnées du jeune", async () => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", BASE);

      expect(response.status).toBe(200);
      expect(response.data.total).toBe(3);
      expect(JSON.stringify(response.data)).not.toMatch(/0600000000|jeune@example\.org|telephone|courriel/);
      const rdv = response.data.data.find((row: { id: string }) => row.id === D_RDV.toString());
      expect(Object.keys(rdv.jeune).sort()).toEqual(["nom", "prenom"]);
      expect(rdv).toMatchObject({
        statut: "traite",
        resultat: "rdv_pris",
        delai_jours: 5,
        traite_par_ml: true,
        mission_locale: { id: ML_IDF.toString(), nom: "ML IDF" },
        cfa: { id: CFA_A.toString(), nom: "CFA A" },
      });
      expect(response.data.filtres.cfa.map((cfa: { nom: string }) => cfa.nom)).toEqual(["CFA A", "Lycée Eiffel"]);
    });

    it.each([
      ["statuts=a_traiter", [D_A_TRAITER]],
      ["statuts=a_recontacter,traite", [D_RDV, D_RECONTACTER]],
      ["delais=0_10", [D_RDV]],
      ["delais=21_30", [D_RECONTACTER]],
      ["delais=30_plus", [D_A_TRAITER]],
      ["resultats=a_recontacter", [D_RECONTACTER]],
      ["departements=77", [D_RECONTACTER]],
      [`cfa_ids=${CFA_C}`, [D_RECONTACTER]],
      ["search=dupont", [D_RECONTACTER]],
      ["search=eiffel", [D_RECONTACTER]],
      ["date_fin=2026-01-31", []],
      ["date_debut=2026-03-10&date_fin=2026-03-10", [D_A_TRAITER, D_RDV, D_RECONTACTER]],
    ])("Filtre : %s", async (query, expected) => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?${query}`);

      expect(response.status).toBe(200);
      expect(response.data.data.map((row: { id: string }) => row.id).sort()).toEqual(
        expected.map((id) => id.toString()).sort()
      );
    });

    it("Filtre les dates en heure de Paris et traite un dossier qualifié sans log de conseiller", async () => {
      const D_NUIT = new ObjectId();
      const D_WHATSAPP = new ObjectId();
      await missionLocaleEffectifsDb().insertMany(
        [
          // 10/03 23h30 UTC = 11/03 00h30 à Paris
          dossier(D_NUIT, CFA_A, { envoi: new Date("2026-03-10T23:30:00Z") }),
          {
            ...dossier(D_WHATSAPP, CFA_A, {
              situation: "NE_SOUHAITE_PAS_ETRE_RECONTACTE",
              envoi: new Date("2026-03-20"),
            }),
            date_traitement: new Date("2026-03-23"),
          },
        ] as never[],
        { bypassDocumentValidation: true }
      );

      const ids = async (query: string) =>
        (await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?${query}`)).data.data.map(
          (row: { id: string }) => row.id
        );
      expect(await ids("date_fin=2026-03-10")).not.toContain(D_NUIT.toString());
      expect(await ids("date_debut=2026-03-11&date_fin=2026-03-11")).toEqual([D_NUIT.toString()]);

      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?date_debut=2026-03-20`);
      expect(response.data.data.find((row: { id: string }) => row.id === D_WHATSAPP.toString())).toMatchObject({
        statut: "traite",
        traite_par_ml: true,
        delai_jours: 3,
      });
    });

    it("Limite la DDETS à son département et refuse l'ARML", async () => {
      const ddets = await requestAsOrganisation(DDETS_PARIS, "get", BASE);
      expect(ddets.data.total).toBe(2);
      expectForbidden(
        await requestAsOrganisation(DDETS_PARIS, "get", `${BASE}?departements=77`),
        "Accès non autorisé à ce département"
      );
      expectForbidden(
        await requestAsOrganisation(ARML_IDF, "get", BASE),
        "Accès non autorisé à la liste des collaborations"
      );
      expectForbidden(
        await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?region=84`),
        "Accès non autorisé à cette région"
      );
    });

    it("Journalise l'export nominatif", async () => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}/export`);

      expect(response.data.data).toHaveLength(3);
      const logs = await telechargementListesNominativesLogsDb().find({ type: "indicateurs_collaborations" }).toArray();
      expect(logs).toHaveLength(1);
      expect(logs[0].elementList?.sort()).toEqual([D_A_TRAITER, D_RDV, D_RECONTACTER].map(String).sort());
    });
  });

  describe("GET /stats/recherche", () => {
    const BASE = "/api/v1/organisation/indicateurs-ml/stats/recherche";

    beforeEach(async () => {
      const organisme = (id: ObjectId, nom: string, region: string, extra: Record<string, unknown> = {}) => ({
        _id: id,
        siret: id.toString().slice(0, 14),
        enseigne: nom,
        adresse: { region, commune: "Ville", code_postal: "00000", complete: `1 rue ${nom}` },
        est_dans_le_referentiel: "present",
        ...extra,
      });
      await organismesDb().insertMany(
        [
          organisme(CFA_A, "Campus Tech", "11", { has_account: true }),
          organisme(CFA_B, "Tech Lyon", "84"),
          organisme(new ObjectId(), "Tech Fermé", "11", { ferme: true }),
        ] as never[],
        { bypassDocumentValidation: true }
      );
      await missionLocaleCfaInvitationsDb().insertOne(
        {
          _id: new ObjectId(),
          mission_locale_id: ML_IDF,
          author_id: new ObjectId(),
          organisme_id: CFA_A,
          organisation_id: new ObjectId(),
          siret: "00000000000000",
          destinataires: [],
          created_at: new Date(),
        } as never,
        { bypassDocumentValidation: true }
      );
      await organisationsDb().updateOne({ _id: ML_IDF }, { $set: { "adresse.commune": "Créteil" } });
    });

    it("Renvoie les CFA du référentiel de la région avec leurs indicateurs, sans les CFA fermés ni d'autres régions", async () => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?q=tech`);

      expect(response.status).toBe(200);
      expect(response.data.total).toBe(1);
      expect(response.data.data[0]).toMatchObject({
        type: "cfa",
        id: CFA_A.toString(),
        nom: "Campus Tech",
        compte_tba: true,
        invitations_recues: 1,
        collaborations_envoyees: 2,
      });
    });

    it("Trouve une Mission Locale par sa commune, sans accent, avec ses compteurs de ruptures et de collaborations", async () => {
      const response = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?q=creteil`);

      expect(response.data.data).toEqual([
        expect.objectContaining({
          type: "ml",
          id: ML_IDF.toString(),
          compte_tba: true,
          ruptures: { a_traiter: 20, traites: 40 },
          collaborations: { recues: 12, traitees: 10 },
        }),
      ]);
    });

    it("Ouvre toute la France à l'admin, trie par nom, pagine et ignore les recherches trop courtes", async () => {
      const admin = await requestAsOrganisation(ADMIN, "get", `${BASE}?q=tech`);
      expect(admin.data.data.map((row: { nom: string }) => row.nom)).toEqual(["Campus Tech", "Tech Lyon"]);

      const page2 = await requestAsOrganisation(ADMIN, "get", `${BASE}?q=tech&limit=1&page=2`);
      expect(page2.data.pagination).toEqual({ page: 2, limit: 1, total_pages: 2 });
      expect(page2.data.data.map((row: { nom: string }) => row.nom)).toEqual(["Tech Lyon"]);

      const court = await requestAsOrganisation(DREETS_IDF, "get", `${BASE}?q=t`);
      expect(court.data.total).toBe(0);
    });
  });

  describe("GET /stats/collaborations", () => {
    it("Renvoie le bloc collaboration national pour un admin", async () => {
      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/collaborations?national=true"
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        cfa_ayant_collabore: { current: 2 },
        jeunes_envoyes: { current: 12 },
        jeunes_contactes: { current: 10 },
        jeunes_accompagnement_accepte: { current: 5 },
        part_deja_connus: 40,
        delai_moyen_jours: 3,
        situations: {
          rupture: 8,
          abandon: 1,
          prevention_inevitable: 1,
          prevention_tres_eleve: 1,
          prevention_modere: 1,
          besoin_aide_hors_rupture: 0,
          total: 12,
        },
        objectifs: { mobilite: 2, logement: 1, total_dossiers: 3 },
      });
      expect(response.data.resultats.total).toBe(10);
    });

    it("Scope par région pour une ARML et par ml_id vérifié", async () => {
      const region = await requestAsOrganisation(
        ARML_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/collaborations"
      );
      expect(region.status).toBe(200);
      expect(region.data.cfa_ayant_collabore.current).toBe(1);
      expect(region.data.objectifs.total_dossiers).toBe(2);

      const otherMl = await requestAsOrganisation(
        ARML_IDF,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/collaborations?ml_id=${ML_ARA}`
      );
      expectForbidden(otherMl, "Accès non autorisé à cette Mission Locale");

      const mlSansRegion = await requestAsOrganisation(
        ARML_IDF,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/collaborations?ml_id=${ML_SANS_REGION}`
      );
      expectForbidden(mlSansRegion, "Accès non autorisé à cette Mission Locale");

      const adminSansRegion = await requestAsOrganisation(
        ADMIN,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/collaborations?ml_id=${ML_SANS_REGION}`
      );
      expect(adminSansRegion.status).toBe(200);
      expect(adminSansRegion.data.jeunes_envoyes.current).toBe(0);
    });
  });

  describe("GET /stats/traitement/export", () => {
    it("Refuse un ml_id hors région et renvoie les feuilles par segment", async () => {
      const forbidden = await requestAsOrganisation(
        ARML_IDF,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/traitement/export?ml_id=${ML_ARA}`
      );
      expectForbidden(forbidden, "Accès non autorisé à cette Mission Locale");

      const response = await requestAsOrganisation(
        ADMIN,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/traitement/export?ml_id=${ML_IDF}`
      );
      expect(response.status).toBe(200);
      expect(response.data.mlData).toHaveLength(1);
      expect(response.data.regionData).toEqual([]);
      expect(response.data.rows_rupture).toHaveLength(1);
      expect(response.data.rows_rupture[0]).toMatchObject({
        nom: "ML IDF",
        region_nom: "Île-de-France",
        departement_nom: "Département inconnu",
        total_jeunes: 60,
        traites: 40,
        pourcentage_traites: 66.7,
        repondu: 25,
        deja_connu_accompagne: 6,
      });
      expect(response.data.rows_collab[0]).toMatchObject({
        nom: "ML IDF",
        total_jeunes: 12,
        situation_rupture: 8,
        delai_moyen_jours: 3,
      });
    });

    it("Avec national, une ARML exporte toutes les régions", async () => {
      const response = await requestAsOrganisation(
        ARML_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/export?national=true"
      );
      expect(response.status).toBe(200);
      expect(response.data.regionData).toHaveLength(3);
      expect(response.data.rows_rupture).toHaveLength(3);
    });

    it("Sans ml_id, une ARML exporte sa région avec le repli sur stats", async () => {
      const response = await requestAsOrganisation(
        ARML_IDF,
        "get",
        "/api/v1/organisation/indicateurs-ml/stats/traitement/export"
      );
      expect(response.status).toBe(200);
      expect(response.data.rows_rupture.map((r: { nom: string }) => r.nom)).toEqual(["ML IDF"]);
      expect(response.data.rows_collab[0].total_jeunes).toBe(12);
    });
  });
});
