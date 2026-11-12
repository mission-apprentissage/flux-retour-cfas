import axios from "axios";
import axiosRetry from "axios-retry";

import logger from "@/common/logger";
import config from "@/config";

import { brevoErrorLogFields, describeBrevoError, reportBrevoError } from "./brevoError";
import { maskPhone } from "./phone";
import { WhatsAppSendResult, WhatsAppTemplateParams } from "./types";

const BREVO_CONVERSATIONS_API = "https://api.brevo.com/v3/conversations";
const BREVO_CONTACTS_API = "https://api.brevo.com/v3/contacts";
const BREVO_WHATSAPP_API = "https://api.brevo.com/v3/whatsapp";

const brevoClient = axios.create({ timeout: 10000 });
// Par défaut axios-retry rejoue un POST sur ECONNRESET/ETIMEDOUT : Brevo a pu envoyer le message avant la coupure.
// On ne rejoue que si la requête n'a sûrement pas été traitée.
axiosRetry(brevoClient, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => describeBrevoError(error).safeToRetry,
});

/**
 * Envoie un message WhatsApp via l'API Brevo Conversations
 */
export async function sendWhatsAppMessage(visitorId: string, message: string): Promise<WhatsAppSendResult> {
  if (!config.brevo.whatsapp?.enabled) {
    logger.info({ visitorId }, "WhatsApp is disabled, skipping message");
    return { success: false, error: "WhatsApp is disabled" };
  }

  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    logger.error("Brevo API key not configured");
    return { success: false, error: "Brevo API key not configured" };
  }

  try {
    const response = await brevoClient.post(
      `${BREVO_CONVERSATIONS_API}/messages`,
      {
        visitorId,
        text: message,
        agentEmail: "noreply@apprentissage.beta.gouv.fr",
        agentName: "Tableau de bord de l'apprentissage",
        receivedFrom: "tba-whatsapp-bot",
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      }
    );

    const messageId = response.data?.id || response.data?.messageId;
    logger.info({ visitorId, messageId }, "WhatsApp message sent successfully");

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const details = describeBrevoError(error);
    logger.error({ visitorId, ...brevoErrorLogFields(details) }, "Failed to send WhatsApp message");
    reportBrevoError("send_message", details);

    return {
      success: false,
      error: details.message,
      status: details.status,
      retryable: details.retryable,
      safeToRetry: details.safeToRetry,
    };
  }
}

/**
 * Crée ou met à jour un contact dans Brevo avec les attributs nécessaires pour le template WhatsApp
 * Les templates WhatsApp Brevo lisent les attributs du contact, pas les params de l'API
 */
export async function upsertBrevoContact(phoneNumber: string, attributes: Record<string, string>): Promise<void> {
  const apiKey = config.brevo.apiKey;
  if (!apiKey) return;

  const formattedPhone = phoneNumber.replace(/[+\s]/g, "");

  try {
    await brevoClient.post(
      BREVO_CONTACTS_API,
      {
        attributes: {
          ...attributes,
          SMS: `+${formattedPhone}`,
          WHATSAPP: `+${formattedPhone}`,
        },
        updateEnabled: true,
        ext_id: formattedPhone,
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
        // L'upsert est idempotent (`updateEnabled`) : on peut rejouer une coupure réseau, contrairement à un envoi.
        "axios-retry": { retryCondition: axiosRetry.isNetworkError },
      }
    );
    logger.debug({ phoneNumber: maskPhone(formattedPhone) }, "Brevo contact upserted");
  } catch (error) {
    // Ne pas bloquer l'envoi du template WhatsApp si l'upsert contact échoue
    const details = describeBrevoError(error, Object.values(attributes));
    logger.error(
      { phoneNumber: maskPhone(formattedPhone), ...brevoErrorLogFields(details) },
      "Failed to upsert Brevo contact — template will be sent without custom attributes"
    );
    reportBrevoError("upsert_contact", details);
  }
}

/**
 * Envoie un message WhatsApp via un template approuvé (WhatsApp Business API)
 */
export async function sendWhatsAppTemplate(
  phoneNumber: string,
  template: WhatsAppTemplateParams
): Promise<WhatsAppSendResult> {
  if (!config.brevo.whatsapp?.enabled) {
    logger.info({ phoneNumber: maskPhone(phoneNumber) }, "WhatsApp is disabled, skipping template message");
    return { success: false, error: "WhatsApp is disabled" };
  }

  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    logger.error("Brevo API key not configured");
    return { success: false, error: "Brevo API key not configured" };
  }

  const senderNumber = config.brevo.whatsapp?.senderNumber;
  if (!senderNumber) {
    logger.error("Brevo WhatsApp sender number not configured");
    return { success: false, error: "Brevo WhatsApp sender number not configured" };
  }

  try {
    // Format phone number for Brevo (remove + and spaces)
    const formattedPhone = phoneNumber.replace(/[+\s]/g, "");

    const requestBody: Record<string, unknown> = {
      senderNumber,
      contactNumbers: [formattedPhone],
      templateId: template.templateId,
    };

    if (template.params && Object.keys(template.params).length > 0) {
      requestBody.params = template.params;
    }

    logger.info(
      { phoneNumber: maskPhone(formattedPhone), templateId: template.templateId },
      "Sending WhatsApp template"
    );

    const response = await brevoClient.post(`${BREVO_WHATSAPP_API}/sendMessage`, requestBody, {
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    const messageId = response.data?.messageId || response.data?.id;
    logger.info(
      { phoneNumber: maskPhone(formattedPhone), messageId, templateId: template.templateId },
      "WhatsApp template sent successfully"
    );

    return {
      success: true,
      messageId,
    };
  } catch (error) {
    const details = describeBrevoError(error, Object.values(template.params ?? {}));
    logger.error(
      { phoneNumber: maskPhone(phoneNumber), templateId: template.templateId, ...brevoErrorLogFields(details) },
      "Failed to send WhatsApp template"
    );
    reportBrevoError("send_template", details);

    return {
      success: false,
      error: details.message,
      status: details.status,
      retryable: details.retryable,
      safeToRetry: details.safeToRetry,
    };
  }
}
