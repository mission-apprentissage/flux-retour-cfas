import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import type { IInvitation } from "shared/models/data/invitations.model";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { vi, it, expect, describe, beforeEach } from "vitest";

import { createSession } from "@/common/actions/sessions.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { createActivationToken } from "@/common/utils/jwtUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, Method, testDoc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");
vi.mock("@/common/services/brevo/brevo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/brevo")>()),
  sendTransactionalEmail: vi.fn(),
}));

const SIRET = "41054102000070";
const UAI = "0332881D";

const cfaOrganisationId = new ObjectId(id(1));
const cfaOrganismeId = new ObjectId(id(2));
const dreetsOrganisationId = new ObjectId(id(3));
const tbaOrganisationId = new ObjectId(id(4));
const ddetsRegionOrganisationId = new ObjectId(id(5));
const ddetsAutreRegionOrganisationId = new ObjectId(id(6));
const draafOrganisationId = new ObjectId(id(7));

const ADMIN_CFA = "admin@cfa.local";
const MEMBRE_CFA = "membre@cfa.local";
const SANS_ROLE_CFA = "sans-role@cfa.local";
const ADMIN_TBA = "admin@tba.local";
const AGENT_DREETS = "agent@dreets.local";
const ADMIN_DREETS = "admin@dreets.local";
const ADMIN_DDETS = "admin@ddets.local";
const AGENT_DRAAF = "agent@draaf.local";

let httpClient: AxiosInstance;

async function insererUtilisateur(
  organisationId: ObjectId,
  account_status: IUsersMigration["account_status"],
  organisation_role?: "admin" | "member",
  email = `${new ObjectId()}@cible.local`
): Promise<ObjectId> {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne(
    testDoc<IUsersMigration>({
      _id,
      account_status,
      created_at: new Date(),
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      email,
      nom: "Martin",
      prenom: "Camille",
      fonction: "Chargée de relations entreprises",
      password: testPasswordHash,
      organisation_id: organisationId,
      ...(organisation_role ? { organisation_role } : {}),
      has_accept_cgu_version: "v1",
    })
  );
  return _id;
}

async function insererInvitation(organisationId: ObjectId): Promise<ObjectId> {
  const _id = new ObjectId();
  await invitationsDb().insertOne(
    testDoc<IInvitation>({
      _id,
      organisation_id: organisationId,
      email: `${_id}@invite.local`,
      token: `jeton-${_id}`,
      author_id: new ObjectId(),
      role: "member",
      created_at: new Date(),
      expires_at: new Date(Date.now() + 96 * 60 * 60 * 1000),
    })
  );
  return _id;
}

async function cookieDe(email: string): Promise<string> {
  return `${COOKIE_NAME}=${await createSession(email)}`;
}

async function cookieImpostureCfa(): Promise<string> {
  const response = await httpClient.post(
    "/api/v1/admin/impersonate",
    { type: "ORGANISME_FORMATION", siret: SIRET, uai: UAI },
    { headers: { cookie: await cookieDe(ADMIN_TBA) } }
  );
  expect(response.status).toBe(200);
  return response.headers["set-cookie"]![0];
}

async function cookieImpostureDreets(): Promise<string> {
  const response = await httpClient.post(
    "/api/v1/admin/impersonate",
    { type: "DREETS", code_region: "75" },
    { headers: { cookie: await cookieDe(ADMIN_TBA) } }
  );
  expect(response.status).toBe(200);
  return response.headers["set-cookie"]![0];
}

async function cookieImpostureLectureSeuleCfa(): Promise<string> {
  const response = await httpClient.post(
    "/api/v1/organisation/indicateurs-ml/impersonate",
    { cfa_id: cfaOrganismeId.toString() },
    { headers: { cookie: await cookieDe(AGENT_DREETS) } }
  );
  expect(response.status).toBe(200);
  return response.headers["set-cookie"]![0];
}

type Cible = { method: Method; url: string; data?: unknown; effetApplique: () => Promise<boolean> };

const routes: Array<{
  libelle: string;
  avecAdministrateursSeulement?: boolean;
  membreDuService?: boolean;
  preparer: (orgId: ObjectId) => Promise<Cible>;
}> = [
  {
    libelle: "DELETE /api/v1/organisation/membres/:userId",
    membreDuService: true,
    preparer: async (orgId) => {
      const userId = await insererUtilisateur(orgId, "CONFIRMED", "member");
      return {
        method: "delete",
        url: `/api/v1/organisation/membres/${userId}`,
        effetApplique: async () => (await usersMigrationDb().findOne({ _id: userId })) === null,
      };
    },
  },
  {
    libelle: "POST /api/v1/organisation/membres/:userId/validate",
    membreDuService: true,
    preparer: async (orgId) => {
      const userId = await insererUtilisateur(orgId, "PENDING_ADMIN_VALIDATION");
      return {
        method: "post",
        url: `/api/v1/organisation/membres/${userId}/validate`,
        effetApplique: async () => (await usersMigrationDb().findOne({ _id: userId }))?.account_status === "CONFIRMED",
      };
    },
  },
  {
    libelle: "POST /api/v1/organisation/membres/:userId/reject",
    membreDuService: true,
    preparer: async (orgId) => {
      const userId = await insererUtilisateur(orgId, "PENDING_ADMIN_VALIDATION");
      return {
        method: "post",
        url: `/api/v1/organisation/membres/${userId}/reject`,
        effetApplique: async () => (await usersMigrationDb().findOne({ _id: userId })) === null,
      };
    },
  },
  {
    libelle: "PUT /api/v1/organisation/membres/:userId/role",
    avecAdministrateursSeulement: true,
    membreDuService: true,
    preparer: async (orgId) => {
      const userId = await insererUtilisateur(orgId, "CONFIRMED", "member");
      return {
        method: "put",
        url: `/api/v1/organisation/membres/${userId}/role`,
        data: { role: "admin" },
        effetApplique: async () => (await usersMigrationDb().findOne({ _id: userId }))?.organisation_role === "admin",
      };
    },
  },
  {
    libelle: "DELETE /api/v1/organisation/invitations/:invitationId",
    preparer: async (orgId) => {
      const invitationId = await insererInvitation(orgId);
      return {
        method: "delete",
        url: `/api/v1/organisation/invitations/${invitationId}`,
        effetApplique: async () => (await invitationsDb().findOne({ _id: invitationId })) === null,
      };
    },
  },
  {
    libelle: "POST /api/v1/organisation/invitations/:invitationId/resend",
    preparer: async (orgId) => {
      const invitationId = await insererInvitation(orgId);
      return {
        method: "post",
        url: `/api/v1/organisation/invitations/${invitationId}/resend`,
        effetApplique: async () =>
          (await invitationsDb().findOne({ _id: invitationId }))?.token !== `jeton-${invitationId}`,
      };
    },
  },
];

async function appeler(cible: Cible, cookie: string) {
  return httpClient.request({ method: cible.method, url: cible.url, data: cible.data, headers: { cookie } });
}

describe("Gestion de l'équipe d'une organisation", () => {
  useMongo();

  beforeEach(async () => {
    httpClient = (await initTestApp()).httpClient;
    vi.mocked(sendTransactionalEmail)
      .mockReset()
      .mockResolvedValue({ messageId: "message" } as never);

    await organismesDb().insertOne(
      generateOrganismeFixture({
        _id: cfaOrganismeId,
        siret: SIRET,
        uai: UAI,
        nom: "CAMPUS DU LAC",
        adresse: { departement: "33", region: "75", academie: "04", commune: "Bordeaux", code_postal: "33300" },
      })
    );
    await organisationsDb().insertMany([
      testDoc<IOrganisation>({
        _id: cfaOrganisationId,
        created_at: new Date(),
        type: "ORGANISME_FORMATION",
        siret: SIRET,
        uai: UAI,
        organisme_id: cfaOrganismeId.toString(),
      }),
      testDoc<IOrganisation>({ _id: dreetsOrganisationId, created_at: new Date(), type: "DREETS", code_region: "75" }),
      testDoc<IOrganisation>({ _id: tbaOrganisationId, created_at: new Date(), type: "ADMINISTRATEUR" }),
      testDoc<IOrganisation>({
        _id: ddetsRegionOrganisationId,
        created_at: new Date(),
        type: "DDETS",
        code_departement: "33",
      }),
      testDoc<IOrganisation>({
        _id: ddetsAutreRegionOrganisationId,
        created_at: new Date(),
        type: "DDETS",
        code_departement: "92",
      }),
      testDoc<IOrganisation>({ _id: draafOrganisationId, created_at: new Date(), type: "DRAAF", code_region: "75" }),
    ]);

    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", "admin", ADMIN_CFA);
    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", "member", MEMBRE_CFA);
    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", undefined, SANS_ROLE_CFA);
    await insererUtilisateur(tbaOrganisationId, "CONFIRMED", undefined, ADMIN_TBA);
    await insererUtilisateur(dreetsOrganisationId, "CONFIRMED", undefined, AGENT_DREETS);
    await insererUtilisateur(dreetsOrganisationId, "CONFIRMED", "admin", ADMIN_DREETS);
    await insererUtilisateur(ddetsRegionOrganisationId, "CONFIRMED", "admin", ADMIN_DDETS);
    await insererUtilisateur(draafOrganisationId, "CONFIRMED", undefined, AGENT_DRAAF);
  });

  describe.each(routes)("$libelle", ({ avecAdministrateursSeulement, membreDuService, preparer }) => {
    it("est autorisée à un administrateur du CFA", async () => {
      const cible = await preparer(cfaOrganisationId);
      const response = await appeler(cible, await cookieDe(ADMIN_CFA));
      expect(response.status).toBe(200);
      expect(await cible.effetApplique()).toBe(true);
    });

    it("est refusée à un membre du CFA", async () => {
      const cible = await preparer(cfaOrganisationId);
      const response = await appeler(cible, await cookieDe(MEMBRE_CFA));
      expect(response.status).toBe(403);
      expect(await cible.effetApplique()).toBe(false);
    });

    it("est refusée à un compte du CFA sans rôle", async () => {
      const cible = await preparer(cfaOrganisationId);
      const response = await appeler(cible, await cookieDe(SANS_ROLE_CFA));
      expect(response.status).toBe(403);
      expect(await cible.effetApplique()).toBe(false);
    });

    it("est autorisée à un administrateur TBA en imposture du CFA", async () => {
      const cible = await preparer(cfaOrganisationId);
      const response = await appeler(cible, await cookieImpostureCfa());
      expect(response.status).toBe(200);
      expect(await cible.effetApplique()).toBe(true);
    });

    it("est refusée pendant une imposture en lecture seule du CFA", async () => {
      const cible = await preparer(cfaOrganisationId);
      const response = await appeler(cible, await cookieImpostureLectureSeuleCfa());
      expect(response.status).toBe(403);
      expect(await cible.effetApplique()).toBe(false);
    });

    it("est autorisée à un administrateur de la DREETS", async () => {
      const cible = await preparer(dreetsOrganisationId);
      const response = await appeler(cible, await cookieDe(ADMIN_DREETS));
      expect(response.status).toBe(200);
      expect(await cible.effetApplique()).toBe(true);
    });

    it("est refusée à un agent de la DREETS sans rôle admin", async () => {
      const cible = await preparer(dreetsOrganisationId);
      const response = await appeler(cible, await cookieDe(AGENT_DREETS));
      expect(response.status).toBe(403);
      expect(await cible.effetApplique()).toBe(false);
    });

    it("est autorisée à un administrateur TBA en imposture de la DREETS", async () => {
      const cible = await preparer(dreetsOrganisationId);
      const response = await appeler(cible, await cookieImpostureDreets());
      expect(response.status).toBe(200);
      expect(await cible.effetApplique()).toBe(true);
    });

    it("est autorisée à un administrateur de la DDETS", async () => {
      const cible = await preparer(ddetsRegionOrganisationId);
      const response = await appeler(cible, await cookieDe(ADMIN_DDETS));
      expect(response.status).toBe(200);
      expect(await cible.effetApplique()).toBe(true);
    });

    if (membreDuService) {
      it("est autorisée à un administrateur de la DREETS sur une DDETS de sa région", async () => {
        const cible = await preparer(ddetsRegionOrganisationId);
        const response = await appeler(cible, await cookieDe(ADMIN_DREETS));
        expect(response.status).toBe(200);
        expect(await cible.effetApplique()).toBe(true);
      });

      it("est autorisée à un administrateur TBA en imposture de la DREETS sur une DDETS de sa région", async () => {
        const cible = await preparer(ddetsRegionOrganisationId);
        const response = await appeler(cible, await cookieImpostureDreets());
        expect(response.status).toBe(200);
        expect(await cible.effetApplique()).toBe(true);
      });

      it("est refusée à un administrateur de la DREETS sur une DDETS d'une autre région", async () => {
        const cible = await preparer(ddetsAutreRegionOrganisationId);
        const response = await appeler(cible, await cookieDe(ADMIN_DREETS));
        expect([403, 404]).toContain(response.status);
        expect(await cible.effetApplique()).toBe(false);
      });

      it("est refusée à un administrateur de la DDETS sur la DREETS", async () => {
        const cible = await preparer(dreetsOrganisationId);
        const response = await appeler(cible, await cookieDe(ADMIN_DDETS));
        expect([403, 404]).toContain(response.status);
        expect(await cible.effetApplique()).toBe(false);
      });
    }

    if (!avecAdministrateursSeulement) {
      it("reste ouverte aux utilisateurs d'une organisation sans administrateurs", async () => {
        const cible = await preparer(draafOrganisationId);
        const response = await appeler(cible, await cookieDe(AGENT_DRAAF));
        expect(response.status).toBe(200);
        expect(await cible.effetApplique()).toBe(true);
      });
    } else {
      it("est refusée aux utilisateurs d'une organisation sans administrateurs", async () => {
        const cible = await preparer(draafOrganisationId);
        const response = await appeler(cible, await cookieDe(AGENT_DRAAF));
        expect(response.status).toBe(400);
        expect(await cible.effetApplique()).toBe(false);
      });
    }
  });

  describe("GET /api/v1/organisation/membres", () => {
    it("liste pour la DREETS ses agents et ceux des DDETS de sa région, avec leur service", async () => {
      await insererUtilisateur(
        ddetsAutreRegionOrganisationId,
        "PENDING_ADMIN_VALIDATION",
        undefined,
        "hors@ddets.local"
      );
      await insererUtilisateur(ddetsRegionOrganisationId, "PENDING_ADMIN_VALIDATION", undefined, "attente@ddets.local");

      const response = await httpClient.get("/api/v1/organisation/membres", {
        headers: { cookie: await cookieDe(ADMIN_DREETS) },
      });

      expect(response.status).toBe(200);
      const services = Object.fromEntries(
        response.data.map((membre: { email: string; service?: string }) => [membre.email, membre.service])
      );
      expect(services).toEqual({
        [AGENT_DREETS]: "DREETS",
        [ADMIN_DREETS]: "DREETS",
        [ADMIN_DDETS]: "DDETS Gironde (33)",
        "attente@ddets.local": "DDETS Gironde (33)",
      });
    });

    it("ne liste pas les DDETS de la région pour un agent DREETS sans rôle admin", async () => {
      const response = await httpClient.get("/api/v1/organisation/membres", {
        headers: { cookie: await cookieDe(AGENT_DREETS) },
      });

      expect(response.status).toBe(200);
      expect(response.data.map((membre: { email: string }) => membre.email).sort()).toEqual(
        [ADMIN_DREETS, AGENT_DREETS].sort()
      );
      expect(response.data.every((membre: { service?: string }) => membre.service === undefined)).toBe(true);
    });

    it("ne liste pour la DDETS que ses propres agents", async () => {
      const response = await httpClient.get("/api/v1/organisation/membres", {
        headers: { cookie: await cookieDe(ADMIN_DDETS) },
      });

      expect(response.status).toBe(200);
      expect(response.data.map((membre: { email: string }) => membre.email)).toEqual([ADMIN_DDETS]);
      expect(response.data[0].service).toBeUndefined();
    });
  });

  describe("PUT /api/v1/admin/users/:id/role", () => {
    it("permet à l'équipe TBA de nommer un administrateur de DREETS", async () => {
      const agent = await usersMigrationDb().findOne({ email: AGENT_DREETS });
      const response = await httpClient.put(
        `/api/v1/admin/users/${agent!._id}/role`,
        { role: "admin" },
        { headers: { cookie: await cookieDe(ADMIN_TBA) } }
      );
      expect(response.status).toBe(200);
      expect((await usersMigrationDb().findOne({ _id: agent!._id }))?.organisation_role).toBe("admin");
    });

    it("est refusé pour un compte DREETS qui n'a pas validé son courriel", async () => {
      const agentId = await insererUtilisateur(dreetsOrganisationId, "PENDING_EMAIL_VALIDATION");
      const response = await httpClient.put(
        `/api/v1/admin/users/${agentId}/role`,
        { role: "admin" },
        { headers: { cookie: await cookieDe(ADMIN_TBA) } }
      );
      expect(response.status).toBe(400);
      expect((await usersMigrationDb().findOne({ _id: agentId }))?.organisation_role).toBeUndefined();
    });

    it("reste refusé pour une organisation sans administrateurs", async () => {
      const agent = await usersMigrationDb().findOne({ email: AGENT_DRAAF });
      const response = await httpClient.put(
        `/api/v1/admin/users/${agent!._id}/role`,
        { role: "admin" },
        { headers: { cookie: await cookieDe(ADMIN_TBA) } }
      );
      expect(response.status).toBe(400);
      expect((await usersMigrationDb().findOne({ _id: agent!._id }))?.organisation_role).toBeUndefined();
    });
  });

  describe("Changement de rôle d'un compte qui n'a pas validé son courriel", () => {
    it("est refusé à un administrateur de la DREETS", async () => {
      const agentId = await insererUtilisateur(ddetsRegionOrganisationId, "PENDING_EMAIL_VALIDATION");
      const response = await httpClient.put(
        `/api/v1/organisation/membres/${agentId}/role`,
        { role: "admin" },
        { headers: { cookie: await cookieDe(ADMIN_DREETS) } }
      );
      expect(response.status).toBe(400);
      expect((await usersMigrationDb().findOne({ _id: agentId }))?.organisation_role).toBeUndefined();
    });
  });

  describe("Dernier administrateur", () => {
    const idDe = async (email: string) => (await usersMigrationDb().findOne({ email }))!._id;

    it("peut être retiré d'une DDETS par un administrateur de la DREETS", async () => {
      const id = await idDe(ADMIN_DDETS);
      const response = await httpClient.delete(`/api/v1/organisation/membres/${id}`, {
        headers: { cookie: await cookieDe(ADMIN_DREETS) },
      });
      expect(response.status).toBe(200);
      expect(await usersMigrationDb().findOne({ _id: id })).toBeNull();
    });

    it("peut être rétrogradé dans une DDETS par un administrateur de la DREETS", async () => {
      const id = await idDe(ADMIN_DDETS);
      const response = await httpClient.put(
        `/api/v1/organisation/membres/${id}/role`,
        { role: "member" },
        { headers: { cookie: await cookieDe(ADMIN_DREETS) } }
      );
      expect(response.status).toBe(200);
      expect((await usersMigrationDb().findOne({ _id: id }))?.organisation_role).toBe("member");
    });

    it("ne peut pas se retirer lui-même de sa propre organisation", async () => {
      const id = await idDe(ADMIN_DREETS);
      const response = await httpClient.delete(`/api/v1/organisation/membres/${id}`, {
        headers: { cookie: await cookieDe(ADMIN_DREETS) },
      });
      expect(response.status).toBe(400);
      expect(await usersMigrationDb().findOne({ _id: id })).not.toBeNull();
    });

    it("peut être retiré par un administrateur TBA en imposture", async () => {
      const id = await idDe(ADMIN_DREETS);
      const response = await httpClient.delete(`/api/v1/organisation/membres/${id}`, {
        headers: { cookie: await cookieImpostureDreets() },
      });
      expect(response.status).toBe(200);
      expect(await usersMigrationDb().findOne({ _id: id })).toBeNull();
    });
  });

  describe("POST /api/v1/organisation/membres/batch", () => {
    const inviter = async (cookie: string, email: string) =>
      httpClient.post(
        "/api/v1/organisation/membres/batch",
        { emails: [email], roles: ["admin"] },
        { headers: { cookie } }
      );

    it("invite dans la DREETS pour un administrateur de la DREETS", async () => {
      const response = await inviter(await cookieDe(ADMIN_DREETS), "nouvel@dreets.local");
      expect(response.status).toBe(200);
      const invitation = await invitationsDb().findOne({ email: "nouvel@dreets.local" });
      expect(invitation?.organisation_id.equals(dreetsOrganisationId)).toBe(true);
      expect(invitation?.role).toBe("admin");
    });

    it("invite dans la DDETS pour un administrateur de la DDETS", async () => {
      const response = await inviter(await cookieDe(ADMIN_DDETS), "nouvel@ddets.local");
      expect(response.status).toBe(200);
      const invitation = await invitationsDb().findOne({ email: "nouvel@ddets.local" });
      expect(invitation?.organisation_id.equals(ddetsRegionOrganisationId)).toBe(true);
    });

    it("est refusé à un agent de la DREETS sans rôle admin", async () => {
      const response = await inviter(await cookieDe(AGENT_DREETS), "refus@dreets.local");
      expect(response.status).toBe(403);
      expect(await invitationsDb().findOne({ email: "refus@dreets.local" })).toBeNull();
    });
  });

  describe("POST /api/v1/auth/register sur invitation", () => {
    const EMAIL = "invite@dreets.local";
    const JETON = "jeton-invitation-dreets";
    const inscrire = (invitationToken?: string) =>
      httpClient.post("/api/v1/auth/register", {
        user: {
          email: EMAIL,
          civility: "Madame",
          nom: "Dupont",
          prenom: "Jeanne",
          fonction: "Référente apprentissage",
          telephone: "0102030405",
          password: "MDP-azerty123!",
          has_accept_cgu_version: "v0.4",
        },
        organisation: { type: "DREETS", code_region: "75" },
        ...(invitationToken ? { invitationToken } : {}),
      });

    beforeEach(async () => {
      await invitationsDb().insertOne(
        testDoc<IInvitation>({
          _id: new ObjectId(),
          organisation_id: dreetsOrganisationId,
          email: EMAIL,
          token: JETON,
          author_id: new ObjectId(),
          role: "admin",
          created_at: new Date(),
          expires_at: new Date(Date.now() + 96 * 60 * 60 * 1000),
        })
      );
    });

    it.each([
      ["sans jeton", undefined],
      ["avec un autre jeton", "jeton-devine"],
    ])("refuse l'inscription %s", async (_libelle, jeton) => {
      const response = await inscrire(jeton);
      expect(response.status).toBe(400);
      expect(await usersMigrationDb().findOne({ email: EMAIL })).toBeNull();
    });

    it("annonce l'expiration avant de demander le lien quand l'invitation a expiré", async () => {
      await invitationsDb().updateOne({ email: EMAIL }, { $set: { expires_at: new Date(Date.now() - 1000) } });
      const response = await inscrire();
      expect(response.status).toBe(401);
      expect(response.data.message).toBe("Le lien d'invitation a expiré. Veuillez demander une nouvelle invitation.");
      expect(await usersMigrationDb().findOne({ email: EMAIL })).toBeNull();
    });

    it("confirme le compte avec le rôle de l'invitation quand le jeton est le bon", async () => {
      const response = await inscrire(JETON);
      expect(response.status).toBe(200);
      const compte = await usersMigrationDb().findOne({ email: EMAIL });
      expect(compte?.account_status).toBe("CONFIRMED");
      expect(compte?.organisation_role).toBe("admin");
    });
  });

  describe("POST /api/v1/auth/activation", () => {
    const activer = async (organisationId: ObjectId) => {
      const email = `${new ObjectId()}@activation.local`;
      await insererUtilisateur(organisationId, "PENDING_EMAIL_VALIDATION", undefined, email);
      return httpClient.post("/api/v1/auth/activation", { activationToken: createActivationToken(email) });
    };

    it("n'annonce pas de gestionnaire pour une DREETS sans administrateur", async () => {
      await usersMigrationDb().updateMany(
        { organisation_id: dreetsOrganisationId },
        { $unset: { organisation_role: "" } }
      );
      const response = await activer(dreetsOrganisationId);
      expect(response.status).toBe(200);
      expect(response.data.validationByGestionnaire).toBe(false);
    });

    it("annonce un gestionnaire pour une DDETS sans administrateur quand la DREETS de la région en a un", async () => {
      await usersMigrationDb().updateMany(
        { organisation_id: ddetsRegionOrganisationId },
        { $unset: { organisation_role: "" } }
      );
      const response = await activer(ddetsRegionOrganisationId);
      expect(response.status).toBe(200);
      expect(response.data.validationByGestionnaire).toBe(true);
    });

    it("annonce un gestionnaire pour une DRAAF dont un membre est confirmé", async () => {
      const response = await activer(draafOrganisationId);
      expect(response.status).toBe(200);
      expect(response.data.validationByGestionnaire).toBe(true);
    });
  });
});
