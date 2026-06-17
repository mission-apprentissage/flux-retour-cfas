import { AxiosInstance } from "axiosist";
import { ObjectId } from "bson";
import { SITUATION_ENUM } from "shared";
import { CONNAISSANCE_ML_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import { it, expect, describe, beforeEach, vi } from "vitest";

import { updateOrDeleteMissionLocaleSnapshot } from "@/common/actions/mission-locale/mission-locale.actions";
import {
  effectifsDb,
  effectifsQueueDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
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

      it("POST avec connaissance_ml dérive deja_connu et persiste les deux champs", async () => {
        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          {
            situation: SITUATION_ENUM.RDV_PRIS,
            connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
          }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT);
        expect(effectif?.deja_connu).toBe(true);
      });

      it("POST avec deja_connu seul wipe une connaissance_ml stale et la trace dans le log", async () => {
        await requestAsOrganisation(ML_DATA, "post", `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`, {
          situation: SITUATION_ENUM.RDV_PRIS,
          connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
        });

        const before = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(before?.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT);

        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          { deja_connu: false }
        );

        expect(res.status).toBe(200);

        const after = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(after?.connaissance_ml).toBeUndefined();
        expect(after?.deja_connu).toBe(false);

        const logs = await missionLocaleEffectifsLogDb()
          .find({ mission_locale_effectif_id: after?._id })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();
        expect(logs[0]?.connaissance_ml).toBeNull();
        expect(logs[0]?.deja_connu).toBe(false);
      });

      it("POST avec connaissance_ml explicite ne déclenche pas le marqueur de wipe dans le log", async () => {
        const res = await requestAsOrganisation(
          ML_DATA,
          "post",
          `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`,
          {
            connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
            deja_connu: true,
          }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        const logs = await missionLocaleEffectifsLogDb()
          .find({ mission_locale_effectif_id: effectif?._id })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();
        expect(logs[0]?.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE);
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

    describe("L'admin met à jour un effectif via le back-office", () => {
      it("PUT avec deja_connu seul wipe une connaissance_ml stale et la trace dans le log", async () => {
        await requestAsOrganisation(ML_DATA, "post", `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`, {
          situation: SITUATION_ENUM.RDV_PRIS,
          connaissance_ml: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
        });

        const res = await requestAsOrganisation(
          { type: "ADMINISTRATEUR" },
          "put",
          "/api/v1/admin/mission-locale/effectif",
          {
            mission_locale_id: ML_ID.toString(),
            effectif_id: EFFECTIF_ID.toString(),
            deja_connu: false,
          }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.connaissance_ml).toBeUndefined();
        expect(effectif?.deja_connu).toBe(false);

        const logs = await missionLocaleEffectifsLogDb()
          .find({ mission_locale_effectif_id: effectif?._id })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();
        expect(logs[0]?.connaissance_ml).toBeNull();
        expect(logs[0]?.deja_connu).toBe(false);
      });

      it("PUT n'écrase pas situation/deja_connu absents du payload", async () => {
        await requestAsOrganisation(ML_DATA, "post", `/api/v1/organisation/mission-locale/effectif/${EFFECTIF_ID}`, {
          situation: SITUATION_ENUM.RDV_PRIS,
          connaissance_ml: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
          commentaires: "initial",
        });

        const res = await requestAsOrganisation(
          { type: "ADMINISTRATEUR" },
          "put",
          "/api/v1/admin/mission-locale/effectif",
          {
            mission_locale_id: ML_ID.toString(),
            effectif_id: EFFECTIF_ID.toString(),
            commentaires: "corrigé",
          }
        );

        expect(res.status).toBe(200);

        const effectif = await missionLocaleEffectifsDb().findOne({ effectif_id: EFFECTIF_ID });
        expect(effectif?.commentaires).toBe("corrigé");
        expect(effectif?.situation).toBe(SITUATION_ENUM.RDV_PRIS);
        expect(effectif?.deja_connu).toBe(true);
        expect(effectif?.connaissance_ml).toBe(CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE);
      });
    });
  });

  describe("Collab V2 — visibilité et priorité forcées par le CFA", () => {
    const dayAgo = (n: number) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - n);
      return d;
    };

    // Insère directement un missionLocaleEffectif pour contrôler finement l'état temporel
    // (rupture +180j, retour en formation, envoi auto 45j) sans dépendre du flux d'ingestion.
    const makeDoc = ({
      accConjoint = false,
      isAllowedCollab = true,
      mlBeta = true,
      ruptureDaysAgo = 60,
      statusValue = "RUPTURANT",
      enCours = "RUPTURANT",
      mlActivatedDaysAgo,
    }: {
      accConjoint?: boolean;
      isAllowedCollab?: boolean;
      mlBeta?: boolean;
      ruptureDaysAgo?: number;
      statusValue?: string;
      enCours?: string;
      mlActivatedDaysAgo?: number;
    }) => {
      const snapshotId = new ObjectId();
      const ruptureDate = dayAgo(ruptureDaysAgo);
      const doc = {
        _id: new ObjectId(),
        mission_locale_id: ML_ID,
        effectif_id: new ObjectId(),
        created_at: new Date(),
        brevo: {},
        current_status: { value: statusValue, date: ruptureDate },
        date_rupture: ruptureDate,
        ...(accConjoint ? { organisme_data: { acc_conjoint: true, rupture: true, reponse_at: new Date() } } : {}),
        computed: {
          organisme: {
            ...(mlBeta ? { ml_beta_activated_at: dayAgo(120) } : {}),
            is_allowed_collab: isAllowedCollab,
          },
          ...(mlActivatedDaysAgo !== undefined ? { mission_locale: { activated_at: dayAgo(mlActivatedDaysAgo) } } : {}),
        },
        effectif_snapshot: {
          _id: snapshotId,
          organisme_id: ORGANISME_ID,
          id_erp_apprenant: "x",
          source: "test",
          annee_scolaire: "2025-2026",
          apprenant: {
            nom: "DOE",
            prenom: "John",
            date_de_naissance: new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
            telephone: "0600000000",
          },
          formation: {},
          _computed: { statut: { en_cours: enCours } },
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };
      return { snapshotId, doc };
    };

    const insertDoc = async (doc: object) => {
      await missionLocaleEffectifsDb().insertOne(doc as any, { bypassDocumentValidation: true });
    };

    const getPerMonth = () =>
      requestAsOrganisation(ML_DATA, "get", `/api/v1/organisation/mission-locale/effectifs-per-month`);

    const isInPrioritaire = (res: { data: { prioritaire?: { effectifs?: { id: string }[] } } }, id: string) =>
      (res.data.prioritaire?.effectifs ?? []).some((e) => e.id === id);

    // Visibilité brute : présent dans n'importe quelle liste mensuelle (à traiter, traité, injoignable).
    const isVisible = (res: { data: Record<string, { data: { id: string }[] }[]> }, id: string) =>
      ["a_traiter", "traite", "injoignable"].some((liste) =>
        (res.data[liste] ?? []).flatMap((m) => m.data ?? []).some((e) => e.id === id)
      );

    beforeEach(async () => {
      await missionLocaleEffectifsDb().deleteMany({});
      const db = (await import("@/common/mongodb")).getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    });

    // Règle : « Si le CFA demande une collaboration, l'affichage est forcé dans le bloc
    // prioritaire (jeune en abandon +180j) → la ML doit toujours le voir. »
    it("Demande de collaboration + rupture > 180j : visible ET prioritaire", async () => {
      const { snapshotId, doc } = makeDoc({ accConjoint: true, ruptureDaysAgo: 200 });
      await insertDoc(doc);

      const res = await getPerMonth();
      const id = snapshotId.toString();
      expect(isVisible(res, id)).toBe(true);
      expect(isInPrioritaire(res, id)).toBe(true);
    });

    // Règle : « ... (jeune en fin de formation) ... » — modélisé par un retour en apprentissage.
    it("Demande de collaboration + retour en formation (APPRENTI) : visible ET prioritaire", async () => {
      const { snapshotId, doc } = makeDoc({
        accConjoint: true,
        ruptureDaysAgo: 30,
        statusValue: "APPRENTI",
        enCours: "APPRENTI",
      });
      await insertDoc(doc);

      const res = await getPerMonth();
      const id = snapshotId.toString();
      expect(isVisible(res, id)).toBe(true);
      expect(isInPrioritaire(res, id)).toBe(true);
    });

    // Règle : « ... ou non visible dans l'outil ML pour quelqu'autre raison ». Ici la rupture
    // (300j) est antérieure à la fenêtre d'activation de la ML (activée il y a 10j, soit
    // activated_at - 180j = il y a 190j) : sans le bypass collab, in_activation_range exclurait
    // le jeune. La demande de collab doit malgré tout le rendre visible ET prioritaire.
    it("Demande de collaboration + rupture hors fenêtre d'activation ML : visible ET prioritaire", async () => {
      const { snapshotId, doc } = makeDoc({ accConjoint: true, ruptureDaysAgo: 300, mlActivatedDaysAgo: 10 });
      await insertDoc(doc);

      const res = await getPerMonth();
      const id = snapshotId.toString();
      expect(isVisible(res, id)).toBe(true);
      expect(isInPrioritaire(res, id)).toBe(true);
    });

    // Règle : « Si un effectif est envoyé automatiquement (après 45j) depuis un CFA en V2 :
    // le jeune n'est pas prioritaire mais doit quand même être visible. »
    it("CFA en V2 sans demande de collab + rupture > 45j : visible MAIS non prioritaire (envoi auto)", async () => {
      const { snapshotId, doc } = makeDoc({ accConjoint: false, isAllowedCollab: true, ruptureDaysAgo: 60 });
      await insertDoc(doc);

      const res = await getPerMonth();
      const id = snapshotId.toString();
      expect(isVisible(res, id)).toBe(true);
      expect(isInPrioritaire(res, id)).toBe(false);
    });

    // Garde-fou : un CFA hors V2 collab ne doit PAS voir ses ruptures remonter à la ML
    // (sinon le bypass collab sur-exposerait des effectifs non concernés).
    it("CFA hors collab + rupture > 45j sans demande : non visible (pas de sur-exposition)", async () => {
      const { snapshotId, doc } = makeDoc({ accConjoint: false, isAllowedCollab: false, ruptureDaysAgo: 60 });
      await insertDoc(doc);

      const res = await getPerMonth();
      const id = snapshotId.toString();
      expect(isVisible(res, id)).toBe(false);
      expect(isInPrioritaire(res, id)).toBe(false);
    });

    // Règle d'ordre dans le bloc prioritaire : « Collab CFA avant tout / Souhaite un RDV /
    // RQTH = Mineur au même niveau ». On insère un effectif déclenchant exactement UN critère
    // chacun et on vérifie l'ordre renvoyé dans prioritaire.effectifs.
    it("Ordonne le bloc prioritaire : Collab CFA > Souhaite RDV > Mineur/RQTH", async () => {
      // Collab CFA uniquement (acc_conjoint), majeur, non rqth, pas de rdv
      const collab = makeDoc({ accConjoint: true, ruptureDaysAgo: 60 });

      // Souhaite un RDV uniquement
      const rdv = makeDoc({ accConjoint: false, ruptureDaysAgo: 60 });
      (rdv.doc as any).souhaite_rdv = true;

      // Mineur uniquement (16-18 ans)
      const mineur = makeDoc({ accConjoint: false, ruptureDaysAgo: 60 });
      (mineur.doc as any).effectif_snapshot.apprenant.date_de_naissance = new Date(
        new Date().setFullYear(new Date().getFullYear() - 17)
      );

      // Insertion volontairement dans un ordre non trié pour ne pas valider par hasard.
      await insertDoc(rdv.doc);
      await insertDoc(mineur.doc);
      await insertDoc(collab.doc);

      const res = await getPerMonth();
      const orderedIds: string[] = (res.data.prioritaire?.effectifs ?? []).map((e: { id: string }) => e.id);

      const idxCollab = orderedIds.indexOf(collab.snapshotId.toString());
      const idxRdv = orderedIds.indexOf(rdv.snapshotId.toString());
      const idxMineur = orderedIds.indexOf(mineur.snapshotId.toString());

      // Les trois sont bien prioritaires...
      expect(idxCollab).toBeGreaterThanOrEqual(0);
      expect(idxRdv).toBeGreaterThanOrEqual(0);
      expect(idxMineur).toBeGreaterThanOrEqual(0);

      // ... et ordonnés Collab CFA < Souhaite RDV < Mineur.
      expect(idxCollab).toBeLessThan(idxRdv);
      expect(idxRdv).toBeLessThan(idxMineur);
    });
  });

  describe("GET /parametres + PUT /parametres (rdv_url)", () => {
    beforeEach(async () => {
      const db = (await import("@/common/mongodb")).getDatabase();
      await db.command({ collMod: "organisations", validationLevel: "off" }).catch(() => {});
    });

    it("GET retourne rdv_url=null par défaut", async () => {
      const res = await requestAsOrganisation(ML_DATA, "get", "/api/v1/organisation/mission-locale/parametres");
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ rdv_url: null });
    });

    it("PUT met à jour rdv_url avec URL https valide", async () => {
      const res = await requestAsOrganisation(ML_DATA, "put", "/api/v1/organisation/mission-locale/parametres", {
        rdv_url: "https://calendly.com/ml",
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ rdv_url: "https://calendly.com/ml" });

      const orga = await organisationsDb().findOne({ _id: ML_ID });
      expect((orga as any)?.rdv_url).toBe("https://calendly.com/ml");
    });

    it("PUT rejette une URL javascript: (httpUrlSchema)", async () => {
      const res = await requestAsOrganisation(ML_DATA, "put", "/api/v1/organisation/mission-locale/parametres", {
        rdv_url: "javascript:alert(1)",
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it("PUT rdv_url=null efface la valeur", async () => {
      await requestAsOrganisation(ML_DATA, "put", "/api/v1/organisation/mission-locale/parametres", {
        rdv_url: "https://calendly.com/ml",
      });
      const res = await requestAsOrganisation(ML_DATA, "put", "/api/v1/organisation/mission-locale/parametres", {
        rdv_url: null,
      });
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ rdv_url: null });
    });

    it("GET sans auth → 401", async () => {
      const app = await initTestApp();
      const res = await app.httpClient.get("/api/v1/organisation/mission-locale/parametres");
      expectUnauthorizedError(res);
    });
  });

  describe("GET /banner-stats (souhaite_rdv count)", () => {
    beforeEach(async () => {
      const db = (await import("@/common/mongodb")).getDatabase();
      await db.command({ collMod: "missionLocaleEffectif", validationLevel: "off" }).catch(() => {});
    });

    it("compte les effectifs souhaite_rdv=true de la ML courante", async () => {
      const mlEffectifId1 = new ObjectId();
      const mlEffectifId2 = new ObjectId();
      const mlEffectifId3 = new ObjectId();
      // 2 effectifs souhaite_rdv=true, 1 false → count attendu = 2
      const baseDoc = {
        mission_locale_id: ML_ID,
        effectif_id: new ObjectId(),
        created_at: new Date(),
        brevo: {},
        current_status: {},
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: ORGANISME_ID,
          id_erp_apprenant: "x",
          source: "test",
          annee_scolaire: "2024-2025",
          apprenant: { nom: "X", prenom: "Y", telephone: "0600000000" },
          formation: {},
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };
      await missionLocaleEffectifsDb().insertMany(
        [
          { ...baseDoc, _id: mlEffectifId1, souhaite_rdv: true } as any,
          { ...baseDoc, _id: mlEffectifId2, souhaite_rdv: true } as any,
          { ...baseDoc, _id: mlEffectifId3, souhaite_rdv: false } as any,
        ],
        { bypassDocumentValidation: true }
      );

      const res = await requestAsOrganisation(ML_DATA, "get", "/api/v1/organisation/mission-locale/banner-stats");
      expect(res.status).toBe(200);
      expect(res.data).toEqual({ souhaite_rdv_count: 2 });
    });

    it("exclut les effectifs soft-deleted", async () => {
      const baseDoc = {
        mission_locale_id: ML_ID,
        effectif_id: new ObjectId(),
        created_at: new Date(),
        brevo: {},
        current_status: {},
        souhaite_rdv: true,
        effectif_snapshot: {
          _id: new ObjectId(),
          organisme_id: ORGANISME_ID,
          id_erp_apprenant: "x",
          source: "test",
          annee_scolaire: "2024-2025",
          apprenant: { nom: "X", prenom: "Y", telephone: "0600000000" },
          formation: {},
          is_lock: false,
          created_at: new Date(),
          updated_at: new Date(),
        },
      };
      await missionLocaleEffectifsDb().insertMany(
        [{ ...baseDoc, _id: new ObjectId() } as any, { ...baseDoc, _id: new ObjectId(), soft_deleted: true } as any],
        { bypassDocumentValidation: true }
      );

      const res = await requestAsOrganisation(ML_DATA, "get", "/api/v1/organisation/mission-locale/banner-stats");
      expect(res.data).toEqual({ souhaite_rdv_count: 1 });
    });

    it("sans auth → 401", async () => {
      const app = await initTestApp();
      const res = await app.httpClient.get("/api/v1/organisation/mission-locale/banner-stats");
      expectUnauthorizedError(res);
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
      mineur_ne_souhaite_pas_etre_recontacte: 0,
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
      rqth_ne_souhaite_pas_etre_recontacte: 0,
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
          ne_souhaite_pas_etre_recontacte: 0,
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
          ne_souhaite_pas_etre_recontacte: 0,
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
    mineur_ne_souhaite_pas_etre_recontacte: 0,
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
    rqth_ne_souhaite_pas_etre_recontacte: 0,
  };

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
          ne_souhaite_pas_etre_recontacte: 0,
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
          ne_souhaite_pas_etre_recontacte: 0,
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

    it("V1 et V2 affichent le cumul (indépendant de la plage), seule la variation reflète l'évolution", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const dayMinus30 = new Date(today);
      dayMinus30.setUTCDate(today.getUTCDate() - 30);

      await missionLocaleStatsDb().deleteMany({ mission_locale_id: ML_ID_ADMIN });

      const buildStats = (
        ne_souhaite_pas_etre_recontacte: number,
        ne_veut_pas_accompagnement: number,
        cherche_contrat: number,
        reorientation: number
      ) => ({
        total: 50,
        a_traiter: 20,
        traite: 30,
        rdv_pris: 0,
        rdv_pris_decouverts: 0,
        nouveau_projet: 0,
        deja_accompagne: 0,
        contacte_sans_retour: 0,
        injoignables: 0,
        coordonnees_incorrectes: 0,
        autre: 0,
        autre_avec_contact: 0,
        deja_connu: 0,
        ne_souhaite_pas_etre_recontacte,
        ne_veut_pas_accompagnement,
        cherche_contrat,
        reorientation,
        ...statsBase,
      });

      await missionLocaleStatsDb().insertMany([
        {
          _id: new ObjectId(),
          mission_locale_id: ML_ID_ADMIN,
          computed_day: dayMinus30,
          created_at: new Date(),
          updated_at: new Date(),
          stats: buildStats(4, 2, 0, 1),
        },
        {
          _id: new ObjectId(),
          mission_locale_id: ML_ID_ADMIN,
          computed_day: today,
          created_at: new Date(),
          updated_at: new Date(),
          stats: buildStats(11, 5, 2, 1),
        },
      ]);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/mission-locale/stats/national/dossiers-traites?region=11"
      );

      expect(response.status).toBe(200);

      expect(response.data.details.ne_souhaite_pas_etre_recontacte.current).toBe(11);
      expect(response.data.details.ne_souhaite_pas_etre_recontacte.variation).toBe("+64%");
      expect(response.data.details.ne_veut_pas_accompagnement.current).toBe(5);
      expect(response.data.details.ne_veut_pas_accompagnement.variation).toBe("+60%");

      expect(response.data.detailsV2.ne_souhaite_pas_accompagnement.current).toBe(19);
      expect(response.data.detailsV2.ne_souhaite_pas_accompagnement.variation).toBe("+63%");
    });

    it("Changer la plage ne déplace que la variation, pas les valeurs absolues", async () => {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      await missionLocaleStatsDb().deleteMany({ mission_locale_id: ML_ID_ADMIN });
      await missionLocaleStatsDb().insertOne({
        _id: new ObjectId(),
        mission_locale_id: ML_ID_ADMIN,
        computed_day: today,
        created_at: new Date(),
        updated_at: new Date(),
        stats: {
          total: 50,
          a_traiter: 20,
          traite: 30,
          rdv_pris: 7,
          rdv_pris_decouverts: 0,
          nouveau_projet: 3,
          deja_accompagne: 0,
          contacte_sans_retour: 0,
          injoignables: 0,
          coordonnees_incorrectes: 0,
          autre: 0,
          autre_avec_contact: 0,
          deja_connu: 0,
          ne_souhaite_pas_etre_recontacte: 0,
          ne_veut_pas_accompagnement: 0,
          cherche_contrat: 0,
          reorientation: 0,
          ...statsBase,
        },
      });

      const responses = await Promise.all(
        ["30days", "3months", "all"].map((period) =>
          requestAsOrganisation(
            { type: "ADMINISTRATEUR" },
            "get",
            `/api/v1/admin/mission-locale/stats/national/dossiers-traites?region=11&period=${period}`
          )
        )
      );

      for (const response of responses) {
        expect(response.status).toBe(200);
        expect(response.data.details.rdv_pris.current).toBe(7);
        expect(response.data.details.nouveau_projet.current).toBe(3);
        expect(response.data.detailsV2.rdv_pris.current).toBe(7);
        expect(response.data.detailsV2.projet_pro_securise.current).toBe(3);
      }
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
      expect(response.data.statutsTraitement).toHaveProperty("contacte_sans_retour");
      expect(response.data.statutsTraitement).toHaveProperty("injoignables");
      expect(response.data.statutsTraitement).toHaveProperty("coordonnees_incorrectes");
      expect(response.data.statutsTraitement).toHaveProperty("autre_avec_contact");
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
    // Tests `expose contact_opportun` retirés : la projection UI a été supprimée
    // (commit "remove contact_opportun UI exposure" + cleanup branche prequalif-whatsapp).
    // Le scoring backend reste actif pour les indicateurs admin et le job classifier.

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

/**
 * Garantit l'ordre de priorité de tri de la liste prioritaire (getSortedRulesByListeType) :
 *   1. Collab CFA (accompagnement conjoint) — avant tout
 *   2. Souhaite un RDV
 *   3. RQTH / Mineur — au même niveau (départagés ensuite par whatsapp_callback puis a_contacter)
 */
describe("Priorité de tri de la liste prioritaire (PRIORITAIRE)", () => {
  useNock();
  useMongo();

  const P_ORGANISME_ID = new ObjectId();
  const P_ML_ID = new ObjectId();
  const P_ML_DATA = { ml_id: 609, nom: "ML PRIORITE TEST", type: "MISSION_LOCALE" as const };
  const P_UAI = "0802004U";
  const P_SIRET = "77937827200016";

  let requestAsOrganisation: RequestAsOrganisationFunc;

  // Crée un rupturant via le flux normal (queue) et renvoie son effectif_id.
  const createEffectif = async (nom: string): Promise<ObjectId> => {
    const payload = createRupturantEffectifPayload({
      nom_apprenant: nom,
      etablissement_formateur_uai: P_UAI,
      etablissement_formateur_siret: P_SIRET,
      etablissement_responsable_uai: P_UAI,
      etablissement_responsable_siret: P_SIRET,
      code_postal_apprenant: "75001",
    });

    const { insertedId } = await effectifsQueueDb().insertOne({
      _id: new ObjectId(),
      created_at: new Date(),
      ...payload,
    });
    await processEffectifsQueue();

    const effQ = await effectifsQueueDb().findOne({ _id: insertedId }, { projection: { effectif_id: 1 } });
    return effQ?.effectif_id as ObjectId;
  };

  // Date de naissance correspondant à un mineur (≈ 17 ans), dans la fenêtre [16, 18] ans.
  const dateNaissanceMineur = () => new Date(new Date().setFullYear(new Date().getFullYear() - 17));

  // Renvoie la liste ordonnée des ids d'effectifs de l'encart prioritaire.
  const getPrioritaireOrder = async (): Promise<string[]> => {
    const res = await requestAsOrganisation(
      P_ML_DATA,
      "get",
      `/api/v1/organisation/mission-locale/effectifs-per-month`
    );
    return (res.data.prioritaire?.effectifs ?? []).map((e: { id: string }) => e.id);
  };

  beforeEach(async () => {
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;

    await organisationsDb().insertOne({
      _id: P_ML_ID,
      created_at: new Date(),
      email: "",
      telephone: "",
      site_web: "",
      ...P_ML_DATA,
    });

    await organismesDb().insertOne({
      _id: P_ORGANISME_ID,
      ...createRandomOrganisme({ uai: P_UAI, siret: P_SIRET }),
    });
  });

  it("ordonne Collab CFA, puis Souhaite RDV, puis RQTH/Mineur", async () => {
    const collabId = await createEffectif("COLLAB");
    const rdvId = await createEffectif("RDV");
    const mineurId = await createEffectif("MINEUR");
    const rqthId = await createEffectif("RQTH");

    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: collabId },
      { $set: { "organisme_data.acc_conjoint": true } }
    );
    await missionLocaleEffectifsDb().updateOne({ effectif_id: rdvId }, { $set: { souhaite_rdv: true } });
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: mineurId },
      { $set: { "effectif_snapshot.apprenant.date_de_naissance": dateNaissanceMineur() } }
    );
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: rqthId },
      { $set: { "effectif_snapshot.apprenant.rqth": true } }
    );

    const order = await getPrioritaireOrder();

    // Les 4 effectifs sont bien dans l'encart prioritaire.
    expect(order).toEqual(
      expect.arrayContaining([collabId.toString(), rdvId.toString(), mineurId.toString(), rqthId.toString()])
    );

    // Collab CFA en tête, puis Souhaite RDV, puis le groupe RQTH/Mineur.
    expect(order.indexOf(collabId.toString())).toBeLessThan(order.indexOf(rdvId.toString()));
    expect(order.indexOf(rdvId.toString())).toBeLessThan(order.indexOf(mineurId.toString()));
    expect(order.indexOf(rdvId.toString())).toBeLessThan(order.indexOf(rqthId.toString()));
  });

  it("place Collab CFA avant un effectif cumulant Souhaite RDV + Mineur + RQTH", async () => {
    const collabId = await createEffectif("COLLAB");
    const cumulId = await createEffectif("CUMUL");

    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: collabId },
      { $set: { "organisme_data.acc_conjoint": true } }
    );
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: cumulId },
      {
        $set: {
          souhaite_rdv: true,
          "effectif_snapshot.apprenant.rqth": true,
          "effectif_snapshot.apprenant.date_de_naissance": dateNaissanceMineur(),
        },
      }
    );

    const order = await getPrioritaireOrder();

    // Collab CFA reste prioritaire même face à un effectif cumulant tous les critères inférieurs.
    expect(order.indexOf(collabId.toString())).toBeLessThan(order.indexOf(cumulId.toString()));
  });

  it("place Souhaite RDV avant Mineur et avant RQTH", async () => {
    const rdvId = await createEffectif("RDV");
    const mineurId = await createEffectif("MINEUR");
    const rqthId = await createEffectif("RQTH");

    await missionLocaleEffectifsDb().updateOne({ effectif_id: rdvId }, { $set: { souhaite_rdv: true } });
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: mineurId },
      { $set: { "effectif_snapshot.apprenant.date_de_naissance": dateNaissanceMineur() } }
    );
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: rqthId },
      { $set: { "effectif_snapshot.apprenant.rqth": true } }
    );

    const order = await getPrioritaireOrder();

    expect(order.indexOf(rdvId.toString())).toBeLessThan(order.indexOf(mineurId.toString()));
    expect(order.indexOf(rdvId.toString())).toBeLessThan(order.indexOf(rqthId.toString()));
  });

  it("traite RQTH et Mineur au même niveau (départagés par whatsapp_callback, non par mineur)", async () => {
    // RQTH + whatsapp_callback contre Mineur seul.
    // Ancienne règle : Mineur passait systématiquement avant RQTH → Mineur premier.
    // Nouvelle règle : RQTH/Mineur au même niveau, donc whatsapp_callback départage → RQTH premier.
    const rqthWhatsappId = await createEffectif("RQTH_WA");
    const mineurId = await createEffectif("MINEUR");

    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: rqthWhatsappId },
      { $set: { "effectif_snapshot.apprenant.rqth": true, whatsapp_callback_requested: true } }
    );
    await missionLocaleEffectifsDb().updateOne(
      { effectif_id: mineurId },
      { $set: { "effectif_snapshot.apprenant.date_de_naissance": dateNaissanceMineur() } }
    );

    const order = await getPrioritaireOrder();

    expect(order.indexOf(rqthWhatsappId.toString())).toBeLessThan(order.indexOf(mineurId.toString()));
  });
});
