import * as Boom from "@hapi/boom";
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

import {
  DUREE_INVITATION_DEMANDE_MS,
  envoyerDemandesActivation,
  evaluerDemande,
  renvoyerDemandeActivation,
  traiterEnvoisDemandesActivation,
} from "@/common/actions/admin/demandes-activation.actions";
import { resendAdminInvitation } from "@/common/actions/admin/invitations.admin.actions";
import { flecherContratsDeca } from "@/common/actions/deca/deca-flechage.actions";
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
  overrides: { account_status?: IUsersMigration["account_status"] } = {}
) {
  const _id = new ObjectId();
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
    organisation_role: "member",
    account_status: "CONFIRMED",
    created_at: new Date(),
    ...overrides,
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

async function envoyerEtTraiter() {
  const bilan = await envoyerDemandesActivation(EXPEDITEUR);
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
  });

  afterEach(() => {
    config.deca.flechageAuto = false;
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
      expect(invitation).toMatchObject({ role: "admin", demande_id: demande._id, token: "jeton-existant" });
      expect(invitation?.expires_at?.getTime()).toBeGreaterThan(Date.now() + DUREE_INVITATION_DEMANDE_MS - 60_000);
      expect(await invitationsDb().countDocuments()).toBe(1);
    });
  });

  describe("branche compte existant", () => {
    it("valide un compte en attente sans notify_access_granted_ofa, le passe admin et envoie le template avec compte", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId, {
        account_status: "PENDING_ADMIN_VALIDATION",
      });
      const demande = await insererDemande("direction@cfa-tests.fr");
      expect(demande.branche).toBe("compte_existant");

      await envoyerEtTraiter();

      expect(await usersMigrationDb().findOne({ _id: compteId })).toMatchObject({
        account_status: "CONFIRMED",
        organisation_role: "admin",
      });
      expect(sendEmailMock).not.toHaveBeenCalledWith(expect.anything(), "notify_access_granted_ofa", expect.anything());
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        config.brevo.templatesDemandesActivation.activationAvecCompte,
        expect.objectContaining({ PRENOM: "Camille", LIEN_CONNEXION: expect.stringContaining("/auth/connexion") }),
        { redirectRecipientInNonProdTo: EXPEDITEUR.email }
      );
      expect(await relire(demande)).toMatchObject({ statut: "envoyee", branche_envoyee: "compte_existant" });
    });

    it("compte passé dans une autre organisation avant le job : échec, ni rôle, ni flag, ni email", async () => {
      const organisme = await insererOrganisme();
      const organisationId = await insererOrganisation(organisme._id);
      const compteId = await insererCompte("direction@cfa-tests.fr", organisationId);
      const demande = await insererDemande("direction@cfa-tests.fr");
      await envoyerDemandesActivation(EXPEDITEUR);
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
        expect.objectContaining({ EMAIL_CONTACT: EXPEDITEUR.email }),
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
      await envoyerDemandesActivation(EXPEDITEUR);
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

      const premier = await envoyerDemandesActivation(EXPEDITEUR);
      const second = await envoyerDemandesActivation(EXPEDITEUR);

      expect(premier.demandes).toBe(1);
      expect(second.demandes).toBe(0);
      expect(addJobMock).toHaveBeenCalledTimes(1);
      expect((await relire(nonCochee))?.statut).toBe("pret");
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
  });
});
