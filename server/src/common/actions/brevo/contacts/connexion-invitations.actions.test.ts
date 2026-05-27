import { beforeEach, describe, expect, it, vi } from "vitest";

import { connexionInvitationsDb } from "@/common/model/collections";
import { useMongo } from "@tests/jest/setupMongo";

import { getConnexionInvitationByToken, getOrCreateConnexionInvitationByEmail } from "./connexion-invitations.actions";

useMongo();

const NOW = new Date("2026-05-20T10:00:00.000Z");

describe("connexion-invitations.actions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  describe("getOrCreateConnexionInvitationByEmail", () => {
    it("crée un nouveau token (random hex 100 chars) quand l'email n'existe pas en DB", async () => {
      const token = await getOrCreateConnexionInvitationByEmail({ email: "alice@example.fr", source: "cfa-users" });

      expect(token).toMatch(/^[a-f0-9]{100}$/);
      const doc = await connexionInvitationsDb().findOne({ email: "alice@example.fr" });
      expect(doc).toMatchObject({
        token,
        email: "alice@example.fr",
        source: "cfa-users",
      });
      expect(doc?.created_at).toEqual(NOW);
      expect(doc?.updated_at).toEqual(NOW);
    });

    it("idempotent : 2 appels successifs renvoient le MÊME token pour le même email", async () => {
      const first = await getOrCreateConnexionInvitationByEmail({ email: "bob@example.fr" });
      const second = await getOrCreateConnexionInvitationByEmail({ email: "bob@example.fr" });

      expect(first).toBe(second);
      expect(await connexionInvitationsDb().countDocuments({ email: "bob@example.fr" })).toBe(1);
    });

    it("emails distincts → tokens distincts", async () => {
      const a = await getOrCreateConnexionInvitationByEmail({ email: "a@example.fr" });
      const b = await getOrCreateConnexionInvitationByEmail({ email: "b@example.fr" });
      expect(a).not.toBe(b);
    });

    it("rafraîchit `updated_at` à chaque appel (sans toucher au token ni à `created_at`)", async () => {
      const token = await getOrCreateConnexionInvitationByEmail({ email: "carole@example.fr" });
      const after1 = await connexionInvitationsDb().findOne({ email: "carole@example.fr" });

      const LATER = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);
      vi.setSystemTime(LATER);

      const tokenAgain = await getOrCreateConnexionInvitationByEmail({ email: "carole@example.fr" });
      const after2 = await connexionInvitationsDb().findOne({ email: "carole@example.fr" });

      expect(tokenAgain).toBe(token);
      expect(after2?.created_at).toEqual(after1?.created_at);
      expect(after2?.updated_at).toEqual(LATER);
    });

    it("met à jour `source` à chaque appel si fourni", async () => {
      await getOrCreateConnexionInvitationByEmail({ email: "dora@example.fr", source: "cfa-users" });
      await getOrCreateConnexionInvitationByEmail({ email: "dora@example.fr", source: "ml-users" });

      const doc = await connexionInvitationsDb().findOne({ email: "dora@example.fr" });
      expect(doc?.source).toBe("ml-users");
    });
  });

  describe("getConnexionInvitationByToken", () => {
    it("retourne l'invitation correspondante quand le token existe", async () => {
      const token = await getOrCreateConnexionInvitationByEmail({ email: "eve@example.fr" });
      const found = await getConnexionInvitationByToken(token);
      expect(found?.email).toBe("eve@example.fr");
      expect(found?.token).toBe(token);
    });

    it("retourne null quand le token n'existe pas", async () => {
      const found = await getConnexionInvitationByToken("00".repeat(50));
      expect(found).toBeNull();
    });
  });
});
