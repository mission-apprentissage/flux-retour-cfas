import { ObjectId } from "bson";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { organisationsDb, usersMigrationDb } from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc, testDocs } from "@tests/utils/testUtils";

import { enqueueBrevoContactSync } from "./brevo/contacts/enqueue-sync";
import { buildOrgaOf, buildUser, NOW } from "./brevo/contacts/fixtures";
import { enqueueBrevoEvent } from "./brevo/events/enqueue-event";
import { getCfaAccountsByOrganismeIds, rejectMembre, validateMembre } from "./organisations.actions";

// Voir account.actions.test.ts : on espionne le câblage, pas le comportement interne
// de l'enqueue (qui est no-op hors prod).
vi.mock("./brevo/contacts/enqueue-sync", () => ({ enqueueBrevoContactSync: vi.fn() }));
vi.mock("./brevo/events/enqueue-event", () => ({ enqueueBrevoEvent: vi.fn() }));
vi.mock("@/common/services/mailer/mailer");

useMongo();

const enqueueMock = vi.mocked(enqueueBrevoContactSync);
const eventMock = vi.mocked(enqueueBrevoEvent);

// Contexte administrateur : `type === "ADMINISTRATEUR"` court-circuite la vérification
// de rôle/organisation dans validateMembre/rejectMembre.
const adminCtx = () =>
  ({ _id: new ObjectId(), organisation_id: new ObjectId(), organisation: { type: "ADMINISTRATEUR" } }) as AuthContext;

const seedPendingMembre = async () => {
  const orga = buildOrgaOf();
  await organisationsDb().insertOne(testDoc<IOrganisation>(orga));
  const user = buildUser(orga, { account_status: "PENDING_ADMIN_VALIDATION" });
  await usersMigrationDb().insertOne(testDoc<IUsersMigration>(user));
  return user;
};

describe("organisations.actions — câblage de la synchro Brevo instantanée", () => {
  beforeEach(() => {
    enqueueMock.mockReset();
    eventMock.mockReset();
  });

  describe("validateMembre", () => {
    it("passe le compte à CONFIRMED et enfile la synchro Brevo du compte validé", async () => {
      const user = await seedPendingMembre();

      await validateMembre(adminCtx(), user._id.toString());

      const updated = await usersMigrationDb().findOne({ _id: user._id });
      expect(updated!.account_status).toBe("CONFIRMED");
      expect(enqueueMock).toHaveBeenCalledOnce();
      expect(String(enqueueMock.mock.calls[0][0])).toBe(String(user._id));
      expect(eventMock).toHaveBeenCalledWith("account-confirmed", { userId: user._id.toString() });
    });
  });

  describe("rejectMembre", () => {
    // Limite connue documentée : la synchro Brevo est un upsert pur (jamais de retrait),
    // donc le rejet supprime le compte SANS enfiler de synchro. Ce test verrouille ce
    // comportement — s'il casse un jour, c'est qu'on a (volontairement ou non) changé la
    // politique de nettoyage Brevo au rejet.
    it("supprime le compte sans enfiler de synchro Brevo", async () => {
      const user = await seedPendingMembre();

      await rejectMembre(adminCtx(), user._id.toString());

      const deleted = await usersMigrationDb().findOne({ _id: user._id });
      expect(deleted).toBeNull();
      expect(enqueueMock).not.toHaveBeenCalled();
      expect(eventMock).not.toHaveBeenCalled();
    });
  });
});

describe("getCfaAccountsByOrganismeIds", () => {
  it("réunit les comptes confirmés de toutes les organisations d'un même organisme", async () => {
    const organismeId = new ObjectId().toString();
    const orgaSansActivation = buildOrgaOf({ organisme_id: organismeId });
    const orgaActivee = buildOrgaOf({ organisme_id: organismeId, ml_beta_activated_at: NOW });
    await organisationsDb().insertMany(testDocs<IOrganisation>([orgaSansActivation, orgaActivee]));
    await usersMigrationDb().insertMany(
      testDocs<IUsersMigration>([
        buildUser(orgaSansActivation, { email: "alice@cfa.fr" }),
        buildUser(orgaActivee, { email: "bob@cfa.fr" }),
        buildUser(orgaActivee, { email: "refuse@cfa.fr", account_status: "PENDING_ADMIN_VALIDATION" }),
      ])
    );

    const accounts = await getCfaAccountsByOrganismeIds([organismeId]);

    const entry = accounts.get(organismeId);
    expect(entry?.destinataires.map((d) => d.email).sort()).toEqual(["alice@cfa.fr", "bob@cfa.fr"]);
    expect(entry?.ml_beta_activated_at).toEqual(NOW);
  });
});
