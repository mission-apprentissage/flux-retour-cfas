import { ObjectId } from "bson";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { invitationsDb, organisationsDb, organismesDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const ADMIN: IOrganisationCreate = { type: "ADMINISTRATEUR" };
const DREETS_IDF: IOrganisationCreate = { type: "DREETS", code_region: "11" };
const ORGANISME_ID = new ObjectId();
const SIRET = "41054102000070";

describe("POST /api/v1/admin/organismes/:id/membres/invitations", () => {
  useMongo();

  let requestAsOrganisation: RequestAsOrganisationFunc;

  const inviter = (body: Record<string, unknown>, org: IOrganisationCreate = ADMIN, id: ObjectId = ORGANISME_ID) =>
    requestAsOrganisation(org, "post", `/api/v1/admin/organismes/${id}/membres/invitations`, body);

  beforeEach(async () => {
    vi.mocked(sendEmail).mockClear();
    requestAsOrganisation = (await initTestApp()).requestAsOrganisation;
    await organismesDb().insertOne(
      {
        _id: ORGANISME_ID,
        siret: SIRET,
        uai: "0332881D",
        nom: "CAMPUS DU LAC",
        adresse: { region: "75" },
        created_at: new Date(),
        updated_at: new Date(),
      } as never,
      { bypassDocumentValidation: true }
    );
  });

  it("Crée l'organisation du CFA si besoin et invite avec les rôles demandés", async () => {
    const response = await inviter({
      emails: [" Admin@example.com", "membre@example.com"],
      roles: ["admin", "member"],
    });

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: ["admin@example.com", "membre@example.com"], errors: [] });
    const organisation = await organisationsDb().findOne({ type: "ORGANISME_FORMATION", siret: SIRET });
    expect(organisation).toMatchObject({ organisme_id: ORGANISME_ID.toString() });
    const invitations = await invitationsDb().find({ organisation_id: organisation!._id }).sort({ email: 1 }).toArray();
    expect(invitations.map((invitation) => [invitation.email, invitation.role])).toEqual([
      ["admin@example.com", "admin"],
      ["membre@example.com", "member"],
    ]);
    expect(vi.mocked(sendEmail).mock.calls.map((call) => call[1])).toEqual([
      "invitation_cfa_member",
      "invitation_cfa_member",
    ]);
    expect(vi.mocked(sendEmail).mock.calls.map((call) => (call[2] as { admin?: unknown }).admin)).toEqual([
      undefined,
      undefined,
    ]);
  });

  it("Rattache l'organisation créée au CFA de la fiche, même sans UAI quand un homonyme SIRET en a un", async () => {
    const sansUai = new ObjectId();
    await organismesDb().insertOne(
      {
        _id: sansUai,
        siret: SIRET,
        nom: "CAMPUS DU LAC ANNEXE",
        created_at: new Date(),
        updated_at: new Date(),
      } as never,
      { bypassDocumentValidation: true }
    );

    expect((await inviter({ emails: ["annexe@example.com"] }, ADMIN, sansUai)).status).toBe(200);

    const organisation = await organisationsDb().findOne({ type: "ORGANISME_FORMATION", siret: SIRET, uai: null });
    expect(organisation).toMatchObject({ organisme_id: sansUai.toString() });
  });

  it("Réutilise l'organisation existante et signale les doublons", async () => {
    await inviter({ emails: ["membre@example.com"] });
    const response = await inviter({ emails: ["membre@example.com", "autre@example.com"] });

    expect(response.data.success).toEqual(["autre@example.com"]);
    expect(response.data.errors.map((error: { email: string }) => error.email)).toEqual(["membre@example.com"]);
    expect(await organisationsDb().countDocuments({ type: "ORGANISME_FORMATION" })).toBe(1);
  });

  it("Refuse les non-administrateurs, un organisme inconnu et un corps invalide", async () => {
    expect((await inviter({ emails: ["x@example.com"] }, DREETS_IDF)).status).toBe(403);
    expect((await inviter({ emails: ["x@example.com"] }, ADMIN, new ObjectId())).status).toBe(404);
    expect((await inviter({ emails: ["pas-une-adresse"] })).status).toBe(400);
    expect((await inviter({ emails: ["x@example.com"], roles: ["admin", "member"] })).status).toBe(400);
    expect(await invitationsDb().countDocuments({})).toBe(0);
  });
});
