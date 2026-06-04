import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { vi, it, expect, describe, beforeEach } from "vitest";

import {
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { createActivationToken } from "@/common/utils/jwtUtils";
import { setTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const now = "2026-04-17T00:00:00.000Z";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

const SIRET = "41054102000070";
const UAI = "0332881D";

async function seedCfaOrganisation({
  organisationId,
  organismeId,
  departement = "33",
  nom = "CAMPUS DU LAC",
  commune = "Bordeaux",
  code_postal = "33300",
}: {
  organisationId: ObjectId;
  organismeId: ObjectId;
  departement?: string;
  nom?: string;
  commune?: string;
  code_postal?: string;
}) {
  await organismesDb().insertOne(
    generateOrganismeFixture({
      _id: organismeId,
      siret: SIRET,
      uai: UAI,
      nom,
      adresse: { departement, region: "75", academie: "04", commune, code_postal },
    })
  );
  await organisationsDb().insertOne({
    _id: organisationId,
    created_at: new Date(now),
    type: "ORGANISME_FORMATION",
    siret: SIRET,
    uai: UAI,
    organisme_id: organismeId.toString(),
  });
}

async function seedInvitation({
  token,
  organisationId,
  email = "test-cfa-user@tdb.local",
  role,
  expiresAt,
}: {
  token: string;
  organisationId: ObjectId;
  email?: string;
  role?: "admin" | "member";
  expiresAt?: Date | null;
}) {
  await invitationsDb().insertOne({
    _id: new ObjectId(),
    token,
    email,
    organisation_id: organisationId,
    author_id: new ObjectId(id(42)),
    created_at: new Date(now),
    ...(role ? { role } : {}),
    ...(expiresAt !== null ? { expires_at: expiresAt ?? new Date("2026-04-21T00:00:00.000Z") } : {}),
  });
}

describe("Inscription CFA (onboarding)", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    setTime(new Date(now));
    vi.mocked(sendEmail).mockClear();
  });

  describe("GET /api/v1/onboarding/cfa-info", () => {
    const organisationId = new ObjectId(id(1));
    const organismeId = new ObjectId(id(2));

    it("retourne les infos d'onboarding pour un token valide", async () => {
      await seedCfaOrganisation({ organisationId, organismeId });
      await organisationsDb().insertMany([
        {
          _id: new ObjectId(id(10)),
          created_at: new Date(now),
          type: "MISSION_LOCALE",
          nom: "du Libournais",
          ml_id: 1001,
          adresse: { departement: "33", code_postal: "33500", commune: "Arveyres" },
        } as any,
        {
          _id: new ObjectId(id(11)),
          created_at: new Date(now),
          type: "MISSION_LOCALE",
          nom: "Bordeaux Avenir Jeune",
          ml_id: 1002,
          adresse: { departement: "33", code_postal: "33000", commune: "Bordeaux" },
        } as any,
        {
          _id: new ObjectId(id(12)),
          created_at: new Date(now),
          type: "MISSION_LOCALE",
          nom: "Paris Centre",
          ml_id: 1003,
          adresse: { departement: "75", code_postal: "75001", commune: "Paris" },
        } as any,
      ]);
      await seedInvitation({ token: "valid-token-12345", organisationId, role: "admin" });

      const response = await httpClient.get("/api/v1/onboarding/cfa-info?token=valid-token-12345");

      expect(response.status).toBe(200);
      expect(response.data.email).toBe("test-cfa-user@tdb.local");
      expect(response.data.role).toBe("admin");
      expect(response.data.etablissement.nom).toBe("CAMPUS DU LAC");
      expect(response.data.etablissement.uai).toBe(UAI);
      expect(response.data.etablissement.siret).toBe(SIRET);
      expect(response.data.etablissement.departement).toBe("33");
      const mlNames = response.data.missionsLocales.map((ml: { nom: string }) => ml.nom).sort();
      expect(mlNames).toEqual(["Bordeaux Avenir Jeune", "du Libournais"]);
    });

    it("retourne 404 pour un token inconnu", async () => {
      const response = await httpClient.get("/api/v1/onboarding/cfa-info?token=inexistant-token");
      expect(response.status).toBe(404);
    });

    it("retourne 401 pour une invitation expirée", async () => {
      await seedCfaOrganisation({ organisationId, organismeId });
      await seedInvitation({
        token: "expired-token-12345",
        organisationId,
        expiresAt: new Date("2026-04-01T00:00:00.000Z"),
      });

      const response = await httpClient.get("/api/v1/onboarding/cfa-info?token=expired-token-12345");

      expect(response.status).toBe(401);
      expect(response.data.message).toMatch(/expiré/);
    });

    it("retourne 400 si l'invitation ne concerne pas un CFA", async () => {
      const mlOrgId = new ObjectId(id(3));
      await organisationsDb().insertOne({
        _id: mlOrgId,
        created_at: new Date(now),
        type: "MISSION_LOCALE",
        nom: "ML Test",
        ml_id: 2001,
      } as any);
      await seedInvitation({ token: "ml-token-12345", organisationId: mlOrgId });

      const response = await httpClient.get("/api/v1/onboarding/cfa-info?token=ml-token-12345");

      expect(response.status).toBe(400);
      expect(response.data.message).toMatch(/CFA/);
    });

    it("retourne 400 si le token est trop court", async () => {
      const response = await httpClient.get("/api/v1/onboarding/cfa-info?token=short");
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/auth/register-cfa", () => {
    const organisationId = new ObjectId(id(1));
    const organismeId = new ObjectId(id(2));
    const registrationBody = {
      nom: "TestNom",
      prenom: "TestPrenom",
      telephone: "0612345678",
      fonction: "Responsable pédagogique",
      password: "MDP-azerty123!",
      has_accept_cgu_version: "v1",
    };

    beforeEach(async () => {
      await seedCfaOrganisation({ organisationId, organismeId });
    });

    it("crée un compte PENDING_EMAIL_VALIDATION et archive l'invitation", async () => {
      await seedInvitation({ token: "register-token-12345", organisationId, role: "admin" });

      const response = await httpClient.post("/api/v1/auth/register-cfa", {
        token: "register-token-12345",
        ...registrationBody,
      });

      expect(response.status).toBe(200);
      expect(response.data.account_status).toBe("PENDING_EMAIL_VALIDATION");

      const user = await usersMigrationDb().findOne({ email: "test-cfa-user@tdb.local" });
      expect(user).toBeTruthy();
      expect(user?.account_status).toBe("PENDING_EMAIL_VALIDATION");
      expect(user?.organisation_role).toBe("admin");
      expect(user?.organisation_id.equals(organisationId)).toBe(true);
      expect(user?.nom).toBe("TestNom");
      expect(user?.prenom).toBe("TestPrenom");

      expect(await invitationsDb().findOne({ token: "register-token-12345" })).toBeNull();
      expect(await invitationsArchiveDb().findOne({ token: "register-token-12345" })).toBeTruthy();

      expect(sendEmail).toHaveBeenCalledWith(
        "test-cfa-user@tdb.local",
        "activation_cfa",
        expect.objectContaining({
          recipient: { nom: "TestNom", prenom: "TestPrenom" },
          isAdmin: true,
        })
      );
    });

    it("retourne 404 pour un token inconnu", async () => {
      const response = await httpClient.post("/api/v1/auth/register-cfa", {
        token: "does-not-exist-12345",
        ...registrationBody,
      });

      expect(response.status).toBe(404);
      expect(await usersMigrationDb().countDocuments({})).toBe(0);
    });

    it("retourne 401 pour une invitation expirée et laisse l'invitation en place", async () => {
      await seedInvitation({
        token: "expired-register-token-12345",
        organisationId,
        role: "admin",
        expiresAt: new Date("2026-04-01T00:00:00.000Z"),
      });

      const response = await httpClient.post("/api/v1/auth/register-cfa", {
        token: "expired-register-token-12345",
        ...registrationBody,
      });

      expect(response.status).toBe(401);
      expect(response.data.message).toMatch(/expiré/);
      expect(await invitationsDb().findOne({ token: "expired-register-token-12345" })).toBeTruthy();
      expect(await usersMigrationDb().countDocuments({})).toBe(0);
    });

    it("retourne 409 et préserve l'invitation si l'email existe déjà", async () => {
      await seedInvitation({ token: "conflict-token-12345", organisationId, role: "admin" });
      await usersMigrationDb().insertOne({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        created_at: new Date(now),
        email: "test-cfa-user@tdb.local",
        nom: "Existing",
        prenom: "User",
        password: testPasswordHash,
        organisation_id: new ObjectId(id(99)),
      } as any);

      const response = await httpClient.post("/api/v1/auth/register-cfa", {
        token: "conflict-token-12345",
        ...registrationBody,
      });

      expect(response.status).toBe(409);
      expect(response.data.message).toMatch(/déjà utilisé/);
      expect(await invitationsDb().findOne({ token: "conflict-token-12345" })).toBeTruthy();
    });

    it("retourne 400 si le mot de passe ne respecte pas les règles", async () => {
      await seedInvitation({ token: "weak-token-12345", organisationId, role: "admin" });

      const response = await httpClient.post("/api/v1/auth/register-cfa", {
        token: "weak-token-12345",
        ...registrationBody,
        password: "tooshort",
      });

      expect(response.status).toBe(400);
      expect(await invitationsDb().findOne({ token: "weak-token-12345" })).toBeTruthy();
      expect(await usersMigrationDb().countDocuments({})).toBe(0);
    });
  });

  describe("POST /api/v1/auth/register (CFA invitation guard)", () => {
    const organisationId = new ObjectId(id(1));
    const organismeId = new ObjectId(id(2));

    it("refuse l'inscription via register legacy quand une invitation CFA est en attente", async () => {
      await seedCfaOrganisation({ organisationId, organismeId });
      await seedInvitation({
        token: "pending-admin-invite-12345",
        organisationId,
        email: "test@test.fr",
        role: "admin",
      });

      const response = await httpClient.post("/api/v1/auth/register", {
        user: {
          email: "test@test.fr",
          civility: "Madame",
          nom: "Attaquant",
          prenom: "Mauvais",
          fonction: "x",
          telephone: "0600000000",
          password: "MDP-azerty123!",
          has_accept_cgu_version: "v1",
        },
        organisation: { type: "ORGANISME_FORMATION", siret: SIRET, uai: UAI },
      });

      expect(response.status).toBe(400);
      expect(await invitationsDb().findOne({ token: "pending-admin-invite-12345" })).toBeTruthy();
      expect(
        await usersMigrationDb().countDocuments({
          email: "test@test.fr",
          organisation_role: "admin",
        })
      ).toBe(0);
    });
  });

  describe("POST /api/v1/auth/activation (CFA branch)", () => {
    const organisationId = new ObjectId(id(1));
    const organismeId = new ObjectId(id(2));
    const userId = new ObjectId(id(3));

    async function seedCfaUser({ role }: { role?: "admin" | "member" }) {
      await seedCfaOrganisation({ organisationId, organismeId });
      await usersMigrationDb().insertOne({
        _id: userId,
        account_status: "PENDING_EMAIL_VALIDATION",
        created_at: new Date(now),
        email: "test-cfa-user@tdb.local",
        nom: "TestNom",
        prenom: "TestPrenom",
        password: testPasswordHash,
        password_updated_at: new Date(now),
        connection_history: [],
        emails: [],
        organisation_id: organisationId,
        ...(role ? { organisation_role: role } : {}),
      } as any);
    }

    it("passe un CFA avec organisation_role en CONFIRMED et envoie l'email de bienvenue", async () => {
      await seedCfaUser({ role: "admin" });

      const response = await httpClient.post("/api/v1/auth/activation", {
        activationToken: createActivationToken("test-cfa-user@tdb.local"),
      });

      expect(response.status).toBe(200);
      expect(response.data.account_status).toBe("CONFIRMED");

      const user = await usersMigrationDb().findOne({ _id: userId });
      expect(user?.account_status).toBe("CONFIRMED");
      expect(user?.confirmed_at).toBeInstanceOf(Date);

      expect(sendEmail).toHaveBeenCalledWith(
        "test-cfa-user@tdb.local",
        "confirmation_cfa",
        expect.objectContaining({
          recipient: { prenom: "TestPrenom" },
          cfaName: "CAMPUS DU LAC",
        })
      );
    });

    it("laisse un utilisateur sans organisation_role passer par la branche standard (PENDING_ADMIN_VALIDATION)", async () => {
      await seedCfaUser({});

      const response = await httpClient.post("/api/v1/auth/activation", {
        activationToken: createActivationToken("test-cfa-user@tdb.local"),
      });

      expect(response.status).toBe(200);
      expect(response.data.account_status).toBe("PENDING_ADMIN_VALIDATION");

      const user = await usersMigrationDb().findOne({ _id: userId });
      expect(user?.account_status).toBe("PENDING_ADMIN_VALIDATION");
      expect(sendEmail).not.toHaveBeenCalledWith(expect.anything(), "confirmation_cfa", expect.anything());
    });
  });
});
