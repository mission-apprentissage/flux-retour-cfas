import { ObjectId } from "mongodb";
import { SOURCE_APPRENANT, STATUT_APPRENANT } from "shared/constants";
import { STATUT_PRESENCE_REFERENTIEL } from "shared/constants/organisme";
import type { IMissionLocaleEffectif, IOrganisationMissionLocale, IOrganisme } from "shared/models";
import type { IMissionLocaleCfaInvitation } from "shared/models/data/missionLocaleCfaInvitations.model";
import { CFA_SITUATION_TYPE_ENUM, SITUATION_ENUM } from "shared/models/data/missionLocaleEffectif.model";
import missionLocaleEffectifsPurgesStatsDescriptor from "shared/models/data/missionLocaleEffectifsPurgesStats.model";
import missionLocaleStatsPurgesDescriptor from "shared/models/data/missionLocaleStatsPurges.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { addDaysUTC, normalizeToUTCDay } from "shared/utils/date";
import { beforeEach, describe, expect, it } from "vitest";

import { getCfaInvitesSansCollab } from "@/common/actions/admin/collaborations/cfa-invites-sans-collab.actions";
import {
  computeStatsForDate,
  fetchCollaborationsByOrgId,
  getCollaborationsCfaSynthese,
} from "@/common/actions/admin/collaborations/collaboration-stats.actions";
import { getCfaNpsStats } from "@/common/actions/cfa/cfa-collaboration-stats.actions";
import {
  getCfaCollaborationStats,
  getTerritoireCollaborationStats,
  listCfaCollaborationsParMl,
} from "@/common/actions/cfa/cfa-collaborations.actions";
import { getCfaFiche } from "@/common/actions/cfa/cfa-fiche.actions";
import { listCollaborationsCfaOrigine } from "@/common/actions/mission-locale/collaboration-cfa-origine.actions";
import {
  createOrUpdateMissionLocaleStats,
  getCollaborationMensuelStats,
  getCollaborationSegmentStats,
  getPrequalifStats,
  getTraitementExportData,
  getWhatsAppStats,
} from "@/common/actions/mission-locale/mission-locale-stats.actions";
import {
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  missionLocaleEffectifsLogDb,
  missionLocaleEffectifsPurgesStatsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { createCollectionIndexes } from "@/common/model/indexes/createCollectionIndexes";
import { useMongo } from "@tests/jest/setupMongo";

import { purgerDossiersSuivi } from "./purge-dossiers-suivi";

useMongo();

const maintenant = new Date("2027-09-01T00:00:00Z");
const date = (iso: string) => new Date(`${iso}T00:00:00Z`);
const REGION = "84";
const DEPARTEMENT = "01";

const ML_ID = new ObjectId();
const CFA_ID = new ObjectId();
const CFA_PURGE_ID = new ObjectId();

const organisme = (_id: ObjectId) =>
  ({
    _id,
    siret: `1234567890${_id.toString().slice(-4)}`,
    nom: "CFA Test",
    enseigne: "CFA Test",
    est_dans_le_referentiel: STATUT_PRESENCE_REFERENTIEL.PRESENT,
    adresse: { region: REGION, departement: DEPARTEMENT, code_postal: "01000", commune: "Bourg" },
  }) as unknown as IOrganisme;

const dossier = ({
  organismeId = CFA_ID,
  rupture = "2025-03-01",
  anneeScolaire = "2024-2025",
  situation = null,
  collab,
  whatsapp = false,
  masque = false,
  age = 20,
  missionLocaleId = ML_ID,
}: {
  organismeId?: ObjectId;
  rupture?: string;
  anneeScolaire?: string;
  situation?: SITUATION_ENUM | null;
  collab?: { envoi: string; reponse: string };
  whatsapp?: boolean;
  masque?: boolean;
  age?: number;
  missionLocaleId?: ObjectId;
}) => ({
  _id: new ObjectId(),
  mission_locale_id: missionLocaleId,
  effectif_id: new ObjectId(),
  created_at: date(rupture),
  date_rupture: date(rupture),
  current_status: { value: STATUT_APPRENANT.RUPTURANT, date: date(rupture) },
  situation,
  ...(masque ? { soft_deleted: true } : {}),
  ...(collab
    ? {
        organisme_data: {
          acc_conjoint: true,
          acc_conjoint_at: date(collab.envoi),
          reponse_at: date(collab.reponse),
          situation_type: CFA_SITUATION_TYPE_ENUM.RUPTURE_OU_SORTIE,
          motif: ["SANTE", "LOGEMENT"],
          form_feedback: { note: 4 },
        },
      }
    : {}),
  ...(whatsapp
    ? {
        whatsapp_callback_requested: true,
        whatsapp_contact: {
          last_message_sent_at: date("2025-05-01"),
          user_response: "callback",
          template_type: "prequalif",
          sent_via: "daily",
          rdv_redirect_token: "jeton",
          rdv_clicks: [{ clicked_at: date("2025-05-02") }],
        },
      }
    : {}),
  effectif_snapshot: {
    _id: new ObjectId(),
    organisme_id: organismeId,
    source: SOURCE_APPRENANT.ERP,
    annee_scolaire: anneeScolaire,
    apprenant: {
      nom: "DOE",
      prenom: "John",
      date_de_naissance: new Date(new Date().setFullYear(new Date().getFullYear() - age)),
    },
    formation: {},
    _computed: { statut: { en_cours: STATUT_APPRENANT.RUPTURANT }, organisme: { region: REGION } },
  },
});

const inserer = async (dossiers: ReturnType<typeof dossier>[]) => {
  await missionLocaleEffectifsDb().insertMany(dossiers as unknown as IMissionLocaleEffectif[], {
    bypassDocumentValidation: true,
  });
};

const jeu = () => ({
  collabPurgee: dossier({
    situation: SITUATION_ENUM.RDV_PRIS,
    collab: { envoi: "2025-04-10", reponse: "2026-02-01" },
    whatsapp: true,
  }),
  collabVivante: dossier({
    rupture: "2026-09-01",
    anneeScolaire: "2026-2027",
    collab: { envoi: "2026-09-10", reponse: "2026-09-10" },
  }),
  suiviPurge: dossier({ situation: SITUATION_ENUM.INJOIGNABLE_APRES_RELANCES }),
});

const page = { page: 1, limit: 10, sort_order: "desc" as const };

describe("compteurs des indicateurs ML vivants à la purge des dossiers de suivi", () => {
  beforeEach(async () => {
    await createCollectionIndexes(missionLocaleStatsPurgesDescriptor);
    await createCollectionIndexes(missionLocaleEffectifsPurgesStatsDescriptor);
    await organisationsDb().insertMany(
      [
        {
          _id: ML_ID,
          type: "MISSION_LOCALE",
          ml_id: 4242,
          nom: "ML Test",
          created_at: date("2025-01-01"),
          activated_at: date("2025-03-01"),
          adresse: { region: REGION, departement: DEPARTEMENT },
        } as IOrganisationMissionLocale,
        ...[CFA_ID, CFA_PURGE_ID].map(
          (organismeId) =>
            ({
              _id: new ObjectId(),
              type: "ORGANISME_FORMATION",
              created_at: date("2025-01-01"),
              siret: "00000000000000",
              uai: null,
              organisme_id: organismeId.toString(),
              ml_beta_activated_at: date("2025-12-01"),
            }) as IOrganisation
        ),
      ] as IOrganisation[],
      { bypassDocumentValidation: true }
    );
    await organismesDb().insertMany([organisme(CFA_ID), organisme(CFA_PURGE_ID)], {
      bypassDocumentValidation: true,
    });
  });

  it("compte chaque dossier supprimé une fois dans les lignes de suivi", async () => {
    const { collabPurgee, collabVivante, suiviPurge } = jeu();
    await inserer([collabPurgee, collabVivante, suiviPurge]);

    const resultat = await purgerDossiersSuivi({ maintenant });

    const lignes = await missionLocaleEffectifsPurgesStatsDb().find({}).toArray();
    const somme = (type: string, champ: string) =>
      lignes
        .filter((ligne) => ligne.type === type)
        .reduce((total, ligne) => total + ((ligne.compteurs as Record<string, number>)[champ] ?? 0), 0);
    expect(resultat.missionLocale).toMatchObject({ supprimes: 2, comptes: 2 });
    expect(somme("suivi", "dossiers")).toBe(2);
    expect(somme("collab", "envoyes")).toBe(1);
    expect(somme("whatsapp", "envoyes")).toBe(1);
    expect(lignes.find((ligne) => ligne.type === "collab")).toMatchObject({
      mission_locale_id: ML_ID,
      organisme_id: CFA_ID,
      region: REGION,
      departement: DEPARTEMENT,
      mois: "2025-04",
      compteurs: { resultat_rdv_pris: 1, objectif_sante: 1, objectif_logement: 1, nps_reponses: 1, v2_envoyes: 1 },
    });
  });

  it("garde les chiffres de collaboration du territoire, de la fiche CFA et du mensuel", async () => {
    const { collabPurgee, collabVivante, suiviPurge } = jeu();
    await inserer([collabPurgee, collabVivante, suiviPurge]);
    const lire = () =>
      Promise.all([
        getTerritoireCollaborationStats("all", { regions: [REGION] }),
        getCfaCollaborationStats(CFA_ID),
        getCollaborationMensuelStats("all", {}, ML_ID.toString()),
        getCfaNpsStats({ regions: [REGION] }),
        listCfaCollaborationsParMl(CFA_ID, { ...page, sort_by: "envoyees" }),
        listCollaborationsCfaOrigine(ML_ID, { ...page, sort_by: "collaborations" }),
      ]);
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });
    const apres = await lire();

    expect(avant[0]).toMatchObject({ jeunes_envoyes: { current: 2 }, cfa_ayant_collabore: { current: 1 } });
    expect(avant[1]).toMatchObject({ envoyes: 2, acceptes: 1, nps: { total_reponses: 2, note_moyenne: 4 } });
    expect(apres).toStrictEqual(avant);
  });

  it("garde les chiffres clés de collaboration d'une ML et son export", async () => {
    const { collabPurgee, collabVivante } = jeu();
    await inserer([collabPurgee, collabVivante]);
    const lire = async () => {
      await createOrUpdateMissionLocaleStats(ML_ID);
      const [segment, export_] = await Promise.all([
        getCollaborationSegmentStats("all", {}, ML_ID.toString()),
        getTraitementExportData({ mlId: ML_ID.toString() }),
      ]);
      return {
        segment,
        collab: export_.mlData.map(({ collab_total, collab_traite }) => ({ collab_total, collab_traite })),
      };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant.segment).toMatchObject({ jeunes_envoyes: { current: 2 }, objectifs: { sante: 2, total_dossiers: 2 } });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde les chiffres admin des collaborations et la synthèse publique", async () => {
    const { collabPurgee, collabVivante, suiviPurge } = jeu();
    await inserer([collabPurgee, collabVivante, suiviPurge]);
    const demain = addDaysUTC(normalizeToUTCDay(new Date()), 1);
    const lire = () => Promise.all([computeStatsForDate(demain), getCollaborationsCfaSynthese()]);
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant[0].national.usage).toMatchObject({ dossiers_envoyes_cfa: 2, dossiers_traites_ml: 1, rdv_pris: 1 });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde les chiffres WhatsApp et préqualif", async () => {
    const { collabPurgee, collabVivante } = jeu();
    await inserer([collabPurgee, collabVivante]);
    const lire = () => Promise.all([getWhatsAppStats("all"), getPrequalifStats("all")]);
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant[0]).toMatchObject({ summary: { totalSent: 1 }, callbackOutcomes: { rdv_pris: 1 } });
    expect(avant[1]).toMatchObject({ volume: { total_sent: 1 }, rdv_tracking: { total_clicks: 1 } });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde les envois WhatsApp d'un dossier masqué, hors préqualif", async () => {
    const { collabVivante } = jeu();
    await inserer([collabVivante, dossier({ situation: SITUATION_ENUM.RDV_PRIS, whatsapp: true, masque: true })]);
    const lire = () => Promise.all([getWhatsAppStats("all"), getPrequalifStats("all")]);
    const avant = await lire();

    const resultat = await purgerDossiersSuivi({ maintenant });

    expect(resultat.missionLocale).toMatchObject({ supprimes: 1, comptes: 0 });
    expect(avant[0]).toMatchObject({ summary: { totalSent: 1 }, callbackOutcomes: { rdv_pris: 1 } });
    expect(avant[1]).toMatchObject({ volume: { total_sent: 0 } });
    expect(await lire()).toStrictEqual(avant);
    const lignes = await missionLocaleEffectifsPurgesStatsDb().find({}).toArray();
    expect(lignes.map(({ type }) => type)).toStrictEqual(["whatsapp"]);
  });

  it("garde un CFA dont toutes les collaborations sont purgées", async () => {
    await inserer([
      dossier({
        organismeId: CFA_PURGE_ID,
        situation: SITUATION_ENUM.RDV_PRIS,
        collab: { envoi: "2025-04-10", reponse: "2026-02-01" },
      }),
    ]);
    await missionLocaleCfaInvitationsDb().insertOne({
      _id: new ObjectId(),
      mission_locale_id: ML_ID,
      author_id: new ObjectId(),
      organisme_id: CFA_PURGE_ID,
      organisation_id: new ObjectId(),
      siret: "00000000000000",
      uai: "0751234A",
      destinataires: [],
      created_at: date("2025-03-15"),
    } as IMissionLocaleCfaInvitation);

    await purgerDossiersSuivi({ maintenant });

    const collaborations = await fetchCollaborationsByOrgId([CFA_PURGE_ID], new Date(), null);
    expect(collaborations.get(CFA_PURGE_ID.toString())).toStrictEqual({ nb: 1, last: date("2025-04-01") });
    expect((await getCfaFiche(CFA_PURGE_ID, { nominatif: false })).collabore).toBe(true);
    expect(
      (await getCfaInvitesSansCollab({ ...page, sort_by: "invitations" }, { inclureAvecCollab: false })).total
    ).toBe(0);
  });

  it("n'ajoute pas à l'admin un CFA jamais activé supprimé après la purge", async () => {
    const cfaNonActive = new ObjectId();
    await organismesDb().insertOne(organisme(cfaNonActive), { bypassDocumentValidation: true });
    await inserer([
      dossier({
        organismeId: cfaNonActive,
        situation: SITUATION_ENUM.RDV_PRIS,
        collab: { envoi: "2025-04-10", reponse: "2026-02-01" },
      }),
    ]);
    const lire = async () => {
      const { national, regions } = await computeStatsForDate(addDaysUTC(normalizeToUTCDay(new Date()), 1));
      const region = regions.find(({ region_code }) => region_code === REGION);
      return {
        usage: national.usage,
        region: { dossiers_envoyes_cfa: region?.dossiers_envoyes_cfa, cfa_with_collab: region?.cfa_with_collab },
      };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });
    await organismesDb().deleteOne({ _id: cfaNonActive });

    expect(avant.usage).toMatchObject({ rupturants: 0, dossiers_envoyes_cfa: 0 });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde les objectifs et les CFA du segment collaborations d'une ML, âges ML compris", async () => {
    await inserer([
      dossier({ collab: { envoi: "2025-04-10", reponse: "2026-02-01" }, age: 27 }),
      dossier({ organismeId: CFA_PURGE_ID, collab: { envoi: "2025-04-10", reponse: "2026-02-01" } }),
    ]);
    const lire = async () => {
      await createOrUpdateMissionLocaleStats(ML_ID);
      const { objectifs, cfa_ayant_collabore } = await getCollaborationSegmentStats("all", {}, ML_ID.toString());
      return { objectifs, cfa_ayant_collabore };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant).toMatchObject({ objectifs: { sante: 1, total_dossiers: 1 }, cfa_ayant_collabore: { current: 1 } });
    expect(await lire()).toStrictEqual(avant);
  });

  it("range sans région ni activation un CFA déjà absent des organismes à la purge", async () => {
    const cfaAbsent = new ObjectId();
    await organisationsDb().insertOne(
      {
        _id: new ObjectId(),
        type: "ORGANISME_FORMATION",
        created_at: date("2025-01-01"),
        siret: "00000000000000",
        uai: null,
        organisme_id: cfaAbsent.toString(),
        ml_beta_activated_at: date("2025-12-01"),
      } as IOrganisation,
      { bypassDocumentValidation: true }
    );
    await inserer([dossier({ organismeId: cfaAbsent, collab: { envoi: "2025-04-10", reponse: "2026-02-01" } })]);
    const lire = async () => {
      const { national } = await computeStatsForDate(addDaysUTC(normalizeToUTCDay(new Date()), 1));
      return { usage: national.usage, territoire: await getTerritoireCollaborationStats("all", { regions: [REGION] }) };
    };
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    const ligne = await missionLocaleEffectifsPurgesStatsDb().findOne({ type: "collab" });
    expect(ligne).toMatchObject({ organisme_id: cfaAbsent, region: null, departement: null });
    expect(ligne).not.toHaveProperty("cfa_active_le");
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde le délai de première action quand une autre ML a écrit sur le dossier", async () => {
    const autreMl = new ObjectId();
    await organisationsDb().insertOne(
      {
        _id: autreMl,
        type: "MISSION_LOCALE",
        ml_id: 4343,
        nom: "Autre ML",
        created_at: date("2025-01-01"),
        activated_at: date("2025-03-01"),
        adresse: { region: REGION, departement: DEPARTEMENT },
      } as IOrganisationMissionLocale as IOrganisation,
      { bypassDocumentValidation: true }
    );
    const conseiller = (organisationId: ObjectId) => ({
      _id: new ObjectId(),
      organisation_id: organisationId,
      email: `${new ObjectId().toString()}@tdb.local`,
    });
    const [conseillerMl, conseillerAutreMl] = [conseiller(ML_ID), conseiller(autreMl)];
    await usersMigrationDb().insertMany([conseillerMl, conseillerAutreMl] as unknown as IUsersMigration[], {
      bypassDocumentValidation: true,
    });
    const purge = dossier({ collab: { envoi: "2025-04-10", reponse: "2026-02-01" } });
    const vivant = dossier({
      missionLocaleId: autreMl,
      rupture: "2026-09-01",
      anneeScolaire: "2026-2027",
      collab: { envoi: "2026-09-10", reponse: "2026-09-10" },
    });
    await inserer([purge, vivant]);
    const log = (dossierId: ObjectId, createdBy: ObjectId, jour: string) => ({
      _id: new ObjectId(),
      mission_locale_effectif_id: dossierId,
      situation: SITUATION_ENUM.RDV_PRIS,
      created_at: date(jour),
      created_by: createdBy,
      read_by: [],
    });
    await missionLocaleEffectifsLogDb().insertMany(
      [log(purge._id, conseillerAutreMl._id, "2025-04-20"), log(purge._id, conseillerMl._id, "2025-04-30")] as never[],
      { bypassDocumentValidation: true }
    );
    const lire = () => getTerritoireCollaborationStats("all", {});
    const avant = await lire();

    await purgerDossiersSuivi({ maintenant });

    expect(avant).toMatchObject({ delai_moyen_jours: 20 });
    expect(await lire()).toStrictEqual(avant);
  });

  it("garde dans sa région un CFA supprimé après la purge", async () => {
    await inserer([
      dossier({
        organismeId: CFA_PURGE_ID,
        situation: SITUATION_ENUM.RDV_PRIS,
        collab: { envoi: "2025-04-10", reponse: "2026-02-01" },
      }),
    ]);

    await purgerDossiersSuivi({ maintenant });
    await organismesDb().deleteOne({ _id: CFA_PURGE_ID });

    const territoire = await getTerritoireCollaborationStats("all", { regions: [REGION] });
    expect(territoire).toMatchObject({ jeunes_envoyes: { current: 1 }, cfa_ayant_collabore: { current: 1 } });
    const admin = await computeStatsForDate(addDaysUTC(normalizeToUTCDay(new Date()), 1));
    expect(admin.regions.find(({ region_code }) => region_code === REGION)).toMatchObject({
      dossiers_envoyes_cfa: 1,
      cfa_with_collab: 1,
    });
  });
});
