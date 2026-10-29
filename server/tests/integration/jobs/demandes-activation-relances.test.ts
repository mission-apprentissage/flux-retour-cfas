import { addJob } from "job-processor";
import { ObjectId } from "mongodb";
import { NATURE_ORGANISME_DE_FORMATION } from "shared/constants";
import type { IDemandeActivationCfa } from "shared/models/data/demandesActivationCfa.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { login } from "@/common/actions/account.actions";
import {
  envoyerInvitezCollaborateurs,
  mettreEnFileInvitezCollaborateurs,
  relancerDemandesActivation,
} from "@/common/actions/admin/demandes-activation-relances.actions";
import { MOTIF_COMPTE_AILLEURS, renvoyerDemandeActivation } from "@/common/actions/admin/demandes-activation.actions";
import { rejectInvitation } from "@/common/actions/organisations.actions";
import {
  demandesActivationCfaDb,
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { sendEmail } from "@/common/services/mailer/mailer";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc, testPasswordHash } from "@tests/utils/testUtils";

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

useMongo();

const brevoMock = vi.mocked(sendTransactionalEmail);
const sendEmailMock = vi.mocked(sendEmail);
const addJobMock = vi.mocked(addJob);

const JOUR = 24 * 3600 * 1000;
const ENVOI = new Date("2026-10-28T09:00:00.000Z");
const plus = (jours: number) => new Date(ENVOI.getTime() + jours * JOUR);
const ADMIN_TBA = "admin@tba.beta.gouv.fr";
const templates = config.brevo.templatesDemandesActivation;

let organismeId: ObjectId;
let organisationId: ObjectId;

async function insererCompte(email: string, overrides: Partial<IUsersMigration> = {}) {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne({
    _id,
    email,
    prenom: "Camille",
    nom: "Martin",
    civility: "Madame",
    fonction: "Directrice",
    telephone: "",
    password: testPasswordHash,
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
    has_accept_cgu_version: "v0.1",
    organisation_id: organisationId,
    organisation_role: "admin",
    account_status: "CONFIRMED",
    created_at: ENVOI,
    ...overrides,
  });
  return _id;
}

async function insererDemande(overrides: Partial<IDemandeActivationCfa> = {}) {
  const email = overrides.email ?? "direction@cfa-tests.fr";
  const demande: IDemandeActivationCfa = {
    _id: new ObjectId(),
    source: "Webinaire",
    email_saisi: email,
    email,
    siret_saisi_brut: "13002374000439",
    siret_saisi: "13002374000439",
    siret: "13002374000439",
    organisme_id: organismeId,
    organisation_id: organisationId,
    motifs: [],
    domaine_inconnu: false,
    branche: "activation",
    branche_initiale: "activation",
    branche_envoyee: "activation",
    a_envoyer: false,
    statut: "envoyee",
    envoye_par_id: new ObjectId(),
    envoye_par_email: ADMIN_TBA,
    envoyee_at: ENVOI,
    created_at: ENVOI,
    updated_at: ENVOI,
    ...overrides,
  };
  await demandesActivationCfaDb().insertOne(demande);
  return demande;
}

async function insererInvitation(overrides: Record<string, unknown> = {}) {
  const invitation = {
    _id: new ObjectId(),
    token: `jeton-${new ObjectId().toString()}`,
    email: "direction@cfa-tests.fr",
    organisation_id: organisationId,
    author_id: new ObjectId(),
    role: "admin" as const,
    created_at: ENVOI,
    expires_at: plus(14),
    ...overrides,
  };
  await invitationsDb().insertOne(invitation);
  return invitation;
}

const relire = (demande: IDemandeActivationCfa) => demandesActivationCfaDb().findOne({ _id: demande._id });
const templatesEnvoyes = () => brevoMock.mock.calls.map(([destinataire, templateId]) => ({ destinataire, templateId }));

describe("relances du workflow d'activation", () => {
  beforeEach(async () => {
    brevoMock.mockReset().mockResolvedValue({ messageId: "message" } as never);
    sendEmailMock.mockReset();
    addJobMock.mockReset();
    const organisme = generateOrganismeFixture({
      _id: new ObjectId(),
      siret: "13002374000439",
      uai: "0442095L",
      nature: NATURE_ORGANISME_DE_FORMATION.FORMATEUR,
      nom: "CFA DES TESTS",
    });
    await organismesDb().insertOne(organisme, { bypassDocumentValidation: true });
    organismeId = organisme._id;
    organisationId = new ObjectId();
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: organisationId,
        type: "ORGANISME_FORMATION",
        siret: "13002374000439",
        uai: "0442095L",
        organisme_id: organismeId.toString(),
        created_at: ENVOI,
      }),
      { bypassDocumentValidation: true }
    );
  });

  describe("« invitez vos collaborateurs »", () => {
    it("n'est mis en file qu'une fois, cinq minutes après la connexion", async () => {
      const demande = await insererDemande();
      const compteId = await insererCompte("direction@cfa-tests.fr");
      const utilisateur = { _id: compteId, email: "direction@cfa-tests.fr", organisation_id: organisationId };

      await mettreEnFileInvitezCollaborateurs(utilisateur);
      await mettreEnFileInvitezCollaborateurs(utilisateur);

      expect(addJobMock).toHaveBeenCalledTimes(1);
      expect(addJobMock).toHaveBeenCalledWith({
        name: "demandes-activation:inviter-collaborateurs",
        payload: { demandeId: demande._id.toString() },
        queued: true,
        scheduled_for: expect.any(Date),
      });
      expect(await relire(demande)).toMatchObject({ user_id: compteId, invitez_queued_at: expect.any(Date) });
    });

    it("n'est pas mis en file pour un refus envoyé", async () => {
      await insererDemande({ branche: "refus", branche_envoyee: "refus", motifs: ["aucun_effectif"] });
      const compteId = await insererCompte("direction@cfa-tests.fr");

      await mettreEnFileInvitezCollaborateurs({
        _id: compteId,
        email: "direction@cfa-tests.fr",
        organisation_id: organisationId,
      });

      expect(addJobMock).not.toHaveBeenCalled();
    });

    it("ne bloque pas la connexion quand la mise en file échoue, et remet en file à la connexion suivante", async () => {
      const demande = await insererDemande();
      await insererCompte("direction@cfa-tests.fr");
      addJobMock.mockRejectedValueOnce(new Error("file indisponible"));

      await expect(login("direction@cfa-tests.fr", "MDP-azerty123")).resolves.toEqual(expect.any(String));
      expect((await relire(demande))?.invitez_queued_at ?? null).toBeNull();
      await login("direction@cfa-tests.fr", "MDP-azerty123");

      expect(addJobMock).toHaveBeenCalledTimes(2);
      expect((await relire(demande))?.invitez_queued_at).toEqual(expect.any(Date));
    });

    it("est remis en file à la connexion suivante quand Brevo n'a pas pu l'envoyer", async () => {
      const compteId = await insererCompte("direction@cfa-tests.fr");
      const demande = await insererDemande({ user_id: compteId, invitez_queued_at: plus(1) });
      brevoMock.mockResolvedValueOnce(undefined as never);

      await envoyerInvitezCollaborateurs(demande._id);
      await mettreEnFileInvitezCollaborateurs({
        _id: compteId,
        email: "direction@cfa-tests.fr",
        organisation_id: organisationId,
      });

      expect(addJobMock).toHaveBeenCalledTimes(1);
      expect(await relire(demande)).toMatchObject({ invitez_sent_at: null, invitez_queued_at: expect.any(Date) });
    });

    it("part une seule fois vers l'admin", async () => {
      const compteId = await insererCompte("direction@cfa-tests.fr");
      const demande = await insererDemande({ user_id: compteId, invitez_queued_at: plus(1) });

      await envoyerInvitezCollaborateurs(demande._id);
      await envoyerInvitezCollaborateurs(demande._id);

      expect(brevoMock).toHaveBeenCalledTimes(1);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        templates.invitezCollaborateurs,
        expect.objectContaining({
          PRENOM: "Camille",
          NOM: "Martin",
          LIEN_INVITER: expect.stringContaining("/cfa/roles-habilitations"),
        }),
        { redirectRecipientInNonProdTo: ADMIN_TBA }
      );
    });
  });

  describe("admin sans compte", () => {
    it("est relancé à J+7, une seule fois, avec le lien de son invitation", async () => {
      const invitation = await insererInvitation();
      await insererDemande({ invitation_id: invitation._id });

      await relancerDemandesActivation(plus(6));
      expect(brevoMock).not.toHaveBeenCalled();

      await relancerDemandesActivation(plus(7));
      await relancerDemandesActivation(plus(8));

      expect(brevoMock).toHaveBeenCalledTimes(1);
      expect(brevoMock).toHaveBeenCalledWith(
        "direction@cfa-tests.fr",
        templates.relanceSansCompte,
        expect.objectContaining({ LIEN_INSCRIPTION: expect.stringContaining(invitation.token) }),
        { redirectRecipientInNonProdTo: ADMIN_TBA }
      );
    });

    it("est relancé au passage suivant quand Brevo a échoué", async () => {
      const invitation = await insererInvitation();
      const demande = await insererDemande({ invitation_id: invitation._id });
      brevoMock.mockResolvedValueOnce(undefined as never);

      await relancerDemandesActivation(plus(7));
      expect((await relire(demande))?.relance_sans_compte_at).toBeNull();
      await relancerDemandesActivation(plus(8));

      expect(brevoMock).toHaveBeenCalledTimes(2);
      expect((await relire(demande))?.relance_sans_compte_at).toEqual(expect.any(Date));
    });

    it("n'est pas marqué relancé tant que le template n'est pas configuré", async () => {
      const templateId = templates.relanceSansCompte;
      const invitation = await insererInvitation();
      const demande = await insererDemande({ invitation_id: invitation._id });
      templates.relanceSansCompte = 0;

      try {
        await relancerDemandesActivation(plus(7));
      } finally {
        templates.relanceSansCompte = templateId;
      }
      expect((await relire(demande))?.relance_sans_compte_at ?? null).toBeNull();
      await relancerDemandesActivation(plus(8));

      expect(templatesEnvoyes()).toEqual([{ destinataire: "direction@cfa-tests.fr", templateId }]);
    });

    it("inscrit sans avoir validé son email à J+2 : un seul renvoi de la validation, aucune relance « sans compte »", async () => {
      const invitation = await insererInvitation();
      await insererDemande({ invitation_id: invitation._id });
      await insererCompte("direction@cfa-tests.fr", {
        account_status: "PENDING_EMAIL_VALIDATION",
        created_at: plus(0.5),
      });

      await relancerDemandesActivation(plus(3));
      await relancerDemandesActivation(plus(8));

      expect(sendEmailMock.mock.calls.filter(([, template]) => template === "activation_cfa")).toHaveLength(1);
      expect(brevoMock).not.toHaveBeenCalled();
    });

    it("ne renvoie pas la validation à un compte d'une autre organisation", async () => {
      const invitation = await insererInvitation();
      await insererDemande({ invitation_id: invitation._id });
      await insererCompte("direction@cfa-tests.fr", {
        account_status: "PENDING_EMAIL_VALIDATION",
        organisation_id: new ObjectId(),
        created_at: plus(0.5),
      });

      await relancerDemandesActivation(plus(3));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it("renvoie la validation au passage suivant quand le délai entre deux renvois n'est pas écoulé", async () => {
      const invitation = await insererInvitation();
      const demande = await insererDemande({ invitation_id: invitation._id });
      const compteId = await insererCompte("direction@cfa-tests.fr", {
        account_status: "PENDING_EMAIL_VALIDATION",
        created_at: plus(0.5),
        last_activation_email_sent_at: new Date(),
      });

      await relancerDemandesActivation(plus(3));
      expect(sendEmailMock).not.toHaveBeenCalled();
      expect((await relire(demande))?.relance_validation_email_at ?? null).toBeNull();

      await usersMigrationDb().updateOne({ _id: compteId }, { $set: { last_activation_email_sent_at: plus(-1) } });
      await relancerDemandesActivation(plus(3.1));
      expect(sendEmailMock.mock.calls.filter(([, template]) => template === "activation_cfa")).toHaveLength(1);
    });

    it("ne renvoie pas la validation à un compte créé sans invitation", async () => {
      const invitation = await insererInvitation();
      await insererDemande({ invitation_id: invitation._id });
      const compteId = await insererCompte("direction@cfa-tests.fr", {
        account_status: "PENDING_EMAIL_VALIDATION",
        created_at: plus(0.5),
      });
      await usersMigrationDb().updateOne({ _id: compteId }, { $unset: { organisation_role: "" } });

      await relancerDemandesActivation(plus(3));

      expect(sendEmailMock).not.toHaveBeenCalled();
    });

    it("passe en échec quand un compte est créé avec son email dans une autre organisation", async () => {
      const invitation = await insererInvitation();
      const demande = await insererDemande({ invitation_id: invitation._id });
      await insererCompte("direction@cfa-tests.fr", { organisation_id: new ObjectId(), created_at: plus(1) });

      await relancerDemandesActivation(plus(8));

      expect(await relire(demande)).toMatchObject({ statut: "echec", motif_echec: MOTIF_COMPTE_AILLEURS });
      expect(brevoMock).not.toHaveBeenCalled();
    });

    it("passe en échec quand l'invité refuse l'invitation", async () => {
      const auteur = await insererCompte(ADMIN_TBA, { organisation_id: new ObjectId() });
      const demande = await insererDemande();
      const invitation = await insererInvitation({ author_id: auteur, demande_id: demande._id });
      await demandesActivationCfaDb().updateOne({ _id: demande._id }, { $set: { invitation_id: invitation._id } });

      await rejectInvitation(invitation.token);
      await relancerDemandesActivation(plus(1));

      expect(await relire(demande)).toMatchObject({
        statut: "echec",
        motif_echec: "Invitation refusée par le destinataire",
      });
    });

    it("passe en échec, renvoyable, quand son invitation a été annulée", async () => {
      const invitation = await insererInvitation();
      const demande = await insererDemande({ invitation_id: invitation._id });
      await invitationsDb().deleteOne({ _id: invitation._id });

      await relancerDemandesActivation(plus(1));

      expect(await relire(demande)).toMatchObject({ statut: "echec", motif_echec: "Invitation annulée : à renvoyer" });
      const ligne = await renvoyerDemandeActivation(demande._id, { _id: new ObjectId(), email: ADMIN_TBA });
      expect(ligne.statut).toBe("envoi_en_cours");
    });

    it("est relancé à nouveau après un renvoi", async () => {
      const invitation = await insererInvitation({ expires_at: plus(14) });
      const demande = await insererDemande({ invitation_id: invitation._id });
      await relancerDemandesActivation(plus(7));
      await relancerDemandesActivation(plus(15));
      expect((await relire(demande))?.statut).toBe("invitation_expiree");

      await renvoyerDemandeActivation(demande._id, { _id: new ObjectId(), email: ADMIN_TBA });

      expect(await relire(demande)).toMatchObject({ relance_sans_compte_at: null, relance_validation_email_at: null });
    });

    it("passe en « invitation expirée » quand l'invitation expire sans compte, puis peut être renvoyé", async () => {
      const invitation = await insererInvitation({ expires_at: plus(14) });
      const demande = await insererDemande({ invitation_id: invitation._id });

      await relancerDemandesActivation(plus(15));

      expect((await relire(demande))?.statut).toBe("invitation_expiree");
      const ligne = await renvoyerDemandeActivation(demande._id, { _id: new ObjectId(), email: ADMIN_TBA });
      expect(ligne.statut).toBe("envoi_en_cours");
    });
  });

  describe("admin avec compte", () => {
    it("est relancé à J+7 s'il ne s'est pas connecté depuis l'envoi, pas s'il s'est connecté", async () => {
      await insererCompte("direction@cfa-tests.fr", { last_connection: plus(-30) });
      await insererCompte("adjoint@cfa-tests.fr", { connection_history: [plus(2)], last_connection: plus(2) });
      await insererDemande({ branche: "compte_existant", branche_envoyee: "compte_existant" });
      await insererDemande({
        email: "adjoint@cfa-tests.fr",
        branche: "compte_existant",
        branche_envoyee: "compte_existant",
      });

      await relancerDemandesActivation(plus(7));

      expect(templatesEnvoyes()).toEqual([
        { destinataire: "direction@cfa-tests.fr", templateId: templates.relanceAvecCompte },
      ]);
      expect(brevoMock.mock.calls[0][2]).toMatchObject({ EMAIL: "direction@cfa-tests.fr" });
    });

    it("est retrouvé malgré les majuscules de son email", async () => {
      await insererCompte("Direction@CFA-tests.fr", { last_connection: plus(-30) });
      await insererDemande({ branche: "compte_existant", branche_envoyee: "compte_existant" });

      await relancerDemandesActivation(plus(7));

      expect(templatesEnvoyes()).toEqual([
        { destinataire: "direction@cfa-tests.fr", templateId: templates.relanceAvecCompte },
      ]);
    });
  });

  describe("après « invitez vos collaborateurs »", () => {
    it("relance l'admin qui n'a invité personne en 7 jours, pas celui qui a invité", async () => {
      const silencieux = await insererCompte("direction@cfa-tests.fr");
      const actif = await insererCompte("adjoint@cfa-tests.fr");
      await insererDemande({ user_id: silencieux, invitez_sent_at: plus(1) });
      await insererDemande({ email: "adjoint@cfa-tests.fr", user_id: actif, invitez_sent_at: plus(1) });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-archive",
        email: "collegue@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: actif,
        role: "member",
        created_at: plus(2),
      });

      await relancerDemandesActivation(plus(8));

      expect(templatesEnvoyes()).toContainEqual({
        destinataire: "direction@cfa-tests.fr",
        templateId: templates.relanceSansInvitation,
      });
      expect(
        brevoMock.mock.calls.find(([, templateId]) => templateId === templates.relanceSansInvitation)?.[2]
      ).toMatchObject({ PRENOM: "Camille", NOM: "Martin" });
      expect(templatesEnvoyes()).not.toContainEqual({
        destinataire: "adjoint@cfa-tests.fr",
        templateId: templates.relanceSansInvitation,
      });
    });

    it("relance l'admin, une fois, quand son invité n'a pas créé de compte en 48 h ; pas pour une invitation archivée", async () => {
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({ user_id: admin, invitez_sent_at: plus(1) });
      await insererInvitation({
        email: "collegue@cfa-tests.fr",
        author_id: admin,
        role: "member",
        created_at: plus(1),
      });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-consomme",
        email: "inscrit@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: admin,
        role: "member",
        created_at: plus(1),
      });

      await relancerDemandesActivation(plus(4));
      await relancerDemandesActivation(plus(5));

      const relances = brevoMock.mock.calls.filter(
        ([, templateId]) => templateId === templates.relanceInvitationEnAttente
      );
      expect(relances).toHaveLength(1);
      expect(relances[0][0]).toBe("direction@cfa-tests.fr");
      expect(relances[0][2]).toMatchObject({
        EMAIL_INVITE: "collegue@cfa-tests.fr",
        LIEN_INVITER: expect.stringContaining("/cfa/roles-habilitations"),
      });
    });

    it("ne relance pas une invitation antérieure à l'envoi de la demande, ni une invitation expirée", async () => {
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({
        user_id: admin,
        branche: "compte_existant",
        branche_envoyee: "compte_existant",
        invitez_sent_at: plus(1),
      });
      await insererInvitation({
        email: "ancien@cfa-tests.fr",
        author_id: admin,
        role: "member",
        created_at: plus(-200),
        expires_at: plus(-196),
      });
      await insererInvitation({
        email: "expire@cfa-tests.fr",
        author_id: admin,
        role: "member",
        created_at: plus(1),
        expires_at: plus(2),
      });

      await relancerDemandesActivation(plus(4));

      expect(templatesEnvoyes()).not.toContainEqual(
        expect.objectContaining({ templateId: templates.relanceInvitationEnAttente })
      );
    });

    it("n'accueille pas un collaborateur invité avant l'envoi de la demande", async () => {
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({ user_id: admin, invitez_sent_at: plus(1) });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-ancien",
        email: "ancien@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: admin,
        role: "member",
        created_at: plus(-300),
      });
      await insererCompte("ancien@cfa-tests.fr", { organisation_role: "member", connection_history: [plus(0.5)] });

      await relancerDemandesActivation(plus(2));

      expect(templatesEnvoyes()).not.toContainEqual(
        expect.objectContaining({ templateId: templates.onboardingCollaborateur })
      );
    });

    it("n'accueille pas un collaborateur connecté depuis plus de trois jours", async () => {
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({ user_id: admin, invitez_sent_at: plus(1) });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-consomme",
        email: "collegue@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: admin,
        role: "member",
        created_at: plus(2),
      });
      await insererCompte("collegue@cfa-tests.fr", { organisation_role: "member", connection_history: [plus(3)] });

      await relancerDemandesActivation(plus(20));

      expect(templatesEnvoyes()).not.toContainEqual(
        expect.objectContaining({ templateId: templates.onboardingCollaborateur })
      );
    });

    it("ne marque ni relance 48 h ni accueil tant que leur template n'est pas configuré", async () => {
      const { relanceInvitationEnAttente, onboardingCollaborateur } = templates;
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({ user_id: admin, invitez_sent_at: plus(1) });
      const invitation = await insererInvitation({
        email: "attente@cfa-tests.fr",
        author_id: admin,
        role: "member",
        created_at: plus(1),
      });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-consomme",
        email: "collegue@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: admin,
        role: "member",
        created_at: plus(2),
      });
      const collegue = await insererCompte("collegue@cfa-tests.fr", {
        organisation_role: "member",
        connection_history: [plus(3)],
      });
      templates.relanceInvitationEnAttente = 0;
      templates.onboardingCollaborateur = 0;

      try {
        await relancerDemandesActivation(plus(4.5));
      } finally {
        Object.assign(templates, { relanceInvitationEnAttente, onboardingCollaborateur });
      }

      expect(brevoMock).not.toHaveBeenCalled();
      expect(await invitationsDb().findOne({ _id: invitation._id })).not.toHaveProperty("relance_admin_at");
      expect(await usersMigrationDb().findOne({ _id: collegue })).not.toHaveProperty("onboarding_collaborateur_at");
    });

    it("accueille le collaborateur un jour après sa première connexion", async () => {
      const admin = await insererCompte("direction@cfa-tests.fr");
      await insererDemande({ user_id: admin, invitez_sent_at: plus(1) });
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        token: "jeton-consomme",
        email: "collegue@cfa-tests.fr",
        organisation_id: organisationId,
        author_id: admin,
        role: "member",
        created_at: plus(2),
      });
      await insererCompte("collegue@cfa-tests.fr", {
        organisation_role: "member",
        prenom: "Sacha",
        connection_history: [plus(3)],
      });

      await relancerDemandesActivation(plus(3.5));
      expect(templatesEnvoyes()).not.toContainEqual(
        expect.objectContaining({ templateId: templates.onboardingCollaborateur })
      );

      await relancerDemandesActivation(plus(4.5));
      await relancerDemandesActivation(plus(5.5));

      const accueils = brevoMock.mock.calls.filter(
        ([, templateId]) => templateId === templates.onboardingCollaborateur
      );
      expect(accueils).toHaveLength(1);
      expect(accueils[0][0]).toBe("collegue@cfa-tests.fr");
      expect(accueils[0][2]).toMatchObject({
        PRENOM: "Sacha",
        LIEN_EFFECTIFS: expect.stringContaining("/cfa/effectifs"),
        LIEN_COLLABORATIONS: expect.stringContaining("/cfa/collaborations"),
      });
    });
  });

  it("passe en échec une ligne bloquée en cours d'envoi depuis 24 h", async () => {
    const bloquee = await insererDemande({ statut: "envoi_en_cours", envoi_en_cours_at: ENVOI });
    const recente = await insererDemande({
      email: "adjoint@cfa-tests.fr",
      statut: "envoi_en_cours",
      envoi_en_cours_at: plus(0.9),
    });

    await relancerDemandesActivation(plus(1));

    expect(await relire(bloquee)).toMatchObject({ statut: "echec", motif_echec: "Envoi interrompu : à renvoyer" });
    expect((await relire(recente))?.statut).toBe("envoi_en_cours");
  });
});
