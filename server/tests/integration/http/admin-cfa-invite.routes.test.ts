import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { vi, it, expect, describe, beforeEach } from "vitest";

import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { setTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, RequestAsOrganisationFunc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const now = "2026-04-20T00:00:00.000Z";

const SIRET = "41054102000070";
const UAI = "0332881D";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

async function seedOrganisme({
  organismeId,
  siret = SIRET,
  uai = UAI,
  nom = "CAMPUS DU LAC",
}: {
  organismeId: ObjectId;
  siret?: string;
  uai?: string;
  nom?: string;
}) {
  await organismesDb().insertOne(
    generateOrganismeFixture({
      _id: organismeId,
      siret,
      uai,
      nom,
      adresse: { departement: "33", region: "75", academie: "04", commune: "Bordeaux", code_postal: "33300" },
    })
  );
}

describe("Admin CFA invite routes", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
    setTime(new Date(now));
    vi.mocked(sendEmail).mockClear();
  });

  describe("POST /api/v1/admin/users/cfa/admin-invite", () => {
    it("crée l'invitation, l'organisation et envoie l'email (happy path)", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "test-cfa-user@tdb.local",
          siret: SIRET,
          uai: UAI,
          prenom: "TestPrenom",
          nom: "TestNom",
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.email).toBe("test-cfa-user@tdb.local");
      expect(response.data.organismeNom).toBe("CAMPUS DU LAC");
      expect(response.data.expiresAt).toBeDefined();
      expect(response.data.warning).toBeUndefined();

      const invitation = await invitationsDb().findOne({ email: "test-cfa-user@tdb.local" });
      expect(invitation).toMatchObject({
        role: "admin",
        prenom: "TestPrenom",
        nom: "TestNom",
      });
      expect(invitation?.expires_at).toBeInstanceOf(Date);

      expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
        "test-cfa-user@tdb.local",
        "invitation_cfa_admin",
        expect.objectContaining({ cfaName: "CAMPUS DU LAC", recipient: { prenom: "TestPrenom", nom: "TestNom" } })
      );
    });

    it("normalise l'email en minuscules", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "TEST-CFA-USER@TDB.LOCAL",
          siret: SIRET,
          uai: UAI,
          prenom: "S",
          nom: "A",
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.email).toBe("test-cfa-user@tdb.local");
    });

    it("rejette un SIRET invalide", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "x@y.fr",
          siret: "123",
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(400);
    });

    it("rejette une UAI = 'non déterminée'", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "x@y.fr",
          siret: SIRET,
          uai: "non déterminée",
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(400);
    });

    it("rejette si prenom ou nom vide", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "x@y.fr",
          siret: SIRET,
          prenom: "",
          nom: "N",
        }
      );
      expect(response.status).toBe(400);
    });

    it("renvoie 404 si organisme introuvable", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "x@y.fr",
          siret: "99999999999999",
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(404);
    });

    it("renvoie 409 si un utilisateur existe déjà (case-insensitive)", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const otherOrgId = new ObjectId(id(50));
      await organisationsDb().insertOne({
        _id: otherOrgId,
        created_at: new Date(now),
        type: "ORGANISME_FORMATION",
        siret: "99999999999999",
        uai: "9999999A",
      } as any);
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        email: "Existing.User@Cfa.fr",
        password: testPasswordHash,
        nom: "N",
        prenom: "P",
        organisation_id: otherOrgId,
        created_at: new Date(),
        password_updated_at: new Date(),
        connection_history: [],
        emails: [],
      } as any);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "existing.user@cfa.fr",
          siret: SIRET,
          uai: UAI,
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(409);
    });

    it("renvoie 409 si une invitation existe déjà", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/users/cfa/admin-invite", {
        email: "dup@cfa.fr",
        siret: SIRET,
        uai: UAI,
        prenom: "P",
        nom: "N",
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "dup@cfa.fr",
          siret: SIRET,
          uai: UAI,
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(409);
      expect(response.data.message).toContain("déjà en cours");
    });

    it("retourne un warning si l'organisation a déjà un admin", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/users/cfa/admin-invite", {
        email: "admin1@cfa.fr",
        siret: SIRET,
        uai: UAI,
        prenom: "P",
        nom: "N",
      });

      const organisation = await organisationsDb().findOne({ siret: SIRET, uai: UAI });
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        email: "prior-admin@cfa.fr",
        password: testPasswordHash,
        nom: "N",
        prenom: "P",
        organisation_id: organisation!._id,
        organisation_role: "admin",
        created_at: new Date(),
        password_updated_at: new Date(),
        connection_history: [],
        emails: [],
      } as any);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "admin2@cfa.fr",
          siret: SIRET,
          uai: UAI,
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.warning).toMatch(/administrateur/);
    });

    it("retourne un warning si l'organisation a des membres mais aucun admin", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/users/cfa/admin-invite", {
        email: "bootstrap@cfa.fr",
        siret: SIRET,
        uai: UAI,
        prenom: "P",
        nom: "N",
      });

      const organisation = await organisationsDb().findOne({ siret: SIRET, uai: UAI });
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        email: "member@cfa.fr",
        password: testPasswordHash,
        nom: "N",
        prenom: "P",
        organisation_id: organisation!._id,
        created_at: new Date(),
        password_updated_at: new Date(),
        connection_history: [],
        emails: [],
      } as any);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        {
          email: "newadmin@cfa.fr",
          siret: SIRET,
          uai: UAI,
          prenom: "P",
          nom: "N",
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.warning).toMatch(/membre/);
    });

    it("refuse l'accès à un non-admin plateforme", async () => {
      const response = await requestAsOrganisation(
        { type: "ORGANISME_FORMATION", siret: SIRET, uai: UAI } as any,
        "post",
        "/api/v1/admin/users/cfa/admin-invite",
        { email: "x@y.fr", siret: SIRET, prenom: "P", nom: "N" }
      );
      expect(response.status).toBe(403);
    });

    it("refuse l'accès sans authentification", async () => {
      const response = await httpClient.post("/api/v1/admin/users/cfa/admin-invite", {
        email: "x@y.fr",
        siret: SIRET,
        prenom: "P",
        nom: "N",
      });
      expect([401, 403]).toContain(response.status);
    });
  });

  describe("POST /api/v1/admin/users/cfa/admin-invite/resend", () => {
    it("renvoie l'email et rafraîchit expires_at", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      await requestAsOrganisation({ type: "ADMINISTRATEUR" }, "post", "/api/v1/admin/users/cfa/admin-invite", {
        email: "resend@cfa.fr",
        siret: SIRET,
        uai: UAI,
        prenom: "R",
        nom: "N",
      });
      vi.mocked(sendEmail).mockClear();
      const before = await invitationsDb().findOne({ email: "resend@cfa.fr" });

      setTime(new Date("2026-04-21T00:00:00.000Z"));

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite/resend",
        {
          email: "resend@cfa.fr",
          siret: SIRET,
          uai: UAI,
        }
      );
      expect(response.status).toBe(200);
      expect(response.data.email).toBe("resend@cfa.fr");

      const after = await invitationsDb().findOne({ email: "resend@cfa.fr" });
      expect(after?.expires_at?.getTime()).toBeGreaterThan(before!.expires_at!.getTime());
      expect(vi.mocked(sendEmail)).toHaveBeenCalledWith("resend@cfa.fr", "invitation_cfa_admin", expect.any(Object));
    });

    it("renvoie 404 si aucune invitation", async () => {
      const organismeId = new ObjectId(id(2));
      await seedOrganisme({ organismeId });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        "/api/v1/admin/users/cfa/admin-invite/resend",
        {
          email: "nope@cfa.fr",
          siret: SIRET,
          uai: UAI,
        }
      );
      expect(response.status).toBe(404);
    });
  });
});
