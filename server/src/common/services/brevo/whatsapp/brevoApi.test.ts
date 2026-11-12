import nock from "nock";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import config from "@/config";

import { sendWhatsAppMessage, upsertBrevoContact } from "./brevoApi";
import { resetBrevoErrorReports } from "./brevoError";

vi.mock("@/common/services/sentry/alertContract", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/common/services/sentry/alertContract")>()),
  captureTiered: vi.fn(),
}));

type MutableConfig = { brevo: { apiKey?: string; whatsapp: { enabled: boolean } } };
const mutableConfig = config as unknown as MutableConfig;

const brevo = () => nock("https://api.brevo.com");
const coupure = () => Object.assign(new Error("socket hang up"), { code: "ECONNRESET" });

describe("reprises des appels Brevo", () => {
  const original = { apiKey: mutableConfig.brevo.apiKey, enabled: mutableConfig.brevo.whatsapp.enabled };

  beforeAll(() => {
    mutableConfig.brevo.apiKey = "cle-de-test";
    mutableConfig.brevo.whatsapp.enabled = true;
    nock.disableNetConnect();
  });

  afterAll(() => {
    mutableConfig.brevo.apiKey = original.apiKey;
    mutableConfig.brevo.whatsapp.enabled = original.enabled;
    nock.enableNetConnect();
  });

  beforeEach(() => resetBrevoErrorReports());
  afterEach(() => nock.cleanAll());

  it("upsert du contact : une coupure réseau est rejouée, l'opération étant idempotente", async () => {
    const scope = brevo().post("/v3/contacts").replyWithError(coupure()).post("/v3/contacts").reply(201, {});

    await upsertBrevoContact("+33612345678", { TBA_EFFECTIF_PRENOM_WHATSAPP: "Prénom" });

    expect(scope.isDone()).toBe(true);
  });

  it("envoi de message : une coupure réseau n'est pas rejouée, le message a pu partir", async () => {
    const scope = brevo()
      .post("/v3/conversations/messages")
      .replyWithError(coupure())
      .post("/v3/conversations/messages")
      .reply(201, { id: "msg-1" });

    const result = await sendWhatsAppMessage("visitor-1", "Bonjour");

    expect(result.success).toBe(false);
    expect(result.safeToRetry).toBe(false);
    expect(scope.isDone()).toBe(false);
  });

  it("envoi de message : un 503 est rejoué, Brevo n'a rien traité", async () => {
    const scope = brevo()
      .post("/v3/conversations/messages")
      .reply(503, { message: "Service unavailable" })
      .post("/v3/conversations/messages")
      .reply(201, { id: "msg-2" });

    const result = await sendWhatsAppMessage("visitor-1", "Bonjour");

    expect(result).toEqual({ success: true, messageId: "msg-2" });
    expect(scope.isDone()).toBe(true);
  });
});
