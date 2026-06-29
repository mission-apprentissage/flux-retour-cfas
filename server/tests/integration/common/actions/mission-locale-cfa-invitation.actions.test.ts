import { ObjectId } from "mongodb";
import { STATUT_APPRENANT } from "shared/constants";
import { IOrganisationMissionLocale } from "shared/models";
import { CFA_INVITATION_STATUT } from "shared/models/routes/mission-locale/missionLocale.api";
import { getAnneeScolaireListFromDateRange } from "shared/utils";
import { v4 as uuidv4 } from "uuid";
import { describe, it, beforeEach, expect, vi } from "vitest";

import {
  computeCfaInvitationStatut,
  getCfaListToInviteForMissionLocale,
  sendCfaInvitationFromMissionLocale,
} from "@/common/actions/mission-locale/mission-locale-cfa-invitation.actions";
import { checkActivationEligibility, findEligibleOrganismes } from "@/common/actions/organismes/deca-cfa-eligibility";
import { DATE_START_RUPTURES } from "@/common/actions/shared/rupture-pipeline.utils";
import {
  invitationsDb,
  missionLocaleCfaInvitationsDb,
  missionLocaleEffectifsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import config from "@/config";
import { createRandomOrganisme, createSampleEffectif } from "@tests/data/randomizedSample";
import { useMongo } from "@tests/jest/setupMongo";
import { id, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/brevo/brevo");
vi.mock("@/common/actions/organismes/deca-cfa-eligibility");

const anneeScolaire = getAnneeScolaireListFromDateRange(DATE_START_RUPTURES, new Date())[0];

const organismeId = new ObjectId(id(1));
const mlOrganisationId = new ObjectId(id(2));
const userId = new ObjectId(id(3));

const sampleOrganisme = {
  _id: organismeId,
  ...createRandomOrganisme({ siret: "19040492100016" }),
  uai: "0755805C",
  nom: "CAMPUS DU LAC",
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

const eligibleResult = {
  eligible: true,
  alreadyActive: false,
  checks: {
    exists_with_siret_uai: { passed: true },
    nature: { passed: true },
    no_formateurs_tiers: { passed: true },
    has_effectifs: { passed: true },
    not_already_active: { passed: true },
  },
  organisme: null,
};

async function createMlEffectifDoc(overrides: Record<string, any> = {}) {
  const now = new Date();
  const snapshot = await createSampleEffectif({
    organisme: sampleOrganisme,
    annee_scolaire: anneeScolaire,
    apprenant: { date_de_naissance: new Date(now.getFullYear() - 20, 0, 1) },
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
    brevo: { token: uuidv4(), token_created_at: now },
    ...overrides,
  };
}

describe("computeCfaInvitationStatut", () => {
  it("retourne CFA_ACTIF dès que le CFA est activé (prioritaire)", () => {
    expect(
      computeCfaInvitationStatut({
        mlBetaActivatedAt: new Date(),
        invitedByMe: true,
        hasContactEmail: false,
        isEligible: false,
      })
    ).toBe(CFA_INVITATION_STATUT.CFA_ACTIF);
  });

  it("retourne INVITATION_ENVOYEE si ce conseiller a déjà invité", () => {
    expect(
      computeCfaInvitationStatut({
        mlBetaActivatedAt: null,
        invitedByMe: true,
        hasContactEmail: true,
        isEligible: true,
      })
    ).toBe(CFA_INVITATION_STATUT.INVITATION_ENVOYEE);
  });

  it("retourne INVITER si éligible et email connu", () => {
    expect(
      computeCfaInvitationStatut({
        mlBetaActivatedAt: null,
        invitedByMe: false,
        hasContactEmail: true,
        isEligible: true,
      })
    ).toBe(CFA_INVITATION_STATUT.INVITER);
  });

  it("retourne BIENTOT_DISPONIBLE sans email de contact", () => {
    expect(
      computeCfaInvitationStatut({
        mlBetaActivatedAt: null,
        invitedByMe: false,
        hasContactEmail: false,
        isEligible: true,
      })
    ).toBe(CFA_INVITATION_STATUT.BIENTOT_DISPONIBLE);
  });

  it("retourne BIENTOT_DISPONIBLE si non éligible techniquement", () => {
    expect(
      computeCfaInvitationStatut({
        mlBetaActivatedAt: null,
        invitedByMe: false,
        hasContactEmail: true,
        isEligible: false,
      })
    ).toBe(CFA_INVITATION_STATUT.BIENTOT_DISPONIBLE);
  });
});

describe("getCfaListToInviteForMissionLocale", () => {
  useMongo();

  beforeEach(async () => {
    vi.mocked(findEligibleOrganismes).mockResolvedValue([{ _id: organismeId } as any]);
    await missionLocaleEffectifsDb().deleteMany({});
    await missionLocaleCfaInvitationsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await usersMigrationDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme as any);
    await organisationsDb().insertOne(missionLocale as any);
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
      statut: CFA_INVITATION_STATUT.INVITER,
    });
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
      email_destinataire: "directeur@campus-lac.fr",
      invitation_token: "token-test",
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

  it("récupère le nom du contact CFA depuis usersMigration via l'email de contact", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);
    // L'email de contact du référentiel correspond à un utilisateur existant (inscription en cours)
    await usersMigrationDb().insertOne({
      _id: new ObjectId(),
      account_status: "CONFIRMED",
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      created_at: new Date(),
      civility: "Madame",
      nom: "Durand",
      prenom: "Camille",
      fonction: "Directrice",
      email: "directeur@campus-lac.fr",
      telephone: "",
      password: testPasswordHash,
      has_accept_cgu_version: "v0.1",
      organisation_id: new ObjectId(),
    } as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result[0].destinataire_nom).toBe("Camille Durand");
  });

  it("laisse destinataire_nom à null si aucun utilisateur ne correspond à l'email de contact", async () => {
    await missionLocaleEffectifsDb().insertOne((await createMlEffectifDoc()) as any);

    const result = await getCfaListToInviteForMissionLocale(missionLocale, userId);

    expect(result[0].destinataire_nom).toBeNull();
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
      email_destinataire: "directeur@campus-lac.fr",
      invitation_token: "token-actif",
      created_at: new Date(),
    } as any);
    await organisationsDb().insertOne({
      _id: new ObjectId(),
      type: "ORGANISME_FORMATION",
      siret: "19040492100016",
      uai: "0755805C",
      organisme_id: organismeId.toString(),
      ml_beta_activated_at: new Date(),
      created_at: new Date(),
    } as any);

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
    vi.mocked(checkActivationEligibility).mockResolvedValue(eligibleResult as any);
    await invitationsDb().deleteMany({});
    await missionLocaleCfaInvitationsDb().deleteMany({});
    await organisationsDb().deleteMany({});
    await organismesDb().deleteMany({});
    await usersMigrationDb().deleteMany({});
    await organismesDb().insertOne(sampleOrganisme as any);
    await organisationsDb().insertOne(missionLocale as any);
  });

  it("crée l'invitation, journalise et envoie l'email Brevo avec le conseiller en copie", async () => {
    const result = await sendCfaInvitationFromMissionLocale(
      missionLocale,
      user,
      organismeId.toString(),
      "Je recommande ce CFA"
    );

    expect(result.email_destinataire).toBe("directeur@campus-lac.fr");
    expect(result.organisme_nom).toBe("CAMPUS DU LAC");

    const invitation = await invitationsDb().findOne({ email: "directeur@campus-lac.fr" });
    expect(invitation).toMatchObject({ role: "admin", author_id: userId });
    expect(invitation?.token).toBeTruthy();

    const log = await missionLocaleCfaInvitationsDb().findOne({ organisme_id: organismeId });
    expect(log).toMatchObject({
      mission_locale_id: mlOrganisationId,
      author_id: userId,
      email_destinataire: "directeur@campus-lac.fr",
      note: "Je recommande ce CFA",
      cc_email: "conseiller@ml.fr",
    });
    expect(log?.invitation_token).toBe(invitation?.token);

    expect(vi.mocked(sendTransactionalEmail)).toHaveBeenCalledWith(
      "directeur@campus-lac.fr",
      config.brevo.templateInvitationCfaId,
      expect.objectContaining({
        NOM_CFA: "CAMPUS DU LAC",
        NOM_MISSION_LOCALE: "ML Test",
        NOTE_RECOMMANDATION: "Je recommande ce CFA",
        LIEN_INVITATION: expect.stringContaining(`invitationToken=${invitation?.token}`),
      }),
      { cc: ["conseiller@ml.fr"], redirectRecipientInNonProdTo: "conseiller@ml.fr" }
    );
  });

  it("échoue si le CFA n'a aucun email de contact", async () => {
    await organismesDb().updateOne({ _id: organismeId }, { $set: { contacts_from_referentiel: [] } });

    await expect(sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())).rejects.toThrow(
      /email de contact/i
    );

    expect(await missionLocaleCfaInvitationsDb().countDocuments({})).toBe(0);
    expect(vi.mocked(sendTransactionalEmail)).not.toHaveBeenCalled();
  });

  it("échoue si le CFA n'est pas éligible techniquement", async () => {
    vi.mocked(checkActivationEligibility).mockResolvedValue({
      ...eligibleResult,
      checks: { ...eligibleResult.checks, has_effectifs: { passed: false } },
    } as any);

    await expect(sendCfaInvitationFromMissionLocale(missionLocale, user, organismeId.toString())).rejects.toThrow(
      /éligible/i
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
