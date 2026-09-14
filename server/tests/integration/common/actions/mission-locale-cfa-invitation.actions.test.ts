import { randomUUID } from "node:crypto";

import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale } from "shared/models";
import { CFA_INVITATION_STATUT } from "shared/models/routes/mission-locale/missionLocale.api";
import { getAnneeScolaireListFromDateRange } from "shared/utils";
import { describe, it, beforeEach, expect, vi } from "vitest";

import {
  computeCfaInvitationStatut,
  getCfaListToInviteForMissionLocale,
  isCfaInvitable,
  selectInvitationDestinataires,
  sendCfaInvitationFromMissionLocale,
} from "@/common/actions/mission-locale/mission-locale-cfa-invitation.actions";
import { DATE_START_RUPTURES } from "@/common/actions/shared/rupture-pipeline.utils";
import {
  connexionInvitationsDb,
  invitationsDb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { getPublicUrl } from "@/common/utils/emailsUtils";
import config from "@/config";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/brevo/brevo");

const anneeScolaire = getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date())[0];

const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const userId = new ObjectId(id(3));
const cfaOrganisationId = new ObjectId(id(4));

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
  uai: "0755805C",
  nom: "CAMPUS DU LAC",
  first_transmission_date: new Date("2025-09-01"),
  adresse: {
    departement: "33",
    region: "75",
    commune: "Bordeaux",
    code_postal: "33300",
    complete: "RUE RENE CASSIN 33300 Bordeaux",
  },
  contacts_from_referentiel: [
    { email: "directeur@campus-lac.fr", confirmation_referentiel: true, sources: ["referentiel"] },
  ],
};

const missionLocale = {
  _id: mlOrganisationId,
  type: "MISSION_LOCALE",
  ml_id: 42,
  nom: "ML Test",
  created_at: new Date(),
} as unknown as IOrganisationMissionLocale;

const user = {
  _id: userId,
  email: "conseiller@ml.fr",
  nom: "Martin",
  prenom: "Alexandra",
} as unknown as AuthContext;

/** Organisation ORGANISME_FORMATION du CFA : sans elle, aucun compte ne peut lui être rattaché. */
const cfaOrganisation = {
  _id: cfaOrganisationId,
  type: "ORGANISME_FORMATION",
  siret: "19040492100016",
  uai: "0755805C",
  organisme_id: organismeId.toString(),
  created_at: new Date(),
};

/** Hors production l'envoi est volontairement limité à un destinataire. */
async function enProduction<T>(fn: () => Promise<T>): Promise<T> {
  const env = config.env;
  config.env = "production";
  try {
    return await fn();
  } finally {
    config.env = env;
  }
}

/** Compte CFA : c'est sa présence en `CONFIRMED` qui rend le CFA invitable. */
function cfaAccount(overrides: Record<string, any> = {}) {
  return {
    _id: new ObjectId(),
    account_status: "CONFIRMED",
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    created_at: new Date(),
    nom: "Durand",
    prenom: "Camille",
    email: "camille.durand@campus-lac.fr",
    telephone: "",
    password: testPasswordHash,
    has_accept_cgu_version: "v0.1",
    organisation_id: cfaOrganisationId,
    ...overrides,
  };
}

async function createMlEffectifDoc(overrides: Record<string, any> = {}, ageAnnees = 20) {
  const now = new Date();
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: anneeScolaire,
    apprenant: { date_de_naissance: new Date(now.getFullYear() - ageAnnees, 0, 1) },
  });

  return {
    _id: new ObjectId(),
    mission_locale_id: mlOrganisationId,
    effectif_id: new ObjectId(),
    effectif_snapshot: {
      ...snapshot,
      _id: new ObjectId(),
      organisme_id: organismeId,
      _computed: {
        ...snapshot._computed,
        statut: { ...snapshot._computed?.statut, en_cours: STATUT_APPRENANT.RUPTURANT },
      },
    },
    effectif_snapshot_date: now,
    date_rupture: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    current_status: { value: STATUT_APPRENANT.RUPTURANT, date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000) },
    created_at: now,
    brevo: { token: randomUUID(), token_created_at: now },
    ...overrides,
  };
}

describe("computeCfaInvitationStatut", () => {
  it("retourne CFA_ACTIF dès que le CFA est activé (prioritaire)", () => {
    expect(computeCfaInvitationStatut({ mlBetaActivatedAt: new Date(), invitedByMe: true })).toBe(
      CFA_INVITATION_STATUT.CFA_ACTIF
    );
  });

  it("retourne INVITATION_ENVOYEE si ce conseiller a déjà invité", () => {
    expect(computeCfaInvitationStatut({ mlBetaActivatedAt: null, invitedByMe: true })).toBe(
      CFA_INVITATION_STATUT.INVITATION_ENVOYEE
    );
  });

  it("retourne INVITER sinon", () => {
    expect(computeCfaInvitationStatut({ mlBetaActivatedAt: null, invitedByMe: false })).toBe(
      CFA_INVITATION_STATUT.INVITER
    );
  });
});

describe("selectInvitationDestinataires", () => {
  const destinataires = [
    { user_id: new ObjectId(), email: "a@cfa.fr", nom: "A" },
    { user_id: new ObjectId(), email: "b@cfa.fr", nom: "B" },
  ];

  it("garde tous les comptes en production", async () => {
    expect(await enProduction(async () => selectInvitationDestinataires(destinataires))).toEqual(destinataires);
  });

  it("n'en garde qu'un hors production", () => {
    expect(selectInvitationDestinataires(destinataires)).toEqual([destinataires[0]]);
    expect(selectInvitationDestinataires([])).toEqual([]);
  });
});

describe("isCfaInvitable", () => {
  const destinataires = [{ user_id: new ObjectId(), email: "a@cfa.fr", nom: "A" }];

  it("est invitable s'il transmet et a au moins un compte actif", () => {
    expect(isCfaInvitable({ first_transmission_date: new Date() }, { destinataires })).toBe(true);
  });

  it("n'est pas invitable s'il ne transmet pas", () => {
    expect(isCfaInvitable({ first_transmission_date: null }, { destinataires })).toBe(false);
  });

  it("n'est pas invitable sans compte actif", () => {
    expect(isCfaInvitable({ first_transmission_date: new Date() }, { destinataires: [] })).toBe(false);
    expect(isCfaInvitable({ first_transmission_date: new Date() }, undefined)).toBe(false);
  });
});

describe("getCfaListToInviteForMissionLocale", () => {
  useMongo();

  beforeEach(async () => {
    await missionLocaleEffectifsDb().deleteMany({});
    await missionLocaleCfaInvitationsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await usersMigrationDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme as any);
    await organisationsDb().insertMany([missionLocale, cfaOrganisation] as any);
    await usersMigrationDb().insertOne(cfaAccount() as any);
  });

  it("compte les jeunes en rupture par CFA et renvoie le statut INVITER", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      organisme_id: organismeId.toString(),
      siret: "19040492100016",
      nom: "CAMPUS DU LAC",
      nb_jeunes_rupture: 2,
      nb_jeunes_obligation_formation: 0,
      statut: CFA_INVITATION_STATUT.INVITER,
    });
  });

  it("compte séparément les jeunes en obligation de formation (16-18 ans)", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc({}, 17)) as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result).toHaveLength(1);
    expect(result[0].nb_jeunes_rupture).toBe(2);
    expect(result[0].nb_jeunes_obligation_formation).toBe(1);
  });

  it("exclut un CFA qui ne transmet pas ses effectifs", async () => {
    await organismesDb().updateOne({ _id: organismeId }, { $unset: { first_transmission_date: "" } });
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    expect(await getCfaListToInviteForMissionLocale(missionLocale, userId)).toHaveLength(0);
  });

  it("exclut un CFA sans aucun compte actif sur le Tableau de bord", async () => {
    await usersMigrationDb().deleteMany({});
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    expect(await getCfaListToInviteForMissionLocale(missionLocale, userId)).toHaveLength(0);
  });

  it("exclut un CFA dont les comptes ne sont pas encore confirmés", async () => {
    await usersMigrationDb().deleteMany({});
    await usersMigrationDb().insertOne(cfaAccount({ account_status: "PENDING_EMAIL_VALIDATION" }) as any);
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    expect(await getCfaListToInviteForMissionLocale(missionLocale, userId)).toHaveLength(0);
  });

  it("renvoie INVITATION_ENVOYEE quand ce conseiller a déjà invité ce CFA", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    await missionLocaleCfaInvitationsDb().insertOne({
      _id: new ObjectId(),
      mission_locale_id: mlOrganisationId,
      author_id: userId,
      organisme_id: organismeId,
      organisation_id: new ObjectId(),
      siret: "19040492100016",
      destinataires: [{ user_id: new ObjectId(), email: "camille.durand@campus-lac.fr" }],
      created_at: new Date(),
    } as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result).toHaveLength(1);
    expect(result[0].statut).toBe(CFA_INVITATION_STATUT.INVITATION_ENVOYEE);
  });

  it("renseigne les Missions Locales actives de la même région que le CFA", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    // ML active de la même région que le CFA (région "75" dans sampleOrganisme) → retenue
    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "MISSION_LOCALE",
      ml_id: 99,
      nom: "ML active territoire",
      adresse: { region: "75" },
      activated_at: new Date(),
      created_at: new Date(),
    } as any);
    // ML de la même région mais NON activée → ignorée
    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "MISSION_LOCALE",
      ml_id: 100,
      nom: "ML inactive territoire",
      adresse: { region: "75" },
      created_at: new Date(),
    } as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result[0].ml_partenaires.noms).toContain("ML active territoire");
    expect(result[0].ml_partenaires.noms).not.toContain("ML inactive territoire");
    expect(result[0].ml_partenaires.count).toBe(1);
  });

  it("compte tous les comptes actifs du CFA comme destinataires", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    await usersMigrationDb().insertMany([
      cfaAccount({ email: "second@campus-lac.fr" }),
      // Compte non confirmé : ne sera pas destinataire.
      cfaAccount({ email: "troisieme@campus-lac.fr", account_status: "PENDING_ADMIN_VALIDATION" }),
      // Compte d'une autre organisation : hors périmètre.
      cfaAccount({ email: "ailleurs@autre-cfa.fr", organisation_id: new ObjectId() }),
    ] as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result[0].nb_destinataires).toBe(2);
  });

  it("affiche CFA_ACTIF pour un CFA invité par ce conseiller et désormais actif, même hors liste-rupture", async () => {
    // Aucun effectif en rupture pour ce CFA → absent de la liste-rupture. Mais ce conseiller l'a invité
    // (journal) et le CFA est désormais actif (organisation ORGANISME_FORMATION avec ml_beta_activated_at).
    await missionLocaleCfaInvitationsDb().insertOne({
      _id: new ObjectId(),
      mission_locale_id: mlOrganisationId,
      author_id: userId,
      organisme_id: organismeId,
      organisation_id: new ObjectId(),
      siret: "19040492100016",
      destinataires: [{ user_id: new ObjectId(), email: "camille.durand@campus-lac.fr" }],
      created_at: new Date(),
    } as any);
    await organisationsDb().updateOne({ _id: cfaOrganisationId }, { $set: { ml_beta_activated_at: new Date() } });

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    const cfa = result.find((c) => c.organisme_id === organismeId.toString());
    expect(cfa?.statut).toBe(CFA_INVITATION_STATUT.CFA_ACTIF);
    expect(cfa?.nb_jeunes_rupture).toBe(0);
  });
});

describe("sendCfaInvitationFromMissionLocale", () => {
  useMongo();

  beforeEach(async () => {
    vi.mocked(sendTransactionalEmail).mockResolvedValue({ messageId: "test-message-id" } as any);
    await invitationsDb().deleteMany({});
    await connexionInvitationsDb().deleteMany({});
    await missionLocaleCfaInvitationsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await usersMigrationDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme as any);
    await organisationsDb().insertMany([missionLocale, cfaOrganisation] as any);
    await usersMigrationDb().insertOne(cfaAccount() as any);
  });

  it("journalise et envoie l'email Brevo avec le conseiller en copie", async () => {
    const result = await sendCfaInvitationFromMissionLocale(
      missionLocale,
      user,
      organismeId.toString(),
      "Je recommande ce CFA"
    );

    expect(result).toEqual({ nb_destinataires: 1, organisme_nom: "CAMPUS DU LAC" });

    const log = await missionLocaleCfaInvitationsDb().findOne({ organisme_id: organismeId });
    expect(log).toMatchObject({
      mission_locale_id: mlOrganisationId,
      author_id: userId,
      organisation_id: cfaOrganisationId,
      destinataires: [{ email: "camille.durand@campus-lac.fr" }],
      note: "Je recommande ce CFA",
      cc_email: "conseiller@ml.fr",
    });

    expect(vi.mocked(sendTransactionalEmail)).toHaveBeenCalledWith(
      "camille.durand@campus-lac.fr",
      config.brevo.templateInvitationCfaId,
      expect.objectContaining({
        NOM_CFA: "CAMPUS DU LAC",
        NOM_MISSION_LOCALE: "ML Test",
        NOTE_RECOMMANDATION: "Je recommande ce CFA",
        NOM_DESTINATAIRE: "Camille Durand",
      }),
      { cc: ["conseiller@ml.fr"], redirectRecipientInNonProdTo: "conseiller@ml.fr" }
    );
  });

  it("envoie un lien de connexion personnalisé, jamais un lien d'inscription", async () => {
    await sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString());

    const token = await connexionInvitationsDb().findOne({ email: "camille.durand@campus-lac.fr" });
    expect(token?.source).toBe("invitation-ml");

    const params = vi.mocked(sendTransactionalEmail).mock.calls.at(-1)?.[2] as Record<string, unknown>;
    expect(params.LIEN_INVITATION).toBe(getPublicUrl(`/auth/connexion?invitationToken=${token?.token}`));
    expect(params.LIEN_INVITATION).not.toContain("inscription-cfa");
    expect(await invitationsDb().countDocuments({})).toBe(0);
  });

  it("écrit à chaque compte du CFA, et ne met le conseiller en copie qu'une fois", async () => {
    await usersMigrationDb().insertMany([
      cfaAccount({ email: "second@campus-lac.fr", prenom: "Bruno", nom: "Petit" }),
      cfaAccount({ email: "troisieme@campus-lac.fr", prenom: "Awa", nom: "Sow" }),
    ] as any);

    const result = await enProduction(() =>
      sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())
    );

    expect(result.nb_destinataires).toBe(3);

    const calls = vi.mocked(sendTransactionalEmail).mock.calls;
    expect(calls.map((c) => c[0]).sort()).toEqual([
      "camille.durand@campus-lac.fr",
      "second@campus-lac.fr",
      "troisieme@campus-lac.fr",
    ]);
    expect(calls.filter((c) => c[3]?.cc?.length)).toHaveLength(1);
    // Chaque destinataire reçoit son propre lien.
    expect(new Set(calls.map((c) => c[2].LIEN_INVITATION)).size).toBe(3);

    const log = await missionLocaleCfaInvitationsDb().findOne({ organisme_id: organismeId });
    expect(log?.destinataires).toHaveLength(3);
  });

  it("n'envoie qu'un seul email hors production", async () => {
    await usersMigrationDb().insertMany([
      cfaAccount({ email: "second@campus-lac.fr" }),
      cfaAccount({ email: "troisieme@campus-lac.fr" }),
    ] as any);

    const result = await sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString());

    expect(result.nb_destinataires).toBe(1);
    expect(vi.mocked(sendTransactionalEmail)).toHaveBeenCalledTimes(1);
  });

  it("ne journalise que les destinataires effectivement servis", async () => {
    await usersMigrationDb().insertOne(cfaAccount({ email: "second@campus-lac.fr" }) as any);
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce(undefined as any);

    const result = await enProduction(() =>
      sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())
    );

    expect(result.nb_destinataires).toBe(1);
    const log = await missionLocaleCfaInvitationsDb().findOne({ organisme_id: organismeId });
    expect(log?.destinataires).toHaveLength(1);
  });

  it("échoue si le CFA ne transmet pas ses effectifs", async () => {
    await organismesDb().updateOne({ _id: organismeId }, { $unset: { first_transmission_date: "" } });

    await expect(sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())).rejects.toThrow(
      /ne peut pas être invité/i
    );

    expect(vi.mocked(sendTransactionalEmail)).not.toHaveBeenCalled();
  });

  it("échoue si le CFA n'a plus aucun compte actif", async () => {
    await usersMigrationDb().deleteMany({});

    await expect(sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())).rejects.toThrow(
      /ne peut pas être invité/i
    );

    expect(vi.mocked(sendTransactionalEmail)).not.toHaveBeenCalled();
  });

  it("n'enregistre aucune invitation si l'envoi de l'email Brevo échoue", async () => {
    // Brevo capture ses erreurs et renvoie `undefined` : l'action doit alors échouer sans rien persister.
    vi.mocked(sendTransactionalEmail).mockResolvedValueOnce(undefined as any);

    await expect(sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())).rejects.toThrow(
      /échoué/i
    );

    expect(await invitationsDb().countDocuments({})).toBe(0);
    expect(await missionLocaleCfaInvitationsDb().countDocuments({})).toBe(0);
  });
});
