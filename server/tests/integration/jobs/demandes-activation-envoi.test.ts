import * as Boom from "@hapi/boom";
import { format } from "date-fns";
import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import type { IEffectif } from "shared/models/data/effectifs.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { getActiveAnneesScolaires } from "shared/utils/anneeScolaire";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { login, register } from "@/common/actions/account.actions";
import {
  DUREE_INVITATION_DEMANDE_MS,
  envoyerDemandesActivation,
  evaluerDemande,
  importerDemandesActivation,
  listerDemandesActivation,
  modifierDemandeActivation,
  renvoyerDemandeActivation,
  traiterEnvoisDemandesActivation,
} from "@/common/actions/admin/demandes-activation.actions";
import { resendAdminInvitation } from "@/common/actions/admin/invitations.admin.actions";
import { flecherContratsDeca } from "@/common/actions/deca/deca-flechage.actions";
import { retirerGardeActivationDeca } from "@/common/actions/organismes/organismes.admin.actions";
import {
  demandesActivationCfaDb,
  effectifsDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { sendEmail } from "@/common/services/mailer/mailer";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc } from "@tests/utils/testUtils";

vi.mock("job-processor", async (importOriginal) => ({
  ...(await importOriginal<typeof import("job-processor")>()),
  addJob: vi.fn(),
}));

vi.mock("@/common/services/brevo/brevo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/brevo")>()),
  sendTransactionalEmail: vi.fn(),
}));

vi.mock("@/common/services/mailer/mailer", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/mailer/mailer")>()),
  sendEmail: vi.fn(),
}));

vi.mock("@/common/actions/deca/deca-flechage.actions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/actions/deca/deca-flechage.actions")>()),
  flecherContratsDeca: vi.fn(),
}));

const pendantEvaluation = vi.fn();

vi.mock("@/common/actions/organismes/deca-cfa-eligibility", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/common/actions/organismes/deca-cfa-eligibility")>();
  return {
    ...original,
    checkEligibilityForLoaded: async (...args: Parameters<typeof original.checkEligibilityForLoaded>) => {
      await pendantEvaluation();
      return original.checkEligibilityForLoaded(...args);
    },
  };
});

useMongo();

const brevoMock = vi.mocked(sendTransactionalEmail);
const sendEmailMock = vi.mocked(sendEmail);
const addJobMock = vi.mocked(addJob);
const flecherMock = vi.mocked(flecherContratsDeca);

const EXPEDITEUR = { _id: new ObjectId(), email: "admin@tba.beta.gouv.fr" };
const SIRET = "13002374000439";
const UAI = "0442095L";

async function insererOrganisme(
  overrides: Partial<Parameters<typeof generateOrganismeFixture>[0]> = {},
  effectifs = 1
) {
  const organisme = generateOrganismeFixture({
    _id: new ObjectId(),
    siret: SIRET,
    uai: UAI,
    nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
    ferme: false,
    nom: "CFA DES TESTS",
    ...overrides,
  });
  await organismesDb().insertOne(organisme, { bypassDocumentValidation: true });
  for (let i = 0; i < effectifs; i++) {
    await effectifsDb().insertOne(
      testDoc<IEffectif>({
        _id: new ObjectId(),
        organisme_id: organisme._id,
        annee_scolaire: getActiveAnneesScolaires(new Date())[0],
      }),
      { bypassDocumentValidation: true }
    );
  }
  return organisme;
}

async function insererOrganisation(organismeId: ObjectId) {
  const _id = new ObjectId();
  await organisationsDb().insertOne(
    testDoc<IOrganisation>({
      _id,
      type: "ORGANISME_FORMATION",
      siret: SIRET,
      uai: UAI,
      organisme_id: organismeId.toString(),
      created_at: new Date(),
    }),
    { bypassDocumentValidation: true }
  );
  return _id;
}

async function insererCompte(
  email: string,
  organisationId: ObjectId,
  overrides: { account_status?: IUsersMigration["account_status"]; organisation_role?: "admin" | "member" | null } = {}
) {
  const _id = new ObjectId();
  const { organisation_role = "member", ...autres } = overrides;
  await usersMigrationDb().insertOne({
    _id,
    email,
    prenom: "Camille",
    nom: "Martin",
    civility: "Madame",
    fonction: "Directrice",
    telephone: "",
    password: "hash",
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    has_accept_cgu_version: "v0.1",
    organisation_id: organisationId,
    ...(organisation_role ? { organisation_role } : {}),
    account_status: "CONFIRMED",
    created_at: new Date(),
    ...autres,
  });
  return _id;
}

async function insererDemande(email: string, siret = SIRET, overrides: Partial<IDemandeActivationCfa> = {}) {
  const evaluation = await evaluerDemande({ email, siret_saisi: siret });
  const demande: IDemandeActivationCfa = {
    _id: new ObjectId(),
    source: "Webinaire",
    email,
    siret_saisi_brut: siret,
    siret_saisi: siret,
    ...evaluation,
    branche_initiale: evaluation.branche,
    a_envoyer: true,
    statut: "pret",
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
  await demandesActivationCfaDb().insertOne(demande);
  return demande;
}

const relire = (demande: IDemandeActivationCfa) => demandesActivationCfaDb().findOne({ _id: demande._id });

const cochees = async () =>
  (await demandesActivationCfaDb().find({ a_envoyer: true }).toArray()).map((demande) => demande._id);

async function envoyerEtTraiter() {
  const bilan = await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
  for (const [{ payload }] of addJobMock.mock.calls) {
    const organismeId = payload?.organismeId;
    await traiterEnvoisDemandesActivation(typeof organismeId === "string" ? new ObjectId(organismeId) : null);
  }
  return bilan;
}

describe("envoi des demandes d'activation", () => {
  beforeEach(() => {
    brevoMock.mockReset().mockResolvedValue({ messageId: "message" } as never);
    sendEmailMock.mockReset();
    addJobMock.mockReset();
    flecherMock.mockReset();
    pendantEvaluation.mockReset();
  });

  afterEach(() => {
    config.deca.flechageAuto = false;
    config.brevo.templatesDemandesActivation.activationSansCompte = 102;
  });

  describe("branche activation", () => {
    it("active DECA, crée une invitation admin à 14 jours sans mail mjml et envoie le template Brevo", async () => {
      const organisme = await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");

      const bilan = await envoyerEtTraiter();

      expect(bilan).toEqual({ demandes: 1, organismes: 1 });
      expect(addJobMock).toHaveBeenCalledWith({
        name: "demandes-activation:envoyer",
        payload: { organismeId: organisme._id.toString() },
        queued: true,
      });
      const organismeActive = await organismesDb().findOne({ _id: organisme._id });
      expect(organismeActive?.is_allowed_deca).toBe(true);
      expect(organismeActive).not.toHaveProperty("deca_activation_queued_at");

      const invitation = await invitationsDb().findOne({ email: "direction@cfa-tests.fr" });
      expect(invitation).toMatchObject({ role: "admin", demande_id: demande._id, author_id: EXPEDITEUR._id });
      expect(invitation?.expires_at?.getTime()).toBeGreaterThan(Date.now() + DUREE_INVITATION_DEMANDE_MS - 60_000);
      expect(invitation).not.toHaveProperty("prenom");
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationSansCompte,
        expect.objectContaining({
          NOM_CFA: "CFA DES TESTS",
          LIEN_INSCRIPTION: expect.stringContaining(`invitationToken=${invitation?.token}`),
          DATE_EXPIRATION: format(invitation!.expires_at!, "dd/MM/yyyy"),
        }),
        { redirectRecipientInNonProdTo: EXPEDITEUR.email }
      );
      expect(await relire(demande)).toMatchObject({
        statut: "envoyee",
        branche_envoyee: "activation",
        invitation_id: invitation?._id,
        etapes: { flag_at: expect.any(Date), invitation_at: expect.any(Date), email_at: expect.any(Date) },
      });
    });

    it("ne flèche et n'active qu'une fois pour deux demandeurs du même CFA", async () => {
      config.deca.flechageAuto = true;
      await insererOrganisme();
      await insererDemande("direction@cfa-tests.fr");
      await insererDemande("adjoint@cfa-tests.fr");

      const bilan = await envoyerEtTraiter();

      expect(bilan).toEqual({ demandes: 2, organismes: 1 });
      expect(flecherMock).toHaveBeenCalledTimes(1);
      expect(await invitationsDb().countDocuments({ role: "admin" })).toBe(2);
      expect(await demandesActivationCfaDb().countDocuments({ statut: "envoyee" })).toBe(2);
    });

    it("interrupteur allumé : l'email part après le fléchage et la pose du flag", async () => {
      config.deca.flechageAuto = true;
      const organisme = await insererOrganisme();
      await insererDemande("direction@cfa-tests.fr");
      const flagAu = async () => (await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca ?? false;
      let flagPendantFlechage: boolean | null = null;
      let flagPendantEmail: boolean | null = null;
      flecherMock.mockImplementation(async () => {
        flagPendantFlechage = await flagAu();
        return {} as never;
      });
      brevoMock.mockImplementation(async () => {
        flagPendantEmail = await flagAu();
        return { messageId: "message" } as never;
      });

      await envoyerEtTraiter();

      expect(flagPendantFlechage).toBe(false);
      expect(flagPendantEmail).toBe(true);
    });

    it("reprend une invitation existante en member : passée admin, 14 jours, liée à la demande", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const invitationId = new ObjectId();
      await invitationsDb().insertOne({
        _id: invitationId,
        token: "jeton-existant",
        email: "direction@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: new ObjectId(),
        role: "member",
        created_at: new Date("2026-09-01"),
        expires_at: new Date("2026-09-05"),
      });
      const demande = await insererDemande("direction@cfa-tests.fr");

      await envoyerEtTraiter();

      const invitation = await invitationsDb().findOne({ _id: invitationId });
      expect(invitation).toMatchObject({
        role: "admin",
        demande_id: demande._id,
        token: "jeton-existant",
        author_id: EXPEDITEUR._id,
      });
      expect(invitation?.expires_at?.getTime()).toBeGreaterThan(Date.now() + DUREE_INVITATION_DEMANDE_MS - 60_000);
      expect(await invitationsDb().countDocuments()).toBe(1);
    });
  });

  describe("branche compte existant", () => {
    it("passe admin un compte confirmé et lui envoie le template avec compte", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId);
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("compte_existant");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({
        account_status: "CONFIRMED",
        organisation_role: "admin",
      });
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationAvecCompte,
        expect.objectContaining({
          PRENOM: "Camille",
          EMAIL: "direction@cfa-tests.fr",
          LIEN_CONNEXION: expect.stringContaining("/auth/connexion"),
        }),
        { redirectRecipientInNonProdTo: EXPEDITEUR.email }
      );
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "compte_existant" });
    });

    it("remplace par une invitation admin un compte PENDING_EMAIL_VALIDATION créé sans invitation", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      await insererCompte("direction@cfa-tests.fr", organisationId, {
        account_status: "PENDING_EMAIL_VALIDATION",
        organisation_role: null,
      });
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("activation");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().countDocuments({ email: "direction@cfa-tests.fr" })).toBe(0);
      expect(await invitationsDb().findOne({ email: "direction@cfa-tests.fr" })).toMatchObject({
        role: "admin",
        demande_id: demande._id,
      });
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(brevoMock).toHaveBeenCalledTimes(1);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationSansCompte,
        expect.anything(),
        expect.anything()
      );
      expect(await relire(demande)).toMatchObject({
        statut: "envoyee",
        branche_envoyee: "activation",
        etapes: { compte_at: expect.any(Date), invitation_at: expect.any(Date) },
      });
    });

    it("valide et passe admin un compte PENDING_ADMIN_VALIDATION, sans prévenir l'OFA", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId, {
        account_status: "PENDING_ADMIN_VALIDATION",
        organisation_role: null,
      });
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("compte_existant");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({
        account_status: "CONFIRMED",
        confirmed_at: expect.any(Date),
        organisation_role: "admin",
      });
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect(await invitationsDb().countDocuments()).toBe(0);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationAvecCompte,
        expect.anything(),
        expect.anything()
      );
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "compte_existant" });
    });

    it("garde le compte créé avec le lien d'une invitation et lui renvoie son lien de validation", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId, {
        account_status: "PENDING_EMAIL_VALIDATION",
        organisation_role: "member",
      });
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("activation");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({
        account_status: "PENDING_EMAIL_VALIDATION",
        organisation_role: "admin",
      });
      expect(sendEmailMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        "activation_cfa",
        expect.objectContaining({ isAdmin: true })
      );
      expect(brevoMock).not.toHaveBeenCalled();
      expect(await invitationsDb().countDocuments()).toBe(0);
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "activation" });
    });

    it("ne laisse pas un tiers inscrit avec l'email du demandeur devenir admin", async () => {
      await insererOrganisme();
      const inscription = {
        user: {
          email: "direction@cfa-tests.fr",
          civility: "Monsieur" as const,
          nom: "Tiers",
          prenom: "Usurpateur",
          fonction: "Directeur",
          telephone: "0102030405",
          password: "MotDePasseDuTiers1!",
          has_accept_cgu_version: "v0.4",
        },
        organisation: { type: "ORGANISME_FORMATION" as const, siret: SIRET, uai: UAI },
      };
      await register(inscription);
      addJobMock.mockReset();
      const demande = await insererDemande("direction@cfa-tests.fr");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().countDocuments({ email: "direction@cfa-tests.fr" })).toBe(0);
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "activation" });
      await expect(login("direction@cfa-tests.fr", "MotDePasseDuTiers1!")).rejects.toThrow();
      await expect(register(inscription)).rejects.toThrow("Une invitation CFA est en attente pour cet email");
    });

    it("garde un compte confirmé entre le clic et le job, et l'envoie en compte existant", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId, {
        account_status: "PENDING_ADMIN_VALIDATION",
      });
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      await usersMigrationDb().updateOne({ _id: compteId }, { $set: { account_status: "CONFIRMED" } });

      await traiterEnvoisDemandesActivation(organisme._id);

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({ organisation_role: "admin" });
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "compte_existant" });
      expect(await invitationsDb().countDocuments()).toBe(0);
    });

    it("trouve le compte malgré les majuscules de son email", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("Direction@CFA-tests.fr", organisationId);
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande).toMatchObject({ branche: "compte_existant", user_id: compteId });

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({ organisation_role: "admin" });
      expect(await invitationsDb().countDocuments()).toBe(0);
    });

    it("reconnaît un compte rattaché à une autre organisation du même établissement", async () => {
      const organisme = await insererOrganisme();
      await insererOrganisation(organisme._id);
      const doublon = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", doublon);
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande).toMatchObject({ branche: "compte_existant", motifs: [], organisation_id: doublon });

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({ organisation_role: "admin" });
      expect(await relire(demande)).toMatchObject({
        statut: "envoyee",
        branche_envoyee: "compte_existant",
        organisation_id: doublon,
      });
    });

    it("enregistre en compte existant un compte apparu dans l'organisation entre le clic et le job", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("activation");
      await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      await insererCompte("direction@cfa-tests.fr", organisationId);

      await traiterEnvoisDemandesActivation(organisme._id);

      expect(await relire(demande)).toMatchObject({
        statut: "envoyee",
        branche: "compte_existant",
        branche_envoyee: "compte_existant",
      });
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationAvecCompte,
        expect.anything(),
        expect.anything()
      );
      expect(await invitationsDb().countDocuments()).toBe(0);
    });

    it("activation dont l'email a un compte dans une autre organisation avant le job : échec, ni flag, ni email", async () => {
      const organisme = await insererOrganisme();
      await insererOrganisation(organisme._id);
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      await insererCompte("direction@cfa-tests.fr", new ObjectId());

      await traiterEnvoisDemandesActivation(organisme._id);

      expect(await relire(demande)).toMatchObject({
        statut: "echec",
        motif_echec: "Le demandeur a un compte rattaché à une autre organisation",
      });
      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBeUndefined();
      expect(await invitationsDb().countDocuments()).toBe(0);
      expect(brevoMock).not.toHaveBeenCalled();
    });

    it("compte passé dans une autre organisation avant le job : échec, ni rôle, ni flag, ni email", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId);
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      await usersMigrationDb().updateOne({ _id: compteId }, { $set: { organisation_id: new ObjectId() } });

      await traiterEnvoisDemandesActivation(organisme._id);

      expect(await relire(demande)).toMatchObject({
        statut: "echec",
        motif_echec: "Le demandeur a un compte rattaché à une autre organisation",
      });
      expect((await usersMigrationDb().findOne({ _id: compteId }))?.organisation_role).toBe("member");
      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBeUndefined();
      expect(brevoMock).not.toHaveBeenCalled();
    });
  });

  describe("branche forcée", () => {
    it("active DECA et invite l'admin d'un CFA sans apprenti dont la branche est forcée", async () => {
      const organisme = await insererOrganisme({}, 0);
      const demande = await insererDemande("direction@cfa-tests.fr", SIRET, { a_envoyer: false });
      expect(demande.motifs).toEqual(["aucun_effectif"]);

      const forcee = await modifierDemandeActivation(demande._id, { branche_forcee: "activation" });
      expect(forcee.branche).toBe("activation");
      await modifierDemandeActivation(demande._id, { a_envoyer: true });
      await envoyerEtTraiter();

      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBe(true);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationSansCompte,
        expect.anything(),
        expect.anything()
      );
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "activation" });
    });

    it("reste modifiable quand un compte apparaît dans l'organisation après le forçage en activation", async () => {
      const organisme = await insererOrganisme({}, 0);
      const organisationId = await insererOrganisation(organisme._id);
      const demande = await insererDemande("direction@cfa-tests.fr", SIRET, { a_envoyer: false });
      await modifierDemandeActivation(demande._id, { branche_forcee: "activation" });
      await insererCompte("direction@cfa-tests.fr", organisationId);
      await listerDemandesActivation();

      const ligne = await modifierDemandeActivation(demande._id, { a_envoyer: true });

      expect(ligne).toMatchObject({ branche: "compte_existant", branche_forcee: "compte_existant", a_envoyer: true });
    });
  });

  describe("refus avec mail", () => {
    it("envoie le template refus, par le job de l'organisme ou par le job sans organisme", async () => {
      await insererOrganisme({}, 0);
      const aucunApprenti = await insererDemande("direction@cfa-tests.fr");
      const siretInconnu = await insererDemande("compta@inconnu.fr", "99999999999999");

      await envoyerEtTraiter();

      expect(addJobMock).toHaveBeenCalledWith({
        name: "demandes-activation:envoyer",
        payload: { organismeId: null },
        queued: true,
      });
      expect(brevoMock).toHaveBeenCalledTimes(2);
      expect(brevoMock).toHaveBeenCalledWith(
        "compta@inconnu.fr",
        config.brevo.templatesDemandesActivation.refus,
        { NOM_CFA: "votre établissement" },
        { redirectRecipientInNonProdTo: EXPEDITEUR.email }
      );
      expect(await relire(aucunApprenti)).toMatchObject({ statut: "envoyee", branche_envoyee: "refus" });
      expect(await relire(siretInconnu)).toMatchObject({ statut: "envoyee", branche_envoyee: "refus" });
      expect(await invitationsDb().countDocuments()).toBe(0);
    });

    it("renvoie dans sa nouvelle branche un refus déjà envoyé devenu éligible", async () => {
      const organisme = await insererOrganisme({}, 0);
      const demande = await insererDemande("direction@cfa-tests.fr", SIRET, {
        statut: "envoyee",
        branche_envoyee: "refus",
        a_envoyer: false,
      });
      await effectifsDb().insertOne(
        testDoc<IEffectif>({
          _id: new ObjectId(),
          organisme_id: organisme._id,
          annee_scolaire: getActiveAnneesScolaires(new Date())[0],
        }),
        { bypassDocumentValidation: true }
      );
      await demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { a_envoyer: true } });

      await envoyerEtTraiter();

      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "activation" });
    });
  });

  describe("échecs", () => {
    it("passe en échec sur un envoi Brevo refusé ou un client Brevo absent, sans casser le job", async () => {
      await insererOrganisme();
      const refusee = await insererDemande("direction@cfa-tests.fr");
      const sansClient = await insererDemande("adjoint@cfa-tests.fr");
      brevoMock
        .mockResolvedValueOnce(undefined as never)
        .mockRejectedValueOnce(Boom.internal("Brevo instance not initialized"));

      await envoyerEtTraiter();

      const motifs = [(await relire(refusee))?.motif_echec, (await relire(sansClient))?.motif_echec];
      expect(motifs).toEqual(
        expect.arrayContaining(["Envoi Brevo en échec", "Envoi Brevo impossible : Brevo instance not initialized"])
      );
      expect(await demandesActivationCfaDb().countDocuments({ statut: "echec" })).toBe(2);
    });

    it("met en échec avant toute activation une demande dont le template Brevo n'est pas configuré", async () => {
      config.brevo.templatesDemandesActivation.activationSansCompte = 0;
      const organisme = await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");

      await envoyerEtTraiter();

      expect(await relire(demande)).toMatchObject({ statut: "echec", motif_echec: "Template Brevo non configuré" });
      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBeUndefined();
      expect(await invitationsDb().countDocuments()).toBe(0);
    });

    it("met en échec sans email les demandes d'un CFA désactivé pendant son activation", async () => {
      config.deca.flechageAuto = true;
      const organisme = await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      flecherMock.mockImplementation(async () => {
        await retirerGardeActivationDeca(organisme._id);
        return {} as never;
      });

      await envoyerEtTraiter();

      expect(await relire(demande)).toMatchObject({
        statut: "echec",
        motif_echec: "Activation DECA annulée par une désactivation",
      });
      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBeUndefined();
      expect(brevoMock).not.toHaveBeenCalled();
    });

    it("n'envoie rien pour une ligne qui cumule un motif avec mail et un motif sans mail", async () => {
      const demande = await insererDemande("direction@gmail.com", "99999999999999");
      expect(demande.motifs).toEqual(expect.arrayContaining(["siret_inconnu", "messagerie_grand_public"]));

      const bilan = await envoyerEtTraiter();

      expect(bilan.demandes).toBe(0);
      expect(brevoMock).not.toHaveBeenCalled();
      expect(await relire(demande)).toMatchObject({ statut: "pret", a_envoyer: false });
    });

    it("met en échec les demandes d'un CFA dont l'activation DECA est déjà en cours", async () => {
      const organisme = await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      await organismesDb().updateOne(
        { _id: organisme._id },
        { $set: { deca_activation_queued_at: new Date(Date.now() - 3600 * 1000) } }
      );

      await envoyerEtTraiter();

      expect((await relire(demande))?.motif_echec).toContain("Activation DECA déjà en cours");
      expect(brevoMock).not.toHaveBeenCalled();
    });

    it("met en échec sans email les demandes d'un CFA fermé entre l'envoi et le job", async () => {
      const organisme = await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      await organismesDb().updateOne({ _id: organisme._id }, { $set: { ferme: true } });

      await traiterEnvoisDemandesActivation(organisme._id);

      expect(await relire(demande)).toMatchObject({
        statut: "echec",
        motif_echec: "L'établissement n'est plus éligible à DECA",
      });
      expect(brevoMock).not.toHaveBeenCalled();
    });
  });

  describe("protections et renvois", () => {
    it("ne met en file qu'une fois après un double clic, et ignore une ligne non cochée", async () => {
      await insererOrganisme();
      await insererDemande("direction@cfa-tests.fr");
      const nonCochee = await insererDemande("adjoint@cfa-tests.fr", SIRET, { a_envoyer: false });

      const premier = await envoyerDemandesActivation(await cochees(), EXPEDITEUR);
      const second = await envoyerDemandesActivation(await cochees(), EXPEDITEUR);

      expect(premier.demandes).toBe(1);
      expect(second.demandes).toBe(0);
      expect(addJobMock).toHaveBeenCalledTimes(1);
      expect((await relire(nonCochee))?.statut).toBe("pret");
    });

    it("n'envoie que les demandes confirmées dans la modale", async () => {
      await insererOrganisme();
      const confirmee = await insererDemande("direction@cfa-tests.fr");
      const cocheeAilleurs = await insererDemande("adjoint@cfa-tests.fr");

      const bilan = await envoyerDemandesActivation([confirmee._id], EXPEDITEUR);

      expect(bilan.demandes).toBe(1);
      expect((await relire(confirmee))?.statut).toBe("envoi_en_cours");
      expect(await relire(cocheeAilleurs)).toMatchObject({ statut: "pret", a_envoyer: true });
    });

    it("un récapitulatif lu avant le clic ne remet pas à envoyer une ligne partie entre-temps", async () => {
      await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      pendantEvaluation.mockImplementationOnce(() => envoyerEtTraiter());

      await listerDemandesActivation();
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", a_envoyer: false });
      await envoyerEtTraiter();

      expect(brevoMock).toHaveBeenCalledTimes(1);
    });

    it("ne renvoie pas un refus déjà envoyé qui reste refusé", async () => {
      const demande = await insererDemande("compta@inconnu.fr", "99999999999999", {
        statut: "envoyee",
        branche_envoyee: "refus",
      });

      await envoyerEtTraiter();

      expect(brevoMock).not.toHaveBeenCalled();
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", a_envoyer: false });
    });

    it("renvoie une demande dont l'invitation a expiré : même invitation, prolongée, puis envoyée", async () => {
      await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerEtTraiter();
      const invitation = await invitationsDb().findOne({ email: "direction@cfa-tests.fr" });
      await invitationsDb().updateOne({ _id: invitation?._id }, { $set: { expires_at: new Date(Date.now() - 1000) } });
      await demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { statut: "invitation_expiree" } });
      addJobMock.mockClear();

      const ligne = await renvoyerDemandeActivation(demande._id, EXPEDITEUR);
      expect(ligne.statut).toBe("envoi_en_cours");
      await traiterEnvoisDemandesActivation(demande.organisme_id ?? null);

      expect(await relire(demande)).toMatchObject({ statut: "envoyee" });
      const reprise = await invitationsDb().findOne({ _id: invitation?._id });
      expect(reprise?.token).toBe(invitation?.token);
      expect(reprise?.expires_at?.getTime()).toBeGreaterThan(Date.now());
    });

    it("renvoie une invitation du workflow depuis l'écran admin par Brevo, prolongée de 14 jours", async () => {
      await insererOrganisme();
      await insererDemande("direction@cfa-tests.fr");
      await envoyerEtTraiter();
      const invitation = await invitationsDb().findOne({ email: "direction@cfa-tests.fr" });
      brevoMock.mockClear();

      const { expiresAt } = await resendAdminInvitation(invitation!._id.toString());

      expect(expiresAt.getTime()).toBeGreaterThan(Date.now() + DUREE_INVITATION_DEMANDE_MS - 60_000);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationSansCompte,
        expect.objectContaining({ LIEN_INSCRIPTION: expect.stringContaining(invitation!.token) }),
        { redirectRecipientInNonProdTo: EXPEDITEUR.email }
      );
      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it("repasse en envoyée une demande en échec dont l'invitation est renvoyée depuis l'écran admin", async () => {
      await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      brevoMock.mockResolvedValueOnce(undefined as never);
      await envoyerEtTraiter();
      expect((await relire(demande))?.statut).toBe("echec");
      const invitation = await invitationsDb().findOne({ email: "direction@cfa-tests.fr" });

      await resendAdminInvitation(invitation!._id.toString());

      expect(await relire(demande)).toMatchObject({
        statut: "envoyee",
        branche_envoyee: "activation",
        invitation_id: invitation!._id,
        motif_echec: null,
      });
    });

    it("n'invite pas une personne déjà invitée pour un autre établissement", async () => {
      const autre = await insererOrganisme({ siret: "13002374000447", uai: "0442096M" });
      await insererOrganisme();
      const premiere = await insererDemande("direction@cfa-tests.fr", "13002374000447");
      await envoyerEtTraiter();
      addJobMock.mockReset();
      const seconde = await insererDemande("direction@cfa-tests.fr");

      await envoyerEtTraiter();

      expect(await relire(premiere)).toMatchObject({ statut: "envoyee", organisme_id: autre._id });
      expect(await relire(seconde)).toMatchObject({
        statut: "echec",
        motif_echec: "Une invitation est déjà en attente pour cette personne dans un autre établissement",
      });
      expect(await invitationsDb().countDocuments({ email: "direction@cfa-tests.fr" })).toBe(1);
    });

    it("n'active qu'une fois une personne qui a deux demandes vers le même établissement", async () => {
      await insererOrganisme();
      const premiere = await insererDemande("direction@cfa-tests.fr");
      const corrigee = await insererDemande("direction@cfa-tests.fr", "13002374000400", { a_envoyer: false });
      await modifierDemandeActivation(corrigee._id, { siret_corrige: SIRET });
      await modifierDemandeActivation(corrigee._id, { a_envoyer: true });

      await envoyerEtTraiter();

      expect(await relire(premiere)).toMatchObject({ statut: "envoyee" });
      expect(await relire(corrigee)).toMatchObject({
        statut: "echec",
        motif_echec: "Une autre demande de cette personne pour cet établissement a déjà été envoyée",
      });
      expect(brevoMock).toHaveBeenCalledTimes(1);
    });

    it("repasse en activation une branche forcée en compte existant dont le compte a disparu", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@gmail.com", organisationId);
      const demande = await insererDemande("direction@gmail.com", SIRET, { a_envoyer: false });
      await modifierDemandeActivation(demande._id, { branche_forcee: "compte_existant" });
      await usersMigrationDb().deleteOne({ _id: compteId });
      await listerDemandesActivation();

      const ligne = await modifierDemandeActivation(demande._id, { a_envoyer: true });
      await envoyerEtTraiter();

      expect(ligne).toMatchObject({ branche: "activation", branche_forcee: "activation", motifs: [] });
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "activation" });
    });

    it("active de bout en bout une adresse grand public forcée en compte existant", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("henriman.direction@gmail.com", organisationId);
      const demande = await insererDemande("henriman.direction@gmail.com", SIRET, { a_envoyer: false });
      expect(demande.motifs).toEqual(["messagerie_grand_public"]);

      await modifierDemandeActivation(demande._id, { branche_forcee: "compte_existant" });
      await modifierDemandeActivation(demande._id, { a_envoyer: true });
      await envoyerEtTraiter();

      expect((await organismesDb().findOne({ _id: organisme._id }))?.is_allowed_deca).toBe(true);
      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({ organisation_role: "admin" });
      expect(brevoMock).toHaveBeenCalledWith(
        "henriman.direction@gmail.com",
        config.brevo.templatesDemandesActivation.activationAvecCompte,
        expect.anything(),
        expect.anything()
      );
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "compte_existant" });
    });

    it("n'écrit pas une ligne inchangée en relisant le récapitulatif", async () => {
      await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr");
      await listerDemandesActivation();
      const lue = await relire(demande);

      await listerDemandesActivation();

      expect((await relire(demande))?.updated_at).toEqual(lue?.updated_at);
    });

    it("refuse une modification croisée par une autre écriture", async () => {
      await insererOrganisme();
      const demande = await insererDemande("direction@cfa-tests.fr", SIRET, { a_envoyer: false });
      pendantEvaluation.mockImplementationOnce(() =>
        demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { updated_at: new Date() } })
      );

      await expect(modifierDemandeActivation(demande._id, { siret_corrige: SIRET })).rejects.toThrow(
        "La demande a changé entre-temps"
      );
    });

    it("réimporte une ligne croisée par une autre écriture sans perdre cette écriture", async () => {
      await insererOrganisme();
      const csv = (fonction: string) => ({
        buffer: Buffer.from(
          `Horodateur,Adresse email,SIRET de votre CFA,Fonction occupée,Questions ou remarques\n2026/10/16 3:45:45 PM UTC+3,direction@cfa-tests.fr,${SIRET},${fonction},\n`
        ),
        originalname: "export.csv",
      });
      await importerDemandesActivation(csv("Directrice"), "Webinaire");
      const demande = await demandesActivationCfaDb().findOne({ email: "direction@cfa-tests.fr" });
      pendantEvaluation.mockImplementationOnce(() =>
        demandesActivationCfaDb().updateOne(
          { _id: demande?._id },
          { $set: { a_envoyer: true, updated_at: new Date() } }
        )
      );

      const bilan = await importerDemandesActivation(csv("Directrice générale"), "Webinaire");

      expect(bilan).toMatchObject({ misesAJour: 1, inchangees: 0 });
      expect(await demandesActivationCfaDb().findOne({ _id: demande?._id })).toMatchObject({
        fonction: "Directrice générale",
        a_envoyer: true,
      });
    });
  });
});
