import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getConnexionInvitationByToken } from "@/common/actions/brevo/contacts/connexion-invitations.actions";
import {
  buildOrganisme,
  buildOrgaMl,
  buildOrgaOf,
  buildRupturant,
  buildUser,
  NOW,
  resetFixtureCounters,
} from "@/common/actions/brevo/contacts/fixtures";
import { missionLocaleEffectifsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendTransactionalEmail } from "@/common/services/brevo/brevo";
import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";

import { sendCfaInvitationFromMissionLocale } from "./mission-locale-cfa-invitation.actions";

vi.mock("@/common/services/brevo/brevo", () => ({
  sendTransactionalEmail: vi.fn(async () => true),
}));

const sendTransactionalEmailMock = vi.mocked(sendTransactionalEmail);

useMongo();

describe("sendCfaInvitationFromMissionLocale", () => {
  const envInitial = config.env;
  const templateInitial = config.brevo.templateInvitationCfaId;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    resetFixtureCounters();
    sendTransactionalEmailMock.mockClear();
    // Hors production, l'envoi est volontairement limité à un seul destinataire.
    config.env = "production";
    config.brevo.templateInvitationCfaId = 42;
  });

  afterEach(() => {
    vi.useRealTimers();
    config.env = envInitial;
    config.brevo.templateInvitationCfaId = templateInitial;
  });

  it("envoie à chaque compte confirmé un lien qui pré-remplit sa propre adresse", async () => {
    const orgaOf = buildOrgaOf();
    const organisme = buildOrganisme(orgaOf, { first_transmission_date: NOW });
    const ml = buildOrgaMl("ML TEST", { adresse: { region: "11", commune: "Paris" } });
    const confirmes = [
      buildUser(orgaOf, { email: "Alice@cfa.fr" }),
      buildUser(orgaOf, { email: "bob@cfa.fr" }),
      buildUser(orgaOf, { email: "chloe@cfa.fr" }),
    ];
    const enAttente = buildUser(orgaOf, { email: "pas-encore@cfa.fr", account_status: "PENDING_EMAIL_VALIDATION" });

    await organisationsDb().insertMany([orgaOf as any, ml as any]);
    await organismesDb().insertOne(organisme as any);
    await usersMigrationDb().insertMany([...confirmes, enAttente] as any);
    await missionLocaleEffectifsDb().insertOne(buildRupturant(organisme._id, ml._id) as any, {
      bypassDocumentValidation: true,
    });

    const conseiller = { _id: ml._id, email: "conseiller@ml.fr", prenom: "Nadia", nom: "MARTIN" } as AuthContext;
    const result = await sendCfaInvitationFromMissionLocale(ml as any, conseiller, String(organisme._id));

    expect(result.nb_destinataires).toBe(3);
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(3);

    const liens = new Set<string>();
    for (const [destinataire, , params] of sendTransactionalEmailMock.mock.calls) {
      const lien = params.LIEN_INVITATION as string;
      liens.add(lien);

      const token = new URL(lien).searchParams.get("invitationToken");
      expect(token).toBeTruthy();
      const invitation = await getConnexionInvitationByToken(token as string);
      expect(invitation?.email).toBe(destinataire.toLowerCase());
    }
    expect(liens.size).toBe(3);

    const destinataires = sendTransactionalEmailMock.mock.calls.map(([email]) => email);
    expect(destinataires).not.toContain("pas-encore@cfa.fr");
  });
});
