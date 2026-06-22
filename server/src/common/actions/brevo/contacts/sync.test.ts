import { beforeEach, describe, expect, it, vi } from "vitest";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { ensureBrevoAttributes, importContactsToBrevoList } from "@/common/services/brevo/brevo";
import { useMongo } from "@tests/jest/setupMongo";

import { buildOrganisme, buildOrgaOf, buildUser } from "./fixtures";
import { getOrCreateContactList } from "./list.actions";
import { syncSingleContact } from "./sync";

// On mocke uniquement les appels réseau Brevo : le pipeline `fetchContacts`
// tourne en vrai contre le mongo en mémoire (filtre `userIds` inclus).
vi.mock("@/common/services/brevo/brevo", () => ({
  ensureBrevoAttributes: vi.fn().mockResolvedValue({ created: [], skipped: [], conflicts: [], casingMismatches: [] }),
  importContactsToBrevoList: vi.fn().mockResolvedValue([{}]),
  serializeBrevoAttributes: vi.fn((a) => a),
}));
vi.mock("./list.actions", () => ({
  getOrCreateContactList: vi.fn().mockResolvedValue(999),
}));

useMongo();

const importMock = vi.mocked(importContactsToBrevoList);
const ensureMock = vi.mocked(ensureBrevoAttributes);
const getOrCreateMock = vi.mocked(getOrCreateContactList);

const seedCfa = async () => {
  const orgaOf = buildOrgaOf();
  await organisationsDb().insertOne(orgaOf as any);
  await organismesDb().insertOne(buildOrganisme(orgaOf) as any);
  return orgaOf;
};

describe("syncSingleContact", () => {
  beforeEach(() => {
    importMock.mockClear();
    ensureMock.mockClear();
    getOrCreateMock.mockClear();
  });

  it("ne synchronise QUE l'utilisateur ciblé vers la liste tba-contacts", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf);
    const u2 = buildUser(orgaOf);
    await usersMigrationDb().insertMany([u1 as any, u2 as any]);

    const result = await syncSingleContact(u1._id);

    expect(result.count).toBe(1);
    expect(importMock).toHaveBeenCalledOnce();
    const [listId, contacts] = importMock.mock.calls[0];
    expect(listId).toBe(999);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].email).toBe(u1.email.toLowerCase());
  });

  it("accepte un userId fourni sous forme de string", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf);
    await usersMigrationDb().insertOne(u1 as any);

    const result = await syncSingleContact(u1._id.toString());

    expect(result.count).toBe(1);
  });

  it("synchronise un compte PENDING (statut élargi)", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf, { account_status: "PENDING_EMAIL_VALIDATION" });
    await usersMigrationDb().insertOne(u1 as any);

    const result = await syncSingleContact(u1._id);

    expect(result.count).toBe(1);
    expect(importMock.mock.calls[0][1][0].attributes.STATUT_COMPTE_USER).toBe("PENDING_EMAIL_VALIDATION");
  });

  it("no-op si l'utilisateur est hors-périmètre (unsubscribe) : import d'un tableau vide", async () => {
    const orgaOf = await seedCfa();
    const u = buildUser(orgaOf, { unsubscribe: true });
    await usersMigrationDb().insertOne(u as any);

    const result = await syncSingleContact(u._id);

    expect(result.count).toBe(0);
    expect(importMock).toHaveBeenCalledWith(999, []);
  });
});
