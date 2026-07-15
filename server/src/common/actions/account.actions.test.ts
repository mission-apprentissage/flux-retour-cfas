import { ObjectId } from "bson";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { invitationsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { activateUser, register, registerCfa } from "./account.actions";
import { enqueueBrevoContactSync } from "./brevo/contacts/enqueue-sync";
import { buildOrgaOf, buildUser } from "./brevo/contacts/fixtures";
import { enqueueBrevoEvent } from "./brevo/events/enqueue-event";
import { createOrganisation } from "./organisations.actions";

// On espionne l'enqueue directement plutôt que d'activer le toggle : hors prod,
// `isBrevoInstantSyncActive()` renvoie false et court-circuiterait l'appel réel.
// Ce qu'on teste ici, c'est le *câblage* (l'action appelle bien l'enqueue avec le
// bon userId), pas le comportement interne de l'enqueue (couvert par enqueue-sync.test.ts).
vi.mock("./brevo/contacts/enqueue-sync", () => ({ enqueueBrevoContactSync: vi.fn() }));
vi.mock("./brevo/events/enqueue-event", () => ({ enqueueBrevoEvent: vi.fn() }));
// Le mailer part sur le réseau : on le neutralise.
vi.mock("@/common/services/mailer/mailer");

useMongo();

const enqueueMock = vi.mocked(enqueueBrevoContactSync);
const eventMock = vi.mocked(enqueueBrevoEvent);

const buildRegistrationUser = (email: string) => ({
  email,
  civility: "Madame" as const,
  nom: "DUPONT",
  prenom: "Alice",
  fonction: "Conseillère",
  telephone: "0123456789",
  password: "MotDePasse123!",
  has_accept_cgu_version: "v1",
});

describe("account.actions — câblage de la synchro Brevo instantanée", () => {
  beforeEach(() => {
    enqueueMock.mockReset();
    eventMock.mockReset();
  });

  describe("register", () => {
    it("enfile la synchro du compte créé (chemin standard → PENDING_EMAIL_VALIDATION)", async () => {
      const result = await register({
        user: buildRegistrationUser("nouveau@example.com"),
        organisation: { type: "ADMINISTRATEUR" },
      });

      expect(result.account_status).toBe("PENDING_EMAIL_VALIDATION");
      expect(enqueueMock).toHaveBeenCalledOnce();
      const created = await usersMigrationDb().findOne({ email: "nouveau@example.com" });
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(created!._id));
      expect(eventMock).not.toHaveBeenCalled();
    });

    it("enfile la synchro du compte créé (chemin invitation → CONFIRMED)", async () => {
      const organisationId = await createOrganisation({ type: "ADMINISTRATEUR" });
      await invitationsDb().insertOne({
        _id: new ObjectId(),
        token: "tok-invite",
        email: "invite@example.com",
        organisation_id: organisationId,
        author_id: new ObjectId(),
        created_at: new Date(),
      } as any);

      const result = await register({
        user: buildRegistrationUser("invite@example.com"),
        organisation: { type: "ADMINISTRATEUR" },
      });

      expect(result.account_status).toBe("CONFIRMED");
      expect(enqueueMock).toHaveBeenCalledOnce();
      const created = await usersMigrationDb().findOne({ email: "invite@example.com" });
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(created!._id));
      expect(eventMock).toHaveBeenCalledWith("account-confirmed", { userId: created!._id.toString() });
    });
  });

  describe("activateUser", () => {
    // `buildUser`/`buildOrgaOf` produisent des documents conformes au schéma Mongo
    // (validation activée en test). `activateUser` ne lit de l'organisation que son
    // `type` : un OF emprunte des branches non-ML, sans effet de bord.
    const seedPendingUser = async (override: Record<string, any> = {}) => {
      const orga = buildOrgaOf();
      await organisationsDb().insertOne(orga as any);
      const user = buildUser(orga, { account_status: "PENDING_EMAIL_VALIDATION", ...override });
      await usersMigrationDb().insertOne(user as any);
      return { user, orga };
    };

    const buildCtx = (user: any, orga: any, extra: Record<string, any> = {}) =>
      ({
        _id: user._id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        civility: user.civility,
        organisation_id: orga._id,
        organisation: { _id: orga._id, type: orga.type },
        account_status: user.account_status,
        ...extra,
      }) as any;

    it("branche CFA (organisation_role) → CONFIRMED : enfile la synchro du compte activé", async () => {
      const { user, orga } = await seedPendingUser();
      const ctx = buildCtx(user, orga, { organisation_role: "admin" });

      const result = await activateUser(ctx);

      expect(result.account_status).toBe("CONFIRMED");
      expect(enqueueMock).toHaveBeenCalledOnce();
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(user._id));
      expect(eventMock).toHaveBeenCalledWith("account-confirmed", { userId: user._id.toString() });
    });

    it("branche standard → PENDING_ADMIN_VALIDATION : enfile la synchro du compte", async () => {
      const { user, orga } = await seedPendingUser();
      const ctx = buildCtx(user, orga);

      const result = await activateUser(ctx);

      expect(result.account_status).toBe("PENDING_ADMIN_VALIDATION");
      expect(enqueueMock).toHaveBeenCalledOnce();
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(user._id));
      expect(eventMock).not.toHaveBeenCalled();
    });

    it("n'enfile rien si le compte n'est plus PENDING_EMAIL_VALIDATION (double activation)", async () => {
      const { user, orga } = await seedPendingUser({ account_status: "CONFIRMED" });
      const ctx = buildCtx(user, orga);

      await activateUser(ctx);

      expect(enqueueMock).not.toHaveBeenCalled();
      expect(eventMock).not.toHaveBeenCalled();
    });
  });

  describe("registerCfa", () => {
    it("enfile la synchro du compte CFA créé", async () => {
      await invitationsDb().insertOne({
        _id: new ObjectId(),
        token: "tok-cfa",
        email: "cfa@example.com",
        organisation_id: new ObjectId(),
        author_id: new ObjectId(),
        role: "member",
        created_at: new Date(),
      } as any);

      const result = await registerCfa({
        token: "tok-cfa",
        nom: "MARTIN",
        prenom: "Bob",
        telephone: "0123456789",
        fonction: "Formateur",
        password: "MotDePasse123!",
        has_accept_cgu_version: "v1",
      });

      expect(result.account_status).toBe("PENDING_EMAIL_VALIDATION");
      expect(enqueueMock).toHaveBeenCalledOnce();
      const created = await usersMigrationDb().findOne({ email: "cfa@example.com" });
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(created!._id));
      expect(eventMock).not.toHaveBeenCalled();
    });
  });
});
