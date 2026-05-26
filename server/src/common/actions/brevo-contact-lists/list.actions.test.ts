import { ObjectId } from "bson";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { brevoContactListDb } from "@/common/model/collections";
import { createBrevoList } from "@/common/services/brevo/brevo";
import { useMongo } from "@tests/jest/setupMongo";

import { getOrCreateContactList } from "./list.actions";

vi.mock("@/common/services/brevo/brevo", () => ({
  createBrevoList: vi.fn(),
}));

useMongo();

const createBrevoListMock = vi.mocked(createBrevoList);

const mockCreateOk = (id: number) =>
  createBrevoListMock.mockResolvedValueOnce({
    response: { statusCode: 201 } as any,
    body: { id } as any,
  } as any);

describe("getOrCreateContactList", () => {
  beforeEach(() => {
    createBrevoListMock.mockReset();
  });

  it("crée une liste via Brevo et persiste le mapping en DB si aucun existant", async () => {
    mockCreateOk(42);

    const listId = await getOrCreateContactList({
      slug: "cfa-users",
      name: "1305 - test CFA Users",
      folderId: 5,
    });

    expect(listId).toBe(42);
    expect(createBrevoListMock).toHaveBeenCalledOnce();
    expect(createBrevoListMock).toHaveBeenCalledWith({ name: "1305 - test CFA Users", folderId: 5 });

    const persisted = await brevoContactListDb().findOne({ slug: "cfa-users" });
    expect(persisted).toMatchObject({
      slug: "cfa-users",
      listId: 42,
      listName: "1305 - test CFA Users",
      folderId: 5,
    });
  });

  it("est idempotent : 2ᵉ appel renvoie le listId existant sans recréer côté Brevo", async () => {
    await brevoContactListDb().insertOne({
      _id: new ObjectId(),
      slug: "cfa-users",
      listId: 100,
      listName: "Existing list",
      folderId: 5,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const listId = await getOrCreateContactList({
      slug: "cfa-users",
      name: "Some other name",
      folderId: 5,
    });

    expect(listId).toBe(100);
    expect(createBrevoListMock).not.toHaveBeenCalled();

    const persisted = await brevoContactListDb().findOne({ slug: "cfa-users" });
    expect(persisted?.listName).toBe("Some other name");
  });

  it("throw si Brevo retourne un status non-201", async () => {
    createBrevoListMock.mockResolvedValueOnce({
      response: { statusCode: 500 } as any,
      body: {} as any,
    } as any);

    await expect(getOrCreateContactList({ slug: "cfa-users", name: "x", folderId: 5 })).rejects.toThrow(
      /Error creating Brevo list/
    );

    // Rien n'a été persisté en DB
    expect(await brevoContactListDb().countDocuments({})).toBe(0);
  });

  describe("avec listId imposé (liste Brevo existante)", () => {
    it("upsert le mapping DB sans appeler createBrevoList si listId fourni et pas de mapping existant", async () => {
      const listId = await getOrCreateContactList({
        slug: "tba-contacts",
        name: "tba_contacts_bdd_globale",
        folderId: 5,
        listId: 22,
      });

      expect(listId).toBe(22);
      expect(createBrevoListMock).not.toHaveBeenCalled();

      const persisted = await brevoContactListDb().findOne({ slug: "tba-contacts" });
      expect(persisted).toMatchObject({
        slug: "tba-contacts",
        listId: 22,
        listName: "tba_contacts_bdd_globale",
        folderId: 5,
      });
    });

    it("met à jour le listId du mapping existant si listId fourni a changé", async () => {
      await brevoContactListDb().insertOne({
        _id: new ObjectId(),
        slug: "tba-contacts",
        listId: 1, // ancien listId obsolète
        listName: "Existing list",
        folderId: 5,
        created_at: new Date(),
        updated_at: new Date(),
      });

      const listId = await getOrCreateContactList({
        slug: "tba-contacts",
        name: "tba_contacts_bdd_globale",
        folderId: 5,
        listId: 22,
      });

      expect(listId).toBe(22);
      expect(createBrevoListMock).not.toHaveBeenCalled();
      const persisted = await brevoContactListDb().findOne({ slug: "tba-contacts" });
      expect(persisted?.listId).toBe(22);
      expect(persisted?.listName).toBe("tba_contacts_bdd_globale");
    });
  });
});
