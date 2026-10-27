import { ObjectId } from "mongodb";
import type { IOrganisation } from "shared/models/data/organisations.model";
import { generateOrganismeFixture } from "shared/models/fixtures/organisme.fixture";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { inviteUserToOrganisation, resendInvitationEmail } from "@/common/actions/organisations.actions";
import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import type { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { testDoc, testPasswordHash } from "@tests/utils/testUtils";

vi.mock("@/common/services/brevo/brevo", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/brevo/brevo")>()),
  sendTransactionalEmail: vi.fn(),
}));

useMongo();

const brevoMock = vi.mocked(sendTransactionalEmail);
const SIRET = "41054102000070";
const UAI = "0332881D";

let ctx: AuthContext;
let organisationId: ObjectId;

describe("invitation des collaborateurs CFA par Brevo", () => {
  beforeEach(async () => {
    brevoMock.mockReset().mockResolvedValue({ messageId: "message" } as never);
    const organismeId = new ObjectId();
    await organismesDb().insertOne(
      generateOrganismeFixture({ _id: organismeId, siret: SIRET, uai: UAI, nom: "CAMPUS DU LAC" })
    );
    organisationId = new ObjectId();
    await organisationsDb().insertOne(
      testDoc<IOrganisation>({
        _id: organisationId,
        type: "ORGANISME_FORMATION",
        siret: SIRET,
        uai: UAI,
        organisme_id: organismeId.toString(),
        created_at: new Date(),
      })
    );
    const adminId = new ObjectId();
    await usersMigrationDb().insertOne({
      _id: adminId,
      email: "admin@campus.fr",
      prenom: "Alice",
      nom: "Admin",
      civility: "Madame",
      fonction: "Directrice",
      telephone: "",
      password: testPasswordHash,
      password_updated_at: new Date(),
      connection_history: [],
      emails: [],
      has_accept_cgu_version: "v0.1",
      organisation_id: organisationId,
      organisation_role: "admin",
      account_status: "CONFIRMED",
      created_at: new Date(),
    });
    ctx = {
      _id: adminId,
      email: "admin@campus.fr",
      prenom: "Alice",
      nom: "Admin",
      fonction: "Directrice",
      organisation_id: organisationId,
      organisation: { _id: organisationId, type: "ORGANISME_FORMATION" },
    } as unknown as AuthContext;
  });

  it("envoie l'invitation par le template Brevo, au nom de l'admin qui invite", async () => {
    await inviteUserToOrganisation(ctx, "collegue@campus.fr", organisationId);

    const invitation = await invitationsDb().findOne({ email: "collegue@campus.fr" });
    expect(brevoMock).toHaveBeenCalledWith(
      "collegue@campus.fr",
      config.brevo.templateInvitationCollaborateurCfaId,
      {
        PRENOM_ADMIN: "Alice",
        NOM_ADMIN: "Admin",
        FONCTION_ADMIN: "Directrice",
        NOM_CFA: "CAMPUS DU LAC",
        LIEN_INSCRIPTION: `${config.publicUrl}/auth/inscription-cfa?invitationToken=${invitation?.token}`,
      },
      { redirectRecipientInNonProdTo: "admin@campus.fr" }
    );
  });

  it("supprime l'invitation et remonte une erreur quand Brevo échoue, pour qu'un second essai passe", async () => {
    brevoMock.mockResolvedValueOnce(undefined as never);

    await expect(inviteUserToOrganisation(ctx, "collegue@campus.fr", organisationId)).rejects.toThrow(
      "L'email d'invitation n'a pas pu être envoyé"
    );
    expect(await invitationsDb().countDocuments()).toBe(0);

    await inviteUserToOrganisation(ctx, "collegue@campus.fr", organisationId);
    expect(await invitationsDb().countDocuments()).toBe(1);
  });

  it("au renvoi, fait tourner le jeton seulement si l'envoi réussit", async () => {
    await inviteUserToOrganisation(ctx, "collegue@campus.fr", organisationId);
    const avant = await invitationsDb().findOne({ email: "collegue@campus.fr" });
    brevoMock.mockResolvedValueOnce(undefined as never);

    await expect(resendInvitationEmail(ctx, avant!._id.toString())).rejects.toThrow();
    expect(await invitationsDb().findOne({ _id: avant!._id })).toMatchObject({
      token: avant!.token,
      expires_at: avant!.expires_at,
    });

    await resendInvitationEmail(ctx, avant!._id.toString());
    const apres = await invitationsDb().findOne({ _id: avant!._id });
    expect(apres?.token).not.toBe(avant!.token);
    expect(brevoMock).toHaveBeenLastCalledWith(
      "collegue@campus.fr",
      config.brevo.templateInvitationCollaborateurCfaId,
      expect.objectContaining({ LIEN_INSCRIPTION: expect.stringContaining(apres?.token ?? "") }),
      { redirectRecipientInNonProdTo: "admin@campus.fr" }
    );
  });
});
