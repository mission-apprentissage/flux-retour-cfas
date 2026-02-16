import crypto from "crypto";

import { captureException } from "@sentry/node";
import express from "express";
import { RateLimiterMemory } from "rate-limiter-flexible";
import { z } from "zod";

import logger from "@/common/logger";
import {
  handleInboundWhatsAppMessage,
  updateMessageStatus,
  maskPhone,
  extractUserResponseText,
} from "@/common/services/brevo/whatsapp";
import config from "@/config";

const zConversationMessage = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  text: z.string().optional(),
  receivedFrom: z.string().optional(),
  sourceMessageId: z.string().optional(),
});

const zVisitor = z.object({
  id: z.string().optional(),
  sourceConversationRef: z.string().optional(),
  source: z.string().optional(),
});

const zConversationFragmentBody = z.object({
  eventName: z.literal("conversationFragment"),
  messages: z.array(zConversationMessage).optional(),
  visitor: zVisitor.optional(),
});

const zStatusEventBody = z.object({
  event: z.enum(["delivered", "read", "failed"]),
  messageId: z.string().optional(),
});

const zInboundEventBody = z.object({
  event: z.literal("inbound"),
  contact: z.object({ phone: z.string().optional() }).optional(),
  message: z.object({ text: z.string().optional(), id: z.string().optional() }).optional(),
});

// --- Rate limiting ---

const webhookRateLimiter = new RateLimiterMemory({
  keyPrefix: "webhook_brevo_whatsapp",
  points: 100,
  duration: 60,
});

async function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    await webhookRateLimiter.consume(req.ip || "unknown");
    next();
  } catch {
    logger.warn({ ip: req.ip }, "WhatsApp webhook rate limited");
    return res.status(429).json({ error: "Too many requests" });
  }
}

function verifyBrevoSignature(req: express.Request, res: express.Response, next: express.NextFunction) {
  const webhookSecret = config.brevo.whatsapp?.webhookSecret;

  if (!webhookSecret) {
    if (config.env === "production") {
      logger.warn("WhatsApp webhook secret not configured in production");
      return res.status(401).json({ error: "Webhook secret not configured" });
    }
    return next();
  }

  const signature = req.headers["x-brevo-signature"] as string;

  if (!signature) {
    logger.warn("Missing X-Brevo-Signature header");
    return res.status(401).json({ error: "Missing signature" });
  }

  const rawBody = (req as any).rawBody as Buffer | undefined;
  if (!rawBody) {
    logger.warn("Missing raw body for HMAC verification");
    return res.status(401).json({ error: "Missing raw body" });
  }
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    logger.warn("Invalid webhook signature");
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}

export default () => {
  const router = express.Router();

  if (config.env !== "production") {
    router.post("/", (_req, res) => res.status(403).json({ error: "WhatsApp webhooks only available in production" }));
    return router;
  }

  /**
   * Webhook pour recevoir les événements WhatsApp de Brevo
   *
   * Brevo Conversations envoie deux formats :
   * 1. "conversationFragment" — messages entrants (réponses utilisateur via WhatsApp)
   * 2. Événements de statut (delivered, read, failed)
   * 3. Format legacy "inbound"
   */
  router.post("/", rateLimitMiddleware, verifyBrevoSignature, async (req, res) => {
    try {
      const body = req.body;
      const eventName = body.eventName || body.event;

      logger.info({ eventName }, "Received WhatsApp webhook event");

      if (eventName === "conversationFragment") {
        const parsed = zConversationFragmentBody.safeParse(body);
        if (!parsed.success) {
          logger.warn({ errors: parsed.error.flatten() }, "Invalid conversationFragment payload");
          return res.json({ success: true });
        }

        const { messages, visitor } = parsed.data;

        if (!messages?.length || !visitor) {
          logger.warn("conversationFragment missing messages or visitor");
          return res.json({ success: true });
        }

        const visitorMessages = messages.filter((m) => m.type === "visitor" && m.receivedFrom === "whatsapp" && m.text);

        if (visitorMessages.length === 0) {
          logger.debug("No visitor WhatsApp messages in conversationFragment");
          return res.json({ success: true });
        }

        const rawPhone = visitor.sourceConversationRef;
        if (!rawPhone) {
          logger.warn("Missing sourceConversationRef in visitor");
          return res.json({ success: true });
        }
        const phoneNumber = rawPhone.startsWith("+") ? rawPhone : `+${rawPhone}`;
        const visitorId = visitor.id;

        for (const msg of visitorMessages) {
          const userText = extractUserResponseText(msg.text!);
          const brevoMessageId = msg.sourceMessageId || msg.id;

          if (userText) {
            logger.info(
              { phoneNumber: maskPhone(phoneNumber), brevoMessageId, visitorId },
              "Processing inbound WhatsApp message from Conversations webhook"
            );
            await handleInboundWhatsAppMessage(phoneNumber, userText, brevoMessageId, visitorId);
          }
        }

        return res.json({ success: true });
      }

      const statusParsed = zStatusEventBody.safeParse(body);
      if (statusParsed.success) {
        const { event: statusEvent, messageId } = statusParsed.data;
        if (messageId) {
          await updateMessageStatus(messageId, statusEvent);
        }
        return res.json({ success: true });
      }

      if (body.event === "inbound") {
        const inboundParsed = zInboundEventBody.safeParse(body);
        if (!inboundParsed.success) {
          logger.warn({ errors: inboundParsed.error.flatten() }, "Invalid inbound payload");
          return res.json({ success: true });
        }

        const phoneNumber = inboundParsed.data.contact?.phone;
        const text = inboundParsed.data.message?.text;
        const brevoMessageId = inboundParsed.data.message?.id;

        if (phoneNumber && text) {
          await handleInboundWhatsAppMessage(phoneNumber, text, brevoMessageId);
        } else {
          logger.warn("Inbound message missing phone or text");
        }
        return res.json({ success: true });
      }

      logger.debug({ eventName }, "Unhandled WhatsApp webhook event");
      return res.json({ success: true });
    } catch (error: any) {
      logger.error(
        { error: error.message, eventName: req.body?.eventName || req.body?.event },
        "Error processing WhatsApp webhook"
      );
      captureException(error);
      return res.json({ success: false, error: "Internal processing error" });
    }
  });

  return router;
};
