import { AxiosInstance } from "axiosist";
import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models/data/organisations.model";
import type { IUsersMigration } from "shared/models/data/usersMigration.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { vi, it, expect, describe, beforeEach } from "vitest";

import { createSession } from "@/common/actions/sessions.actions";
import { COOKIE_NAME } from "@/common/constants/cookieName";
import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import { sendEmail } from "@/common/services/mailer/mailer";
import { setTime } from "@/common/utils/timeUtils";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, testDoc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");
vi.mock("@/common/services/brevo/brevo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/brevo")>()),
  sendTransactionalEmail: vi.fn(),
}));

const brevoMock = vi.mocked(sendTransactionalEmail);

const now = "2026-04-20T00:00:00.000Z";

const SIRET = "41054102000070";
const UAI = "0332881D";

let app: Awaited<ReturnType<typeof initTestApp>>;
let httpClient: AxiosInstance;

const cfaOrganisationId = new ObjectId(id(1));
const cfaOrganismeId = new ObjectId(id(2));
const adminEmail = "admin@cfa.local";
let adminCookie: string;

async function seedCfaOrganisation() {
  await organismesDb().insertOne(
    generateOrganismeFixture({
      _id: cfaOrganismeId,
      siret: SIRET,
      uai: UAI,
      nom: "CAMPUS DU LAC",
      adresse: { departement: "33", region: "75", academie: "04", commune: "Bordeaux", code_postal: "33300" },
    })
  );
  await organisationsDb().insertOne(
    testDoc<IOrganisation>({
      _id: cfaOrganisationId,
      created_at: new Date(now),
      type: "ORGANISME_FORMATION",
      siret: SIRET,
      uai: UAI,
      organisme_id: cfaOrganismeId.toString(),
    })
  );
}

async function seedCfaAdmin() {
  await usersMigrationDb().insertOne(
    testDoc<IUsersMigration>({
      _id: new ObjectId(id(10)),
      account_status: "CONFIRMED",
      created_at: new Date(now),
      password_updated_at: new Date(now),
      connection_history: [],
      emails: [],
      email: adminEmail,
      nom: "Admin",
      prenom: "Alice",
      fonction: "Directrice",
      password: testPasswordHash,
      organisation_id: cfaOrganisationId,
      organisation_role: "admin",
      has_accept_cgu_version: "v1",
    })
  );
  const token = await createSession(adminEmail);
  adminCookie = `${COOKIE_NAME}=${token}`;
}

async function batchInvite(body: { emails: string[]; roles?: Array<"admin" | "member"> }) {
  return httpClient.post("/api/v1/organisation/membres/batch", body, {
    headers: { cookie: adminCookie },
  });
}

describe("POST /api/v1/organisation/membres/batch", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
    httpClient = app.httpClient;
    setTime(new Date(now));
    vi.mocked(sendEmail).mockClear();
    brevoMock.mockReset().mockResolvedValue({ messageId: "message" } as never);
    await seedCfaOrganisation();
    await seedCfaAdmin();
  });

  it("crée les invitations et envoie les emails pour un batch valide", async () => {
    const response = await batchInvite({
      emails: ["new1@cfa.local", "new2@cfa.local"],
      roles: ["admin", "member"],
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toEqual(["new1@cfa.local", "new2@cfa.local"]);
    expect(response.data.errors).toEqual([]);

    const inv1 = await invitationsDb().findOne({ email: "new1@cfa.local" });
    const inv2 = await invitationsDb().findOne({ email: "new2@cfa.local" });
    expect(inv1?.role).toBe("admin");
    expect(inv2?.role).toBe("member");
    expect(inv1?.expires_at).toBeInstanceOf(Date);
    const expectedExpiration = Date.now() + 96 * 60 * 60 * 1000;
    expect(Math.abs((inv1?.expires_at?.getTime() ?? 0) - expectedExpiration)).toBeLessThan(60_000);
    expect(inv1?.organisation_id.equals(cfaOrganisationId)).toBe(true);

    expect(brevoMock).toHaveBeenCalledTimes(2);
    expect(brevoMock).toHaveBeenCalledWith(
      "new1@cfa.local",
      config.brevo.templateInvitationCollaborateurCfaId,
      expect.objectContaining({
        NOM_CFA: "CAMPUS DU LAC",
        LIEN_INSCRIPTION: expect.stringContaining(inv1?.token ?? ""),
      }),
      { redirectRecipientInNonProdTo: adminEmail }
    );
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejette l'auto-invitation (email identique à l'appelant)", async () => {
    const response = await batchInvite({ emails: [adminEmail] });

    expect(response.status).toBe(200);
    expect(response.data.success).toEqual([]);
    expect(response.data.errors).toEqual([{ email: adminEmail, message: "Vous ne pouvez pas vous inviter vous-même" }]);
    expect(await invitationsDb().countDocuments({ email: adminEmail })).toBe(0);
    expect(brevoMock).not.toHaveBeenCalled();
  });

  it("rejette un email déjà invité pour la même organisation", async () => {
    await invitationsDb().insertOne({
      _id: new ObjectId(),
      token: "existing-token",
      email: "already-invited@cfa.local",
      organisation_id: cfaOrganisationId,
      author_id: new ObjectId(id(99)),
      created_at: new Date(now),
      expires_at: new Date("2026-04-25T00:00:00.000Z"),
    });

    const response = await batchInvite({ emails: ["already-invited@cfa.local"] });

    expect(response.status).toBe(200);
    expect(response.data.errors).toEqual([
      { email: "already-invited@cfa.local", message: "Une invitation a déjà été envoyée à cet email" },
    ]);
    expect(await invitationsDb().countDocuments({ email: "already-invited@cfa.local" })).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejette un user déjà membre de la même organisation", async () => {
    await usersMigrationDb().insertOne(
      testDoc<IUsersMigration>({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        created_at: new Date(now),
        email: "member@cfa.local",
        nom: "Existant",
        prenom: "User",
        password: testPasswordHash,
        organisation_id: cfaOrganisationId,
      })
    );

    const response = await batchInvite({ emails: ["member@cfa.local"] });

    expect(response.data.errors).toEqual([
      { email: "member@cfa.local", message: "Cet utilisateur est déjà membre de votre organisation" },
    ]);
  });

  it("rejette avec un message spécifique un user existant sur une Mission Locale", async () => {
    const mlOrgId = new ObjectId(id(20));
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: mlOrgId,
        created_at: new Date(now),
        type: "MISSION_LOCALE",
        nom: "ML Bordeaux",
        ml_id: 3001,
      })
    );
    await usersMigrationDb().insertOne(
      testDoc<IUsersMigration>({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        created_at: new Date(now),
        email: "conseiller@ml.local",
        nom: "Conseiller",
        prenom: "ML",
        password: testPasswordHash,
        organisation_id: mlOrgId,
      })
    );

    const response = await batchInvite({ emails: ["conseiller@ml.local"] });

    expect(response.data.errors).toEqual([
      {
        email: "conseiller@ml.local",
        message: "Cet utilisateur est déjà enregistré en tant que conseiller Mission Locale",
      },
    ]);
  });

  it("rejette avec un message spécifique un user existant sur un autre CFA", async () => {
    const otherCfaOrgId = new ObjectId(id(30));
    const otherCfaOrganismeId = new ObjectId(id(31));
    await organismesDb().insertOne(
      generateOrganismeFixture({
        _id: otherCfaOrganismeId,
        siret: "12345678900010",
        uai: "0000000A",
        nom: "Autre CFA",
      })
    );
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: otherCfaOrgId,
        created_at: new Date(now),
        type: "ORGANISME_FORMATION",
        siret: "12345678900010",
        uai: "0000000A",
        organisme_id: otherCfaOrganismeId.toString(),
      })
    );
    await usersMigrationDb().insertOne(
      testDoc<IUsersMigration>({
        _id: new ObjectId(),
        account_status: "CONFIRMED",
        created_at: new Date(now),
        email: "user@autre-cfa.local",
        nom: "User",
        prenom: "Autre",
        password: testPasswordHash,
        organisation_id: otherCfaOrgId,
      })
    );

    const response = await batchInvite({ emails: ["user@autre-cfa.local"] });

    expect(response.data.errors).toEqual([
      { email: "user@autre-cfa.local", message: "Cet utilisateur est déjà rattaché à un autre CFA" },
    ]);
  });

  it("traite correctement un mélange de succès et d'erreurs sans bloquer", async () => {
    await invitationsDb().insertOne({
      _id: new ObjectId(),
      token: "dup-token",
      email: "dup@cfa.local",
      organisation_id: cfaOrganisationId,
      author_id: new ObjectId(id(99)),
      created_at: new Date(now),
      expires_at: new Date("2026-04-25T00:00:00.000Z"),
    });

    const response = await batchInvite({
      emails: ["ok@cfa.local", "dup@cfa.local", adminEmail],
      roles: ["member", "member", "admin"],
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toEqual(["ok@cfa.local"]);
    expect(response.data.errors).toHaveLength(2);
    expect(response.data.errors.map((e: { email: string }) => e.email).sort()).toEqual(
      [adminEmail, "dup@cfa.local"].sort()
    );

    expect(brevoMock).toHaveBeenCalledTimes(1);
    expect(brevoMock).toHaveBeenCalledWith(
      "ok@cfa.local",
      config.brevo.templateInvitationCollaborateurCfaId,
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("supprime l'invitation et remonte une erreur quand l'envoi Brevo échoue", async () => {
    brevoMock.mockResolvedValueOnce(undefined as never);

    const response = await batchInvite({ emails: ["ko@cfa.local", "ok@cfa.local"], roles: ["member", "member"] });

    expect(response.data.success).toEqual(["ok@cfa.local"]);
    expect(response.data.errors).toEqual([
      { email: "ko@cfa.local", message: "L'email d'invitation n'a pas pu être envoyé" },
    ]);
    expect(await invitationsDb().findOne({ email: "ko@cfa.local" })).toBeNull();
  });

  it("refuse l'accès à un member CFA (non admin)", async () => {
    const memberEmail = "member@cfa.local";
    await usersMigrationDb().insertOne(
      testDoc<IUsersMigration>({
        _id: new ObjectId(id(50)),
        account_status: "CONFIRMED",
        created_at: new Date(now),
        password_updated_at: new Date(now),
        connection_history: [],
        emails: [],
        email: memberEmail,
        nom: "Member",
        prenom: "Bob",
        password: testPasswordHash,
        organisation_id: cfaOrganisationId,
        organisation_role: "member",
        has_accept_cgu_version: "v1",
      })
    );
    const memberToken = await createSession(memberEmail);

    const response = await httpClient.post(
      "/api/v1/organisation/membres/batch",
      { emails: ["new@cfa.local"] },
      { headers: { cookie: `${COOKIE_NAME}=${memberToken}` } }
    );

    expect(response.status).toBe(403);
    expect(await invitationsDb().countDocuments({ email: "new@cfa.local" })).toBe(0);
  });

  it("déduplique par email en gardant le premier rôle en cas de doublon", async () => {
    const response = await batchInvite({
      emails: ["dup@cfa.local", "dup@cfa.local", "other@cfa.local"],
      roles: ["admin", "member", "member"],
    });

    expect(response.status).toBe(200);
    expect(response.data.success.sort()).toEqual(["dup@cfa.local", "other@cfa.local"]);
    const invitations = await invitationsDb().find({ email: "dup@cfa.local" }).toArray();
    expect(invitations).toHaveLength(1);
    expect(invitations[0].role).toBe("admin");
  });

  it("retourne 400 quand roles n'a pas la même taille que emails", async () => {
    const response = await batchInvite({
      emails: ["a@cfa.local", "b@cfa.local"],
      roles: ["admin"],
    });

    expect(response.status).toBe(400);
  });

  it("retourne 400 quand emails est vide", async () => {
    const response = await batchInvite({ emails: [] });
    expect(response.status).toBe(400);
  });
});
