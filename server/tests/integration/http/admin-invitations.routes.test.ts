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
import { setTime } from "@/common/utils/timeUtils";
import { useMongo } from "@tests/jest/setupMongo";
import { id, initTestApp, RequestAsOrganisationFunc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const now = "2026-04-20T00:00:00.000Z";

const SIRET = "41054102000070";
const UAI = "0332881D";

let app: Awaited<ReturnType<typeof initTestApp>>;
let _httpClient: AxiosInstance;
let requestAsOrganisation: RequestAsOrganisationFunc;

async function seedCfaOrganisation(organisationId: ObjectId, organismeId: ObjectId) {
  await organismesDb().insertOne(
    generateOrganismeFixture({
      _id: organismeId,
      siret: SIRET,
      uai: UAI,
      nom: "CAMPUS DU LAC",
      adresse: { departement: "33", region: "75", academie: "04", commune: "Bordeaux", code_postal: "33300" },
    })
  );
  await organisationsDb().insertOne({
    _id: organisationId,
    created_at: new Date(now),
    type: "ORGANISME_FORMATION",
    siret: SIRET,
    uai: UAI,
    organisme_id: organismeId.toString(),
  } as any);
}

async function seedAuthor(email = "author@tdb.fr") {
  const _id = new ObjectId();
  await usersMigrationDb().insertOne({
    _id,
    account_status: "CONFIRMED",
    email,
    password: testPasswordHash,
    nom: "Author",
    prenom: "Alice",
    fonction: "Support",
    organisation_id: new ObjectId(id(99)),
    created_at: new Date(),
    password_updated_at: new Date(),
    connection_history: [],
    emails: [],
  } as any);
  return _id;
}

describe("Admin invitations routes", () => {
  useMongo();

  beforeEach(async () => {
    app = await initTestApp();
    _httpClient = app.httpClient;
    requestAsOrganisation = app.requestAsOrganisation;
    setTime(new Date(now));
    vi.mocked(sendEmail).mockClear();
  });

  describe("GET /api/v1/admin/invitations", () => {
    it("liste les invitations pendantes avec organisation et auteur", async () => {
      const organisationId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(organisationId, organismeId);
      const authorId = await seedAuthor();

      await invitationsDb().insertOne({
        _id: new ObjectId(),
        organisation_id: organisationId,
        email: "recipient@cfa.fr",
        token: "tok1",
        author_id: authorId,
        role: "admin",
        prenom: "P",
        nom: "N",
        created_at: new Date(now),
        expires_at: new Date("2026-04-24T00:00:00.000Z"),
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/invitations?status=pending"
      );
      expect(response.status).toBe(200);
      expect(response.data.pagination.total).toBe(1);
      expect(response.data.data[0].email).toBe("recipient@cfa.fr");
      expect(response.data.data[0].organisation.type).toBe("ORGANISME_FORMATION");
      expect(response.data.data[0].organisation.organisme.nom).toBe("CAMPUS DU LAC");
      expect(response.data.data[0].author.email).toBe("author@tdb.fr");
    });

    it("filtre par type d'organisation", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);

      const mlOrgId = new ObjectId(id(10));
      await organisationsDb().insertOne({
        _id: mlOrgId,
        created_at: new Date(now),
        type: "MISSION_LOCALE",
        nom: "ML Test",
        ml_id: 1234,
      } as any);

      await invitationsDb().insertMany([
        {
          _id: new ObjectId(),
          organisation_id: cfaOrgId,
          email: "cfa@x.fr",
          token: "t1",
          author_id: new ObjectId(),
          created_at: new Date(now),
          expires_at: new Date("2026-04-24T00:00:00.000Z"),
        },
        {
          _id: new ObjectId(),
          organisation_id: mlOrgId,
          email: "ml@x.fr",
          token: "t2",
          author_id: new ObjectId(),
          created_at: new Date(now),
          expires_at: new Date("2026-04-24T00:00:00.000Z"),
        },
      ]);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/invitations?status=pending&type=MISSION_LOCALE"
      );
      expect(response.status).toBe(200);
      expect(response.data.pagination.total).toBe(1);
      expect(response.data.data[0].email).toBe("ml@x.fr");
    });

    it("filtre par organisation_id", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const otherOrgId = new ObjectId(id(5));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      await organisationsDb().insertOne({
        _id: otherOrgId,
        created_at: new Date(now),
        type: "ORGANISME_FORMATION",
        siret: "99999999999999",
        uai: "9999999A",
      } as any);

      await invitationsDb().insertMany([
        {
          _id: new ObjectId(),
          organisation_id: cfaOrgId,
          email: "a@x.fr",
          token: "t1",
          author_id: new ObjectId(),
          created_at: new Date(now),
          expires_at: new Date("2026-04-24T00:00:00.000Z"),
        },
        {
          _id: new ObjectId(),
          organisation_id: otherOrgId,
          email: "b@x.fr",
          token: "t2",
          author_id: new ObjectId(),
          created_at: new Date(now),
          expires_at: new Date("2026-04-24T00:00:00.000Z"),
        },
      ]);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/invitations?status=pending&organisation_id=${cfaOrgId.toString()}`
      );
      expect(response.data.pagination.total).toBe(1);
      expect(response.data.data[0].email).toBe("a@x.fr");
    });

    it("cherche par email ou nom d'organisme", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      await invitationsDb().insertOne({
        _id: new ObjectId(),
        organisation_id: cfaOrgId,
        email: "findme@cfa.fr",
        token: "t1",
        author_id: new ObjectId(),
        created_at: new Date(now),
        expires_at: new Date("2026-04-24T00:00:00.000Z"),
      });

      const byEmail = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/invitations?status=pending&search=findme"
      );
      expect(byEmail.data.pagination.total).toBe(1);

      const byOrga = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/invitations?status=pending&search=CAMPUS"
      );
      expect(byOrga.data.pagination.total).toBe(1);
    });

    it("lit l'archive en mode consumed", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      await invitationsArchiveDb().insertOne({
        _id: new ObjectId(),
        organisation_id: cfaOrgId,
        email: "consumed@x.fr",
        token: "told",
        author_id: new ObjectId(),
        created_at: new Date(now),
      } as any);

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        "/api/v1/admin/invitations?status=consumed"
      );
      expect(response.data.pagination.total).toBe(1);
      expect(response.data.data[0].email).toBe("consumed@x.fr");
    });

    it("403 si non-admin plateforme", async () => {
      const response = await requestAsOrganisation(
        { type: "ORGANISME_FORMATION", siret: SIRET, uai: UAI } as any,
        "get",
        "/api/v1/admin/invitations?status=pending"
      );
      expect(response.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/admin/invitations/:id", () => {
    it("supprime l'invitation", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      const invitationId = new ObjectId();
      await invitationsDb().insertOne({
        _id: invitationId,
        organisation_id: cfaOrgId,
        email: "todelete@x.fr",
        token: "t1",
        author_id: new ObjectId(),
        created_at: new Date(now),
        expires_at: new Date("2026-04-24T00:00:00.000Z"),
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "delete",
        `/api/v1/admin/invitations/${invitationId.toString()}`
      );
      expect(response.status).toBe(200);

      const check = await invitationsDb().findOne({ _id: invitationId });
      expect(check).toBeNull();
    });

    it("404 si invitation absente", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "delete",
        `/api/v1/admin/invitations/${new ObjectId().toString()}`
      );
      expect(response.status).toBe(404);
    });

    it("400 si ID invalide", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "delete",
        "/api/v1/admin/invitations/not-an-id"
      );
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/v1/admin/invitations/:id/resend", () => {
    it("renvoie l'email CFA admin et met à jour expires_at", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      const invitationId = new ObjectId();
      await invitationsDb().insertOne({
        _id: invitationId,
        organisation_id: cfaOrgId,
        email: "resend@x.fr",
        token: "old-tok",
        author_id: new ObjectId(),
        role: "admin",
        prenom: "S",
        nom: "A",
        created_at: new Date(now),
        expires_at: new Date("2026-04-22T00:00:00.000Z"),
      });

      setTime(new Date("2026-04-21T00:00:00.000Z"));
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        `/api/v1/admin/invitations/${invitationId.toString()}/resend`
      );
      expect(response.status).toBe(200);
      expect(response.data.email).toBe("resend@x.fr");

      const updated = await invitationsDb().findOne({ _id: invitationId });
      expect(updated?.expires_at?.getTime()).toBeGreaterThan(new Date("2026-04-22T00:00:00.000Z").getTime());
      expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
        "resend@x.fr",
        "invitation_cfa_admin",
        expect.objectContaining({ cfaName: "CAMPUS DU LAC" })
      );
    });

    it("renvoie un email member avec infos de l'auteur", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      const authorId = await seedAuthor("boss@cfa.fr");
      const invitationId = new ObjectId();
      await invitationsDb().insertOne({
        _id: invitationId,
        organisation_id: cfaOrgId,
        email: "member@x.fr",
        token: "m-tok",
        author_id: authorId,
        role: "member",
        created_at: new Date(now),
        expires_at: new Date("2026-04-24T00:00:00.000Z"),
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        `/api/v1/admin/invitations/${invitationId.toString()}/resend`
      );
      expect(response.status).toBe(200);
      expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
        "member@x.fr",
        "invitation_cfa_member",
        expect.objectContaining({
          cfaName: "CAMPUS DU LAC",
          admin: expect.objectContaining({ prenom: "Alice", nom: "Author", fonction: "Support" }),
        })
      );
    });

    it("404 si invitation introuvable", async () => {
      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "post",
        `/api/v1/admin/invitations/${new ObjectId().toString()}/resend`
      );
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/v1/admin/invitations/counts/organisme/:organismeId", () => {
    it("retourne les counts par organisme", async () => {
      const cfaOrgId = new ObjectId(id(1));
      const organismeId = new ObjectId(id(2));
      await seedCfaOrganisation(cfaOrgId, organismeId);
      await usersMigrationDb().insertMany([
        {
          _id: new ObjectId(),
          account_status: "CONFIRMED",
          email: "a@x.fr",
          password: testPasswordHash,
          nom: "N",
          prenom: "P",
          organisation_id: cfaOrgId,
          organisation_role: "admin",
          created_at: new Date(),
          password_updated_at: new Date(),
          connection_history: [],
          emails: [],
        },
        {
          _id: new ObjectId(),
          account_status: "CONFIRMED",
          email: "b@x.fr",
          password: testPasswordHash,
          nom: "N",
          prenom: "P",
          organisation_id: cfaOrgId,
          created_at: new Date(),
          password_updated_at: new Date(),
          connection_history: [],
          emails: [],
        },
      ] as any);
      await invitationsDb().insertOne({
        _id: new ObjectId(),
        organisation_id: cfaOrgId,
        email: "pending@x.fr",
        token: "t1",
        author_id: new ObjectId(),
        created_at: new Date(now),
        expires_at: new Date("2026-04-24T00:00:00.000Z"),
      });

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/invitations/counts/organisme/${organismeId.toString()}`
      );
      expect(response.status).toBe(200);
      expect(response.data).toEqual({
        organisation_id: cfaOrgId.toString(),
        usersTotal: 2,
        usersAdmin: 1,
        invitationsPending: 1,
      });
    });

    it("retourne null organisation_id + counts à 0 si pas d'organisation liée", async () => {
      const organismeId = new ObjectId(id(2));
      await organismesDb().insertOne(
        generateOrganismeFixture({
          _id: organismeId,
          siret: SIRET,
          uai: UAI,
          nom: "ORPHAN",
          adresse: { departement: "33", region: "75", academie: "04", commune: "Bordeaux", code_postal: "33300" },
        })
      );

      const response = await requestAsOrganisation(
        { type: "ADMINISTRATEUR" },
        "get",
        `/api/v1/admin/invitations/counts/organisme/${organismeId.toString()}`
      );
      expect(response.status).toBe(200);
      expect(response.data).toEqual({ organisation_id: null, usersTotal: 0, usersAdmin: 0, invitationsPending: 0 });
    });
  });
});
