import { describe, it, expect, vi, beforeEach } from "vitest";

const { sendTransacEmailMock } = vi.hoisted(() => ({ sendTransacEmailMock: vi.fn() }));

vi.mock("@getbrevo/brevo", () => {
  class TransactionalEmailsApi {
    setApiKey() {}
    sendTransacEmail = sendTransacEmailMock;
  }
  class ContactsApi {
    setApiKey() {}
  }
  class EventsApi {
    setApiKey() {}
  }
  class SendSmtpEmail {}

  return {
    default: { TransactionalEmailsApi, ContactsApi, EventsApi, SendSmtpEmail },
    AccountApiApiKeys: { apiKey: "api-key" },
    ContactsApiApiKeys: { apiKey: "api-key" },
    EventsApiApiKeys: { apiKey: "api-key" },
    TransactionalEmailsApiApiKeys: { apiKey: "api-key" },
  };
});

const { sendTransactionalEmail } = await import("@/common/services/brevo/brevo");

/**
 * Brevo est une API externe joignable avec la même clé depuis tous les environnements : hors
 * production, seul ce garde-fou empêche d'écrire à un vrai destinataire. Les tests tournent avec
 * MNA_TDB_ENV=test, donc toujours hors production.
 */
describe("sendTransactionalEmail — garde-fou hors production", () => {
  beforeEach(() => {
    sendTransacEmailMock.mockReset();
    sendTransacEmailMock.mockResolvedValue({ messageId: "test" });
  });

  it("n'envoie rien quand aucune adresse de redirection n'est fournie", async () => {
    const res = await sendTransactionalEmail(
      "directeur@vrai-cfa.fr",
      1,
      {},
      { redirectRecipientInNonProdTo: undefined }
    );

    expect(sendTransacEmailMock).not.toHaveBeenCalled();
    expect(res).toBeUndefined();
  });

  it("n'envoie rien quand l'adresse de redirection est vide", async () => {
    const res = await sendTransactionalEmail("directeur@vrai-cfa.fr", 1, {}, { redirectRecipientInNonProdTo: "" });

    expect(sendTransacEmailMock).not.toHaveBeenCalled();
    expect(res).toBeUndefined();
  });

  it("redirige vers l'utilisateur de test et n'écrit jamais au vrai destinataire", async () => {
    await sendTransactionalEmail(
      "directeur@vrai-cfa.fr",
      1,
      { NOM_CFA: "CAMPUS DU LAC" },
      { cc: ["conseiller@ml.fr"], redirectRecipientInNonProdTo: "testeur@ml.fr" }
    );

    expect(sendTransacEmailMock).toHaveBeenCalledTimes(1);
    const envoye = sendTransacEmailMock.mock.calls[0][0];
    expect(envoye.to).toEqual([{ email: "testeur@ml.fr" }]);
    // Le vrai destinataire est exposé au testeur, mais jamais utilisé comme destinataire ni en copie.
    expect(envoye.params).toMatchObject({ NOM_CFA: "CAMPUS DU LAC", DESTINATAIRE_REEL: "directeur@vrai-cfa.fr" });
    expect(envoye.cc).toBeUndefined();
  });
});
