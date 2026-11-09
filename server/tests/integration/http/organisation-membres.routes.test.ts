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

const ADMIN_CFA = "admin@cfa.local";
const MEMBRE_CFA = "membre@cfa.local";
const SANS_ROLE_CFA = "sans-role@cfa.local";
const ADMIN_TBA = "admin@tba.local";
const AGENT_DREETS = "agent@dreets.local";

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

const routes: Array<{ libelle: string; cfaSeulement?: boolean; preparer: (orgId: ObjectId) => Promise<Cible> }> = [
  {
    libelle: "DELETE /api/v1/organisation/membres/:userId",
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
    cfaSeulement: true,
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
    ]);

    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", "admin", ADMIN_CFA);
    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", "member", MEMBRE_CFA);
    await insererUtilisateur(cfaOrganisationId, "CONFIRMED", undefined, SANS_ROLE_CFA);
    await insererUtilisateur(tbaOrganisationId, "CONFIRMED", undefined, ADMIN_TBA);
    await insererUtilisateur(dreetsOrganisationId, "CONFIRMED", undefined, AGENT_DREETS);
  });

  describe.each(routes)("$libelle", ({ cfaSeulement, preparer }) => {
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

    if (!cfaSeulement) {
      it("reste ouverte aux utilisateurs d'une organisation qui n'est pas un CFA", async () => {
        const cible = await preparer(dreetsOrganisationId);
        const response = await appeler(cible, await cookieDe(AGENT_DREETS));
        expect(response.status).toBe(200);
        expect(await cible.effetApplique()).toBe(true);
      });
    }
  });
});
