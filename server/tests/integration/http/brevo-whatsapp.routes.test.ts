import { AxiosInstance } from "axiosist";
import { afterEach, it, describe, beforeEach, expect, vi } from "vitest";

import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

const TEST_WEBHOOK_TOKEN = "test-webhook-token";

let httpClient: AxiosInstance;
let originalEnv: string;
let originalWebhookToken: string | undefined;

function postWebhook(client: AxiosInstance, payload: object) {
  return client.post(`/api/webhooks/brevo/whatsapp?token=${TEST_WEBHOOK_TOKEN}`, payload);
}

describe("Brevo WhatsApp Webhook Routes", () => {
  useMongo();

  beforeEach(async () => {
    originalEnv = config.env;
    originalWebhookToken = config.brevo.whatsapp?.webhookToken;
    (config as any).env = "production";
    if (config.brevo.whatsapp) {
      (config.brevo.whatsapp as any).webhookToken = TEST_WEBHOOK_TOKEN;
    }
    const app = await initTestApp();
    httpClient = app.httpClient;
  });

  afterEach(() => {
    (config as any).env = originalEnv;
    if (config.brevo.whatsapp) {
      (config.brevo.whatsapp as any).webhookToken = originalWebhookToken;
    }
  });

  describe("POST /api/webhooks/brevo/whatsapp", () => {
    it("retourne 200 pour un conversationFragment valide", async () => {
      const payload = {
        eventName: "conversationFragment",
        messages: [
          {
            id: "msg-1",
            type: "visitor",
            text: "bonjour",
            receivedFrom: "whatsapp",
            sourceMessageId: "src-msg-1",
          },
        ],
        visitor: {
          id: "visitor-abc",
          sourceConversationRef: "33612345678",
          source: "whatsapp",
        },
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (delivered)", async () => {
      const payload = {
        event: "delivered",
        messageId: "brevo-msg-123",
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (read)", async () => {
      const payload = {
        event: "read",
        messageId: "brevo-msg-456",
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (failed)", async () => {
      const payload = {
        event: "failed",
        messageId: "brevo-msg-789",
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement inbound legacy", async () => {
      const payload = {
        event: "inbound",
        contact: { phone: "+33612345678" },
        message: { text: "oui", id: "legacy-msg-1" },
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement inconnu (pas de crash)", async () => {
      const payload = {
        event: "unknown_event",
        data: { foo: "bar" },
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un payload conversationFragment invalide (Zod warning)", async () => {
      const payload = {
        eventName: "conversationFragment",
        // messages manquant
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un conversationFragment sans messages visiteur WhatsApp", async () => {
      const payload = {
        eventName: "conversationFragment",
        messages: [
          {
            id: "msg-agent",
            type: "agent",
            text: "Bonjour, comment puis-je vous aider ?",
            receivedFrom: "chat",
          },
        ],
        visitor: {
          id: "visitor-abc",
          sourceConversationRef: "33612345678",
        },
      };

      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un body vide", async () => {
      const response = await postWebhook(httpClient, {});

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 403 hors production", async () => {
      (config as any).env = "local";
      const app = await initTestApp();

      const response = await app.httpClient.post("/api/webhooks/brevo/whatsapp", {});

      expect(response.status).toBe(403);
    });
  });

  describe("Token verification", () => {
    it("rejette la requête sans token", async () => {
      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", {
        event: "delivered",
        messageId: "msg-1",
      });

      expect(response.status).toBe(401);
    });

    it("rejette la requête avec un token invalide", async () => {
      const response = await httpClient.post("/api/webhooks/brevo/whatsapp?token=invalid", {
        event: "delivered",
        messageId: "msg-1",
      });

      expect(response.status).toBe(401);
    });

    it("accepte la requête avec le bon token", async () => {
      const payload = { event: "delivered", messageId: "msg-signed" };
      const response = await postWebhook(httpClient, payload);

      expect(response.status).toBe(200);
    });
  });
});
