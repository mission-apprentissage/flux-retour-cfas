import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IOrganisme } from "shared/models/data/organismes.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { ensureBrevoAttributes, importContactsToBrevoList } from "@/common/services/brevo/brevo";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc, testDocs } from "@tests/utils/testUtils";

import { buildOrganisme, buildOrgaMl, buildOrgaOf, buildUser } from "./fixtures";
import { getOrCreateContactList } from "./list.actions";
import { syncSingleContact, syncSingleOrganisationContact } from "./sync";
import { isBrevoInstantSyncActive, isBrevoMlGenericContactsActive } from "./sync-settings.actions";

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
// Garde prod-only : active par défaut ici (config.env vaut "test" sinon → syncSingleContact no-op).
// `isBrevoMlGenericContactsActive` est à false par défaut : les tests ci-dessous
// vérifient d'abord que la source users est strictement inchangée.
vi.mock("./sync-settings.actions", () => ({
  isBrevoInstantSyncActive: vi.fn().mockResolvedValue(true),
  isBrevoMlGenericContactsActive: vi.fn().mockResolvedValue(false),
}));

useMongo();

const importMock = vi.mocked(importContactsToBrevoList);
const ensureMock = vi.mocked(ensureBrevoAttributes);
const getOrCreateMock = vi.mocked(getOrCreateContactList);
const isActiveMock = vi.mocked(isBrevoInstantSyncActive);
const isMlGenericActiveMock = vi.mocked(isBrevoMlGenericContactsActive);

const seedCfa = async () => {
  const orgaOf = buildOrgaOf();
  await organisationsDb().insertOne(testDoc<IOrganisation>(orgaOf));
  await organismesDb().insertOne(testDoc<IOrganisme>(buildOrganisme(orgaOf)));
  return orgaOf;
};

describe("syncSingleContact", () => {
  beforeEach(() => {
    importMock.mockClear();
    ensureMock.mockClear();
    getOrCreateMock.mockClear();
    isActiveMock.mockReset();
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockReset();
    isMlGenericActiveMock.mockResolvedValue(false);
  });

  it("ne synchronise QUE l'utilisateur ciblé vers la liste tba-contacts", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf);
    const u2 = buildUser(orgaOf);
    await usersMigrationDb().insertMany([testDoc<IUsersMigration>(u1), testDoc<IUsersMigration>(u2)]);

    const result = await syncSingleContact(u1._id);

    expect(result?.count).toBe(1);
    expect(importMock).toHaveBeenCalledOnce();
    const [listId, contacts] = importMock.mock.calls[0];
    expect(listId).toBe(999);
    expect(contacts).toHaveLength(1);
    expect(contacts[0].email).toBe(u1.email.toLowerCase());
  });

  it("accepte un userId fourni sous forme de string", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(u1));

    const result = await syncSingleContact(u1._id.toString());

    expect(result?.count).toBe(1);
  });

  it("synchronise un compte PENDING (statut élargi)", async () => {
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf, { account_status: "PENDING_EMAIL_VALIDATION" });
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(u1));

    const result = await syncSingleContact(u1._id);

    expect(result?.count).toBe(1);
    expect(importMock.mock.calls[0][1][0].attributes.STATUT_COMPTE_USER).toBe("PENDING_EMAIL_VALIDATION");
  });

  it("no-op si l'utilisateur est hors-périmètre (unsubscribe) : import d'un tableau vide", async () => {
    const orgaOf = await seedCfa();
    const u = buildUser(orgaOf, { unsubscribe: true });
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(u));

    const result = await syncSingleContact(u._id);

    expect(result?.count).toBe(0);
    expect(importMock).toHaveBeenCalledWith(999, []);
  });

  it("no-op prod-only : ne synchronise rien si la synchro instantanée est inactive / hors production", async () => {
    isActiveMock.mockResolvedValue(false);
    const orgaOf = await seedCfa();
    const u = buildUser(orgaOf);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(u));

    const result = await syncSingleContact(u._id);

    expect(result).toBeUndefined();
    expect(importMock).not.toHaveBeenCalled();
  });

  // Non-régression : le filtre `userIds` ne doit pas laisser passer les contacts
  // génériques ML, sinon une synchro unitaire réimporterait toutes les ML.
  it("reste strictement unitaire même quand les contacts génériques ML sont actifs", async () => {
    isMlGenericActiveMock.mockResolvedValue(true);
    await organisationsDb().insertOne(
      testDoc<IOrganisation>(buildOrgaMl("ML Nantes", { email: "contact@ml-nantes.fr" }))
    );
    const orgaOf = await seedCfa();
    const u1 = buildUser(orgaOf);
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(u1));

    const result = await syncSingleContact(u1._id);

    expect(result?.count).toBe(1);
    expect(importMock.mock.calls[0][1][0].email).toBe(u1.email.toLowerCase());
  });
});

describe("syncSingleOrganisationContact", () => {
  beforeEach(() => {
    importMock.mockClear();
    ensureMock.mockClear();
    getOrCreateMock.mockClear();
    isActiveMock.mockReset();
    isActiveMock.mockResolvedValue(true);
    isMlGenericActiveMock.mockReset();
    isMlGenericActiveMock.mockResolvedValue(true);
  });

  it("ne synchronise que le contact générique de la ML ciblée, sans les comptes utilisateurs", async () => {
    const ml = buildOrgaMl("ML Nantes", { email: "contact@ml-nantes.fr", activated_at: new Date() });
    const autreMl = buildOrgaMl("ML Rennes", { email: "contact@ml-rennes.fr" });
    await organisationsDb().insertMany(testDocs<IOrganisation>([ml, autreMl]));
    const orgaOf = await seedCfa();
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(buildUser(orgaOf)));

    const result = await syncSingleOrganisationContact(ml._id);

    expect(result?.count).toBe(1);
    const [, contacts] = importMock.mock.calls[0];
    expect(contacts[0].email).toBe("contact@ml-nantes.fr");
    expect(contacts[0].attributes.ML_ADRESSE_GENERIQUE).toBe(true);
    expect(contacts[0].attributes.STATUT_COMPTE_USER).toBe("CONFIRMED");
  });

  // Le chemin unitaire ne charge aucun user : sans exclusion en amont des
  // collisions, il écraserait le contact du compte, qui se retrouverait marqué
  // `ML_ADRESSE_GENERIQUE` et privé de ses données nominatives.
  it("n'écrase pas le contact d'un compte portant l'adresse générique de sa ML", async () => {
    const ml = buildOrgaMl("ML LYON", { email: "Contact@ML-Lyon.fr", activated_at: new Date() });
    await organisationsDb().insertOne(testDoc<IOrganisation>(ml));
    await usersMigrationDb().insertOne(testDoc<IUsersMigration>(buildUser(ml, { email: "contact@ml-lyon.fr" })));

    const result = await syncSingleOrganisationContact(ml._id);

    expect(result?.count).toBe(0);
    expect(importMock).toHaveBeenCalledWith(999, []);
  });

  it("no-op si les contacts génériques ML sont désactivés", async () => {
    isMlGenericActiveMock.mockResolvedValue(false);
    const ml = buildOrgaMl("ML Nantes", { email: "contact@ml-nantes.fr" });
    await organisationsDb().insertOne(testDoc<IOrganisation>(ml));

    const result = await syncSingleOrganisationContact(ml._id);

    expect(result).toBeUndefined();
    expect(importMock).not.toHaveBeenCalled();
  });
});
