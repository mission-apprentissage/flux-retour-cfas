import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";
import type { IMissionLocaleEffectif, IMissionLocaleStats } from "shared/models";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it } from "vitest";

import { missionLocaleEffectifsDb, missionLocaleStatsDb, organisationsDb, regionsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { useNock } from "@tests/jest/setupNock";
import { expectForbiddenError, initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

const ADMIN: IOrganisationCreate = { type: "ADMINISTRATEUR" };
const ARML_IDF: IOrganisationCreate = { type: "ARML", nom: "ARML IDF", region_list: ["11"] };
const ARML_IDF_ARA: IOrganisationCreate = { type: "ARML", nom: "ARML IDF ARA", region_list: ["11", "84"] };

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
    effectif_snapshot: { organisme_id: organismeId },
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
      expectForbiddenError(other);
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
      expectForbiddenError(otherMl);

      const mlSansRegion = await requestAsOrganisation(
        ARML_IDF,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/collaborations?ml_id=${ML_SANS_REGION}`
      );
      expect(mlSansRegion.status).toBe(200);
      expect(mlSansRegion.data.jeunes_envoyes.current).toBe(0);
    });
  });

  describe("GET /stats/traitement/export", () => {
    it("Refuse un ml_id hors région et renvoie les feuilles par segment", async () => {
      const forbidden = await requestAsOrganisation(
        ARML_IDF,
        "get",
        `/api/v1/organisation/indicateurs-ml/stats/traitement/export?ml_id=${ML_ARA}`
      );
      expectForbiddenError(forbidden);

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
