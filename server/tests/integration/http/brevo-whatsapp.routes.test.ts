import crypto from "crypto";

import { AxiosInstance } from "axiosist";
import { it, describe, beforeEach, expect, vi } from "vitest";

import config from "@/config";
import { useMongo } from "@tests/jest/setupMongo";
import { initTestApp } from "@tests/utils/testUtils";

vi.mock("@/common/services/mailer/mailer");

let httpClient: AxiosInstance;

function signPayload(payload: object, secret: string): string {
  const body = JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

describe("Brevo WhatsApp Webhook Routes", () => {
  useMongo();

  beforeEach(async () => {
    const app = await initTestApp();
    httpClient = app.httpClient;
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

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (delivered)", async () => {
      const payload = {
        event: "delivered",
        messageId: "brevo-msg-123",
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (read)", async () => {
      const payload = {
        event: "read",
        messageId: "brevo-msg-456",
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement de statut (failed)", async () => {
      const payload = {
        event: "failed",
        messageId: "brevo-msg-789",
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement inbound legacy", async () => {
      const payload = {
        event: "inbound",
        contact: { phone: "+33612345678" },
        message: { text: "oui", id: "legacy-msg-1" },
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un événement inconnu (pas de crash)", async () => {
      const payload = {
        event: "unknown_event",
        data: { foo: "bar" },
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un payload conversationFragment invalide (Zod warning)", async () => {
      const payload = {
        eventName: "conversationFragment",
        // messages manquant
      };

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

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

      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", payload);

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it("retourne 200 pour un body vide", async () => {
      const response = await httpClient.post("/api/webhooks/brevo/whatsapp", {});

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe("Signature verification", () => {
    it("rejette la requête si le secret est configuré mais le header manquant", async () => {
      const originalSecret = config.brevo.whatsapp?.webhookSecret;

      try {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = "test-secret";
        }

        const app = await initTestApp();
        const client = app.httpClient;

        const response = await client.post("/api/webhooks/brevo/whatsapp", {
          event: "delivered",
          messageId: "msg-1",
        });

        expect(response.status).toBe(401);
      } finally {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = originalSecret;
        }
      }
    });

    it("accepte la requête avec une signature valide", async () => {
      const secret = "test-webhook-secret";
      const originalSecret = config.brevo.whatsapp?.webhookSecret;

      try {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = secret;
        }

        const app = await initTestApp();
        const client = app.httpClient;

        const payload = { event: "delivered", messageId: "msg-signed" };
        const signature = signPayload(payload, secret);

        const response = await client.post("/api/webhooks/brevo/whatsapp", payload, {
          headers: { "X-Brevo-Signature": signature },
        });

        expect(response.status).toBe(200);
      } finally {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = originalSecret;
        }
      }
    });

    it("rejette la requête avec une signature invalide", async () => {
      const secret = "test-webhook-secret";
      const originalSecret = config.brevo.whatsapp?.webhookSecret;

      try {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = secret;
        }

        const app = await initTestApp();
        const client = app.httpClient;

        const payload = { event: "delivered", messageId: "msg-bad-sig" };

        const response = await client.post("/api/webhooks/brevo/whatsapp", payload, {
          headers: { "X-Brevo-Signature": "invalid-signature" },
        });

        expect(response.status).toBe(401);
      } finally {
        if (config.brevo.whatsapp) {
          (config.brevo.whatsapp as any).webhookSecret = originalSecret;
        }
      }
    });
  });
});
