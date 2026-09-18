import { ObjectId } from "bson";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale } from "shared/models";
import {
  CFA_RISQUE_RUPTURE_ENUM,
  CFA_SITUATION_TYPE_ENUM,
  CONNAISSANCE_ML_ENUM,
  SITUATION_ENUM,
} from "shared/models/data/missionLocaleEffectif.model";
import type { IMissionLocaleEffectifLog } from "shared/models/data/missionLocaleEffectifLog.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { describe, expect, it, beforeEach } from "vitest";

import {
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  missionLocaleStatsDb,
  organisationsDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";
import { testPasswordHash } from "@tests/utils/testUtils";

import { createOrUpdateMissionLocaleStats } from "./mission-locale-stats.actions";
import { buildEmptySegments } from "./mission-locale-stats.helpers";
import { computeMissionLocaleStats } from "./mission-locale.actions";

useMongo();

const ML_ID = new ObjectId();
const ORGANISME_ID = new ObjectId();

const ML_ORGANISATION = {
  _id: ML_ID,
  type: "MISSION_LOCALE",
  ml_id: 4242,
  nom: "ML Test",
  created_at: new Date("2025-01-01"),
  activated_at: new Date("2025-03-01"),
} as IOrganisationMissionLocale;

const dayAgo = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
};

type DossierOptions = {
  source?: "ERP" | "DECA";
  situation?: SITUATION_ENUM | null;
  connaissanceMl?: CONNAISSANCE_ML_ENUM | null;
  dejaConnu?: boolean;
  problemeType?: string;
  createdDaysAgo?: number;
  ruptureDaysAgo?: number;
  autoSend?: boolean;
  collab?: {
    accConjointAt?: Date | null;
    situationType?: CFA_SITUATION_TYPE_ENUM;
    risqueRupture?: CFA_RISQUE_RUPTURE_ENUM;
    dateAbandon?: Date;
  };
  currentStatus?: string;
};

const insertDossier = async ({
  source = "ERP",
  situation = null,
  connaissanceMl = null,
  dejaConnu,
  problemeType,
  createdDaysAgo = 30,
  ruptureDaysAgo = 60,
  autoSend = false,
  collab,
  currentStatus = STATUT_APPRENANT.RUPTURANT,
}: DossierOptions = {}) => {
  const _id = new ObjectId();
  const ruptureDate = dayAgo(ruptureDaysAgo);
  const doc = {
    _id,
    mission_locale_id: ML_ID,
    effectif_id: new ObjectId(),
    created_at: dayAgo(createdDaysAgo),
    date_rupture: ruptureDate,
    current_status: { value: currentStatus, date: ruptureDate },
    situation,
    ...(connaissanceMl ? { connaissance_ml: connaissanceMl } : {}),
    ...(dejaConnu !== undefined ? { deja_connu: dejaConnu } : {}),
    ...(problemeType ? { probleme_type: problemeType } : {}),
    ...(autoSend ? { computed: { organisme: { is_allowed_collab: true, ml_beta_activated_at: dayAgo(120) } } } : {}),
    ...(collab
      ? {
          organisme_data: {
            acc_conjoint: true,
            rupture: true,
            reponse_at: new Date(),
            ...(collab.accConjointAt !== undefined ? { acc_conjoint_at: collab.accConjointAt } : {}),
            ...(collab.situationType ? { situation_type: collab.situationType } : {}),
            ...(collab.risqueRupture ? { risque_rupture: collab.risqueRupture } : {}),
            ...(collab.dateAbandon ? { date_abandon: collab.dateAbandon } : {}),
          },
        }
      : {}),
    effectif_snapshot: {
      _id: new ObjectId(),
      organisme_id: ORGANISME_ID,
      id_erp_apprenant: "x",
      source: source === "DECA" ? SOURCE_APPRENANT.DECA : SOURCE_APPRENANT.ERP,
      annee_scolaire: "2025-2026",
      apprenant: {
        nom: "DOE",
        prenom: "John",
        date_de_naissance: new Date(new Date().setFullYear(new Date().getFullYear() - 20)),
      },
      formation: {},
      _computed: { statut: { en_cours: STATUT_APPRENANT.RUPTURANT } },
      is_lock: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  } as unknown as IMissionLocaleEffectif;
  await missionLocaleEffectifsDb().insertOne(doc, { bypassDocumentValidation: true });
  return _id;
};

const insertLog = async (
  dossierId: ObjectId,
  { createdBy, createdAt, situation }: { createdBy: ObjectId | null; createdAt: Date; situation?: SITUATION_ENUM }
) => {
  await missionLocaleEffectifsLogDb().insertOne({
    _id: new ObjectId(),
    mission_locale_effectif_id: dossierId,
    created_at: createdAt,
    created_by: createdBy,
    read_by: [],
    ...(situation ? { situation } : { commentaires: "note" }),
  } as IMissionLocaleEffectifLog);
};

const insertUser = async (organisationId: ObjectId) => {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne({
    _id,
    account_status: "CONFIRMED",
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
    civility: "Madame",
    nom: "Dupont",
    prenom: "Jean",
    fonction: "Conseillère",
    email: `${_id.toString()}@tdb.local`,
    telephone: "",
    password: testPasswordHash,
    has_accept_cgu_version: "v0.1",
    organisation_id: organisationId,
  } as IUsersMigration);
  return _id;
};

describe("computeMissionLocaleStats", () => {
  beforeEach(async () => {
    await organisationsDb().insertOne(ML_ORGANISATION as IOrganisation, { bypassDocumentValidation: true });
  });

  it("renvoie stats et segments complets à zéro sans aucun dossier", async () => {
    const { stats, segments } = await computeMissionLocaleStats(ML_ORGANISATION);

    expect(stats.total).toBe(0);
    expect(stats.traite).toBe(0);
    expect(segments).toEqual(buildEmptySegments());
  });

  it("répartit les dossiers entre le segment rupture et le segment collab", async () => {
    await insertDossier({ situation: SITUATION_ENUM.RDV_PRIS, connaissanceMl: CONNAISSANCE_ML_ENUM.NON_CONNU });
    await insertDossier({ source: "DECA" });
    await insertDossier({ autoSend: true });
    await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
    await insertDossier({
      situation: SITUATION_ENUM.CONTACTE_SANS_RETOUR,
      collab: { accConjointAt: dayAgo(10), situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE },
    });
    await insertDossier({
      situation: SITUATION_ENUM.DEJA_ACCOMPAGNE,
      connaissanceMl: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
      collab: {
        accConjointAt: dayAgo(10),
        situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
        risqueRupture: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
      },
    });

    const { stats, segments } = await computeMissionLocaleStats(ML_ORGANISATION);

    expect(stats).toMatchObject({ total: 6, a_traiter: 3, traite: 3, rdv_pris: 1, rdv_pris_decouverts: 1 });

    expect(segments.rupture).toMatchObject({
      total: 5,
      a_traiter: 3,
      traite: 2,
      rdv_pris: 1,
      rdv_pris_decouverts: 1,
      a_recontacter: 1,
      autre: 0,
      repondu: 1,
      deja_connu_accompagne: 0,
    });

    expect(segments.collab).toMatchObject({
      total: 3,
      a_traiter: 1,
      traite: 2,
      rdv_pris: 0,
      a_recontacter: 1,
      autre: 1,
      repondu: 0,
      deja_connu_accompagne: 1,
      situation_rupture: 2,
      situation_prevention_tres_eleve: 1,
      situation_abandon: 0,
      delai_premiere_activite_count: 0,
      delai_premiere_activite_jours_total: 0,
    });
  });

  it("n'inclut la collaboration dans le segment collab qu'à partir de sa date d'envoi", async () => {
    await insertDossier({ createdDaysAgo: 20, collab: { accConjointAt: dayAgo(2) } });

    const before = await computeMissionLocaleStats(ML_ORGANISATION, dayAgo(5));
    expect(before.segments.rupture.total).toBe(1);
    expect(before.segments.collab.total).toBe(0);

    const after = await computeMissionLocaleStats(ML_ORGANISATION);
    expect(after.segments.rupture.total).toBe(1);
    expect(after.segments.collab.total).toBe(1);
  });

  it("ignore une collaboration sans acc_conjoint_at dans le segment collab", async () => {
    await insertDossier({ collab: { accConjointAt: null } });

    const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);
    expect(segments.rupture.total).toBe(1);
    expect(segments.collab.total).toBe(0);
  });

  it("compte les déjà connus accompagnés sans sur-compter le legacy deja_connu", async () => {
    await insertDossier({
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissanceMl: CONNAISSANCE_ML_ENUM.DEJA_ACCOMPAGNE_ACTIVEMENT,
      collab: { accConjointAt: dayAgo(3) },
    });
    await insertDossier({ situation: SITUATION_ENUM.RDV_PRIS, dejaConnu: true, collab: { accConjointAt: dayAgo(3) } });
    await insertDossier({
      situation: SITUATION_ENUM.RDV_PRIS,
      connaissanceMl: CONNAISSANCE_ML_ENUM.CONNU_NON_ACCOMPAGNE,
      dejaConnu: true,
      collab: { accConjointAt: dayAgo(3) },
    });
    await insertDossier({ situation: SITUATION_ENUM.RDV_PRIS, dejaConnu: false, collab: { accConjointAt: dayAgo(3) } });

    const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);

    expect(segments.collab).toMatchObject({ total: 4, traite: 4, deja_connu_accompagne: 2, rdv_pris_decouverts: 2 });
  });

  it("classe les situations qualifiées par le CFA dans les 6 tranches", async () => {
    const base = { accConjointAt: dayAgo(3) };
    await insertDossier({ collab: { ...base, situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE } });
    await insertDossier({
      collab: { ...base, situationType: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE, dateAbandon: dayAgo(4) },
    });
    await insertDossier({
      collab: {
        ...base,
        situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
        risqueRupture: CFA_RISQUE_RUPTURE_ENUM.INEVITABLE,
      },
    });
    await insertDossier({
      collab: {
        ...base,
        situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
        risqueRupture: CFA_RISQUE_RUPTURE_ENUM.TRES_ELEVE,
      },
    });
    await insertDossier({ collab: { ...base, situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT } });
    await insertDossier({
      collab: {
        ...base,
        situationType: CFA_SITUATION_TYPE_ENUM.EN_CONTRAT,
        risqueRupture: CFA_RISQUE_RUPTURE_ENUM.FAIBLE,
      },
    });

    const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);

    expect(segments.collab).toMatchObject({
      total: 6,
      situation_rupture: 1,
      situation_abandon: 1,
      situation_prevention_inevitable: 1,
      situation_prevention_tres_eleve: 1,
      situation_prevention_modere: 1,
      situation_besoin_aide_hors_rupture: 1,
    });
    expect(segments.rupture.total).toBe(2);
  });

  describe("délai de première activité ML", () => {
    it("exclut les dossiers sans log conseiller ML", async () => {
      await insertUser(ML_ID);
      const adminUser = await insertUser(new ObjectId());
      await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
      const whatsappSeul = await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
      const adminSeul = await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
      await insertLog(whatsappSeul, { createdBy: null, createdAt: dayAgo(8) });
      await insertLog(adminSeul, { createdBy: adminUser, createdAt: dayAgo(8), situation: SITUATION_ENUM.RDV_PRIS });

      const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);

      expect(segments.collab.total).toBe(3);
      expect(segments.collab.delai_premiere_activite_count).toBe(0);
      expect(segments.collab.delai_premiere_activite_jours_total).toBe(0);
    });

    it("compte 0 jour quand le seul log conseiller précède l'envoi", async () => {
      const mlUser = await insertUser(ML_ID);
      const dossier = await insertDossier({ createdDaysAgo: 40, collab: { accConjointAt: dayAgo(10) } });
      await insertLog(dossier, { createdBy: mlUser, createdAt: dayAgo(20), situation: SITUATION_ENUM.RDV_PRIS });

      const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);

      expect(segments.collab.delai_premiere_activite_count).toBe(1);
      expect(segments.collab.delai_premiere_activite_jours_total).toBe(0);
    });

    it("mesure le délai jusqu'au premier log conseiller postérieur à l'envoi, commentaire inclus", async () => {
      const mlUser = await insertUser(ML_ID);
      const dossier = await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
      await insertLog(dossier, { createdBy: null, createdAt: dayAgo(9) });
      await insertLog(dossier, { createdBy: mlUser, createdAt: dayAgo(7) });
      await insertLog(dossier, { createdBy: mlUser, createdAt: dayAgo(2), situation: SITUATION_ENUM.RDV_PRIS });

      const { segments } = await computeMissionLocaleStats(ML_ORGANISATION);

      expect(segments.collab.delai_premiere_activite_count).toBe(1);
      expect(segments.collab.delai_premiere_activite_jours_total).toBe(3);
    });

    it("ne regarde que les logs antérieurs à la date de calcul", async () => {
      const mlUser = await insertUser(ML_ID);
      const dossier = await insertDossier({ createdDaysAgo: 30, collab: { accConjointAt: dayAgo(20) } });
      await insertLog(dossier, { createdBy: mlUser, createdAt: dayAgo(2), situation: SITUATION_ENUM.RDV_PRIS });

      const { segments } = await computeMissionLocaleStats(ML_ORGANISATION, dayAgo(5));

      expect(segments.collab.total).toBe(1);
      expect(segments.collab.delai_premiere_activite_count).toBe(0);
    });
  });
});

describe("createOrUpdateMissionLocaleStats", () => {
  it("persiste stats et segments dans un document accepté par le validateur", async () => {
    await organisationsDb().insertOne(ML_ORGANISATION as IOrganisation, { bypassDocumentValidation: true });
    await insertDossier({ situation: SITUATION_ENUM.RDV_PRIS });
    await insertDossier({ collab: { accConjointAt: dayAgo(1) } });

    await createOrUpdateMissionLocaleStats(ML_ID);

    const saved = await missionLocaleStatsDb().findOne({ mission_locale_id: ML_ID });
    expect(saved?.stats.total).toBe(2);
    expect(saved?.segments?.rupture.total).toBe(2);
    expect(saved?.segments?.collab.total).toBe(1);
  });

  it("persiste un délai de première activité non nul accepté par le validateur", async () => {
    await organisationsDb().insertOne(ML_ORGANISATION as IOrganisation, { bypassDocumentValidation: true });
    const mlUser = await insertUser(ML_ID);
    const dossier = await insertDossier({ collab: { accConjointAt: dayAgo(10) } });
    await insertLog(dossier, { createdBy: mlUser, createdAt: dayAgo(6), situation: SITUATION_ENUM.RDV_PRIS });

    await createOrUpdateMissionLocaleStats(ML_ID);

    const saved = await missionLocaleStatsDb().findOne({ mission_locale_id: ML_ID });
    expect(saved?.segments?.collab.delai_premiere_activite_count).toBe(1);
    expect(saved?.segments?.collab.delai_premiere_activite_jours_total).toBe(4);
  });

  it("écrit des segments à zéro pour une ML sans dossier", async () => {
    await organisationsDb().insertOne(ML_ORGANISATION as IOrganisation, { bypassDocumentValidation: true });

    await createOrUpdateMissionLocaleStats(ML_ID);

    const saved = await missionLocaleStatsDb().findOne({ mission_locale_id: ML_ID });
    expect(saved?.segments).toEqual(buildEmptySegments());
  });
});
