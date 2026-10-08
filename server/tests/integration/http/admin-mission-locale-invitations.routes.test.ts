import { ObjectId } from "bson";
import type { IOrganisationCreate } from "shared/models/data/organisations.model";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { invitationsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp, RequestAsOrganisationFunc } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const ADMIN: IOrganisationCreate = { type: "ADMINISTRATEUR" };
const DREETS_IDF: IOrganisationCreate = { type: "DREETS", code_region: "11" };

const ML_ID = new ObjectId();
const AUTRE_ORGANISATION_ID = new ObjectId();

describe("POST /api/v1/admin/mission-locale/:id/membres/invitations", () => {
  useMongo();

  let requestAsOrganisation: RequestAsOrganisationFunc;

  const inviter = (emails: string[], mlId: ObjectId = ML_ID, org: IOrganisationCreate = ADMIN) =>
    requestAsOrganisation(org, "post", `/api/v1/admin/mission-locale/${mlId}/membres/invitations`, { emails });

  beforeEach(async () => {
    vi.mocked(sendEmail).mockClear();
    const app = await initTestApp();
    requestAsOrganisation = app.requestAsOrganisation;

    await organisationsDb().insertMany([
      {
        _id: ML_ID,
        type: "MISSION_LOCALE",
        nom: "ML IDF",
        ml_id: 701,
        created_at: new Date(),
        adresse: { region: "11" },
        email: "",
        telephone: "",
        site_web: "",
      },
      { _id: AUTRE_ORGANISATION_ID, type: "DREETS", code_region: "84", created_at: new Date() },
    ] as never);
  });

  it("Crée une invitation par adresse dans la Mission Locale et envoie le courriel", async () => {
    const response = await inviter([" Conseiller.Un@example.com ", "conseiller.deux@example.com"]);

    expect(response.status).toBe(200);
    expect(response.data).toEqual({
      success: ["conseiller.un@example.com", "conseiller.deux@example.com"],
      errors: [],
    });
    const invitations = await invitationsDb().find({ organisation_id: ML_ID }).toArray();
    expect(invitations.map((invitation) => invitation.email).sort()).toEqual([
      "conseiller.deux@example.com",
      "conseiller.un@example.com",
    ]);
    expect(vi.mocked(sendEmail)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(sendEmail).mock.calls[0][1]).toBe("invitation_organisation");
  });

  it("Signale par adresse les doublons et les comptes déjà rattachés ailleurs", async () => {
    await usersMigrationDb().insertOne(
      {
        _id: new ObjectId(),
        email: "deja.ailleurs@example.com",
        nom: "Nom",
        prenom: "Prénom",
        organisation_id: AUTRE_ORGANISATION_ID,
        account_status: "CONFIRMED",
      } as never,
      { bypassDocumentValidation: true }
    );
    await inviter(["deja.invite@example.com"]);

    const response = await inviter(["deja.invite@example.com", "deja.ailleurs@example.com", "nouveau@example.com"]);

    expect(response.status).toBe(200);
    expect(response.data.success).toEqual(["nouveau@example.com"]);
    expect(response.data.errors.map((error: { email: string }) => error.email)).toEqual([
      "deja.invite@example.com",
      "deja.ailleurs@example.com",
    ]);
  });

  it("Refuse les profils non administrateurs", async () => {
    const response = await inviter(["conseiller@example.com"], ML_ID, DREETS_IDF);

    expect(response.status).toBe(403);
    expect(await invitationsDb().countDocuments({})).toBe(0);
  });

  it("Renvoie 404 si l'organisation n'est pas une Mission Locale", async () => {
    const response = await inviter(["conseiller@example.com"], AUTRE_ORGANISATION_ID);

    expect(response.status).toBe(404);
    expect(await invitationsDb().countDocuments({})).toBe(0);
  });

  it("Valide les adresses et la taille du lot", async () => {
    expect((await inviter(["pas-une-adresse"])).status).toBe(400);
    expect((await inviter([])).status).toBe(400);
    expect((await inviter(Array.from({ length: 51 }, (_, index) => `conseiller${index}@example.com`))).status).toBe(
      400
    );
    expect(await invitationsDb().countDocuments({})).toBe(0);
  });
});
