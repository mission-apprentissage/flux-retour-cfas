import { type Brevo, BrevoClient, BrevoError } from "@getbrevo/brevo";
import * as Boom from "@hapi/boom";
import { captureException } from "@sentry/node";
import { format } from "date-fns";

import logger from "@/common/logger";
import { reportConfigurationIssueOnce } from "@/common/services/sentry/reportOnce";
import { createErrorAggregator } from "@/common/utils/errorAggregator";
import config from "@/config";

const initClient = () => {
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    reportConfigurationIssueOnce("brevo.apiKey", "Brevo API key not set");
    return null;
  }
  return new BrevoClient({ apiKey, maxRetries: 0 });
};

const client: BrevoClient | null = initClient();

export interface SendTransactionalEmailOptions {
  cc?: string[];
  /**
   * Hors production, redirige l'email vers cette adresse au lieu du vrai destinataire ; sans effet
   * en production. Obligatoire : la même clé Brevo joint l'API depuis tous les environnements, donc
   * rien n'empêche structurellement un envoi réel. Une valeur vide, ou hors beta.gouv.fr, bloque
   * l'envoi hors production.
   */
  redirectRecipientInNonProdTo: string | undefined;
}

/** Corps des erreurs renvoyées par l'API Brevo : il porte la vraie cause. */
type BrevoErrorBody = { message?: string; code?: string };

const brevoErrorBody = (error: unknown): BrevoErrorBody | undefined =>
  error instanceof BrevoError && typeof error.body === "object" && error.body !== null
    ? (error.body as BrevoErrorBody)
    : undefined;

const brevoErrorStatus = (error: unknown): number | "?" =>
  (error instanceof BrevoError ? error.statusCode : undefined) ?? "?";

const errorMessage = (error: unknown): string | undefined => (error instanceof Error ? error.message : undefined);

const DOMAINE_AUTORISE_HORS_PRODUCTION = "beta.gouv.fr";

const estAutoriseeHorsProduction = (email: string) => {
  const domaine = email.trim().toLowerCase().split("@")[1] ?? "";
  return domaine === DOMAINE_AUTORISE_HORS_PRODUCTION || domaine.endsWith(`.${DOMAINE_AUTORISE_HORS_PRODUCTION}`);
};

export const sendTransactionalEmail = async (
  recipientEmail: string,
  templateId: number,
  params: Record<string, unknown>,
  options: SendTransactionalEmailOptions
) => {
  if (!client) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const isProduction = config.env === "production";

  // Sans adresse de repli hors production : mieux vaut un email manquant qu'un email parti au CFA.
  const redirectTo = isProduction ? undefined : options.redirectRecipientInNonProdTo;
  if (!isProduction && !redirectTo) {
    logger.warn(
      { templateId, realRecipient: recipientEmail, env: config.env },
      "Email Brevo non envoyé : aucune adresse de redirection fournie hors production"
    );
    return;
  }
  if (redirectTo && !estAutoriseeHorsProduction(redirectTo)) {
    logger.warn(
      { templateId, realRecipient: recipientEmail, redirectTo, env: config.env },
      `Email Brevo non envoyé : adresse de redirection hors ${DOMAINE_AUTORISE_HORS_PRODUCTION} hors production`
    );
    return;
  }

  const finalRecipient = redirectTo || recipientEmail;
  const isRedirected = finalRecipient !== recipientEmail;

  if (isRedirected) {
    logger.info(
      { templateId, realRecipient: recipientEmail, redirectedTo: finalRecipient, env: config.env },
      "Email Brevo redirigé vers l'utilisateur de test (hors production)"
    );
  }

  const sendSmtpEmail: Brevo.SendTransacEmailRequest = {
    templateId,
    to: [{ email: finalRecipient }],
    // En mode redirigé, on expose le vrai destinataire dans les variables pour information du testeur.
    params: isRedirected ? { ...params, DESTINATAIRE_REEL: recipientEmail } : params,
  };
  // Pas de CC quand l'email est redirigé (le testeur est déjà le destinataire principal).
  if (options?.cc?.length && !isRedirected) {
    sendSmtpEmail.cc = options.cc.map((email) => ({ email }));
  }
  try {
    return await client.transactionalEmails.sendTransacEmail(sendSmtpEmail);
  } catch (e) {
    captureException(e);
    // Sans ce log, l'appelant ne voit qu'un `undefined` : la cause renvoyée par Brevo (template
    // inexistant, IP non autorisée, quota...) serait perdue dès que Sentry n'est pas actif.
    const brevoBody = brevoErrorBody(e);
    const brevoMsg = brevoBody?.message ?? brevoBody?.code ?? errorMessage(e) ?? "unknown error";
    const status = brevoErrorStatus(e);
    logger.error(
      { templateId, recipient: finalRecipient, status, brevoMsg },
      "Échec d'envoi de l'email transactionnel Brevo"
    );
    return;
  }
};

const BREVO_IMPORT_BATCH_SIZE = 500;

export type BrevoContactAttributeValue = string | number | boolean | Date | null | undefined;
export type BrevoContactAttributes = Record<string, BrevoContactAttributeValue>;
export type BrevoContact = {
  email: string;
  attributes: BrevoContactAttributes;
};

// Sérialise pour l'API Brevo : `Date` → "yyyy-MM-dd", `undefined` retiré
// (préserve la valeur existante côté Brevo), `null` conservé (écrase).
export const serializeBrevoAttributes = (attributes: BrevoContactAttributes): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined) continue;
    out[key] = value instanceof Date ? format(value, "yyyy-MM-dd") : value;
  }
  return out;
};

export type BrevoAttributeType = "text" | "float" | "boolean" | "date";

export type EnsureBrevoAttributesReport = {
  created: string[];
  skipped: string[];
  conflicts: Array<{ name: string; existingType: string; expectedType: string }>;
  casingMismatches: Array<{ codeName: string; brevoName: string }>;
};

/**
 * Crée côté Brevo les attributs manquants du schéma. Ne modifie jamais un
 * attribut existant avec un type différent : signale le conflit dans le
 * rapport, l'admin doit aligner manuellement.
 */
export const ensureBrevoAttributes = async (
  schema: Record<string, BrevoAttributeType>
): Promise<EnsureBrevoAttributesReport> => {
  const report: EnsureBrevoAttributesReport = {
    created: [],
    skipped: [],
    conflicts: [],
    casingMismatches: [],
  };
  if (!client) {
    throw Boom.internal("Brevo instance not initialized");
  }
  if (Object.keys(schema).length === 0) return report;

  let existing: Array<{ name?: string; category?: string; type?: string }> = [];
  try {
    const res = await client.contacts.getAttributes();
    existing = res?.attributes ?? [];
  } catch (error) {
    const brevoMsg = brevoErrorBody(error)?.message ?? errorMessage(error) ?? "unknown error";
    throw new Error(`Brevo API error when listing attributes: ${brevoMsg}`, { cause: error });
  }
  const existingByLowerName = new Map(
    existing.filter((a) => a.category === "normal" && a.name).map((a) => [(a.name as string).toLowerCase(), a])
  );

  for (const [name, type] of Object.entries(schema)) {
    const found = existingByLowerName.get(name.toLowerCase());
    if (found) {
      report.skipped.push(name);
      if (found.name && found.name !== name) {
        report.casingMismatches.push({ codeName: name, brevoName: found.name });
      }
      if (found.type && found.type !== type) {
        report.conflicts.push({ name, existingType: found.type, expectedType: type });
      }
      continue;
    }
    try {
      await client.contacts.createAttribute({ attributeCategory: "normal", attributeName: name, type });
      report.created.push(name);
    } catch (error) {
      // Brevo répond de plusieurs façons sur un doublon (casse différente non
      // détectée par le GET, race condition). On tolère tous les signaux connus.
      const brevoBody = brevoErrorBody(error);
      const brevoCode = brevoBody?.code;
      const brevoMsg = brevoBody?.message ?? "";
      const isDuplicate =
        brevoCode === "duplicate_parameter" ||
        brevoCode === "unique_attribute_name" ||
        /must be unique|already exist/i.test(brevoMsg);
      if (isDuplicate) {
        report.skipped.push(name);
        continue;
      }
      const status = brevoErrorStatus(error);
      throw new Error(
        `Brevo API error [${status}] when creating attribute "${name}" (${type}): ${brevoMsg || errorMessage(error) || "unknown error"}`,
        { cause: error }
      );
    }
  }
  return report;
};

export const createBrevoList = async (params: { name: string; folderId: number }) => {
  if (!client) {
    throw Boom.internal("Brevo instance not initialized");
  }

  try {
    return await client.contacts.createList({ name: params.name, folderId: params.folderId });
  } catch (error) {
    // Propage le message Brevo réel (folderId invalide, clé API erronée, quota, …).
    const brevoBody = brevoErrorBody(error);
    const brevoMsg = brevoBody?.message ?? brevoBody?.code ?? errorMessage(error) ?? "unknown error";
    const status = brevoErrorStatus(error);
    throw new Error(
      `Brevo API error [${status}] when creating list "${params.name}" (folderId=${params.folderId}): ${brevoMsg}`
    );
  }
};

export const importContactsToBrevoList = async (listeId: number, contacts: BrevoContact[]) => {
  if (!client) {
    throw Boom.internal("Brevo instance not initialized");
  }
  if (contacts.length === 0) {
    return [];
  }

  const results: Array<Brevo.ImportContactsResponse | undefined> = [];
  const errors = createErrorAggregator("brevo-import-contacts");

  for (let i = 0; i < contacts.length; i += BREVO_IMPORT_BATCH_SIZE) {
    const batch = contacts.slice(i, i + BREVO_IMPORT_BATCH_SIZE);

    try {
      results.push(
        await client.contacts.importContacts({
          listIds: [listeId],
          jsonBody: batch.map((contact) => ({
            email: contact.email,
            attributes: serializeBrevoAttributes(contact.attributes),
          })),
          emailBlacklist: false,
          disableNotification: false,
          smsBlacklist: false,
          updateExistingContacts: true,
          emptyContactsAttributes: false,
        })
      );
      errors.ok();
    } catch (e) {
      logger.error({ err: e, listeId }, "Échec d'import d'un lot de contacts Brevo");
      errors.record(e);
      results.push(undefined);
    }
  }

  errors.flush();
  return results;
};

export type BrevoHealthCheck = {
  configured: boolean;
  ok: boolean;
  label: string;
  detail: string;
};

export type BrevoHealthReport = {
  apiKey: BrevoHealthCheck;
  tbaContactsList: BrevoHealthCheck;
};

// Helper interne : message court (3 lignes max) à partir d'une erreur Brevo.
const briefError = (e: unknown): string => brevoErrorBody(e)?.message ?? errorMessage(e) ?? "erreur inconnue";

/**
 * Health-check pour le panneau admin : vérifie que la clé API Brevo et la liste
 * cible TBA sont configurées et joignables. N'écrit jamais côté Brevo.
 */
export const checkBrevoHealth = async (): Promise<BrevoHealthReport> => {
  const apiKey = config.brevo.apiKey;
  const listId = config.brevo.tbaContactsListId;

  // --- 1. Clé API : configurée + accessible (ping /account)
  let apiKeyCheck: BrevoHealthCheck;
  if (!apiKey) {
    apiKeyCheck = {
      configured: false,
      ok: false,
      label: "Clé API Brevo",
      detail: "MNA_TDB_BREVO_API_KEY non définie",
    };
  } else {
    try {
      const account = await new BrevoClient({ apiKey, maxRetries: 0 }).account.getAccount();
      apiKeyCheck = {
        configured: true,
        ok: true,
        label: "Clé API Brevo",
        detail: `Connectée — ${account.companyName ?? account.email ?? "compte sans nom"}`,
      };
    } catch (e) {
      apiKeyCheck = {
        configured: true,
        ok: false,
        label: "Clé API Brevo",
        detail: `Inaccessible (${briefError(e)})`,
      };
    }
  }

  // --- 2. Liste TBA : configurée + accessible. Non configurée = warning (la
  // sync créera la liste auto), pas une erreur bloquante.
  let listCheck: BrevoHealthCheck;
  if (listId === undefined) {
    listCheck = {
      configured: false,
      ok: false,
      label: "Liste cible tba-contacts",
      detail: "MNA_TDB_BREVO_LIST_ID_TBA_CONTACTS non définie — une nouvelle liste sera créée à la 1ʳᵉ sync",
    };
  } else if (!apiKey) {
    listCheck = {
      configured: true,
      ok: false,
      label: "Liste cible tba-contacts",
      detail: `Liste #${listId} configurée mais non vérifiable (pas de clé API)`,
    };
  } else {
    try {
      const list = await client!.contacts.getList({ listId });
      listCheck = {
        configured: true,
        ok: true,
        label: "Liste cible tba-contacts",
        detail: `Liste #${listId} « ${list.name ?? "(sans nom)"} » accessible`,
      };
    } catch (e) {
      listCheck = {
        configured: true,
        ok: false,
        label: "Liste cible tba-contacts",
        detail: `Liste #${listId} introuvable (${briefError(e)})`,
      };
    }
  }

  return { apiKey: apiKeyCheck, tbaContactsList: listCheck };
};

// Identifiants d'un contact côté Brevo pour l'API Events (au moins un requis).
export type BrevoEventIdentifiers = {
  emailId?: string;
  extId?: string;
  phoneId?: string;
};

export type BrevoEventPayload = {
  eventName: string;
  identifiers: BrevoEventIdentifiers;
  eventDate?: string;
  contactProperties?: Record<string, unknown>;
  eventProperties?: Record<string, unknown>;
};

/**
 * Émet un événement vers l'API Events de Brevo (`POST /v3/events`) pour déclencher
 * des scénarios d'automation. Throw en cas d'erreur Brevo (message explicite) afin
 * que le job appelant puisse retry — l'`enqueue` en amont, lui, ne throw jamais.
 */
export const sendBrevoEvent = async (payload: BrevoEventPayload) => {
  if (!client) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const event: Brevo.CreateEventRequest = {
    event_name: payload.eventName,
    identifiers: {
      email_id: payload.identifiers.emailId,
      ext_id: payload.identifiers.extId,
      phone_id: payload.identifiers.phoneId,
    },
  };
  if (payload.eventDate) event.event_date = payload.eventDate;
  if (payload.contactProperties)
    event.contact_properties = payload.contactProperties as Brevo.CreateEventRequest["contact_properties"];
  if (payload.eventProperties)
    event.event_properties = payload.eventProperties as Brevo.CreateEventRequest["event_properties"];

  try {
    return await client.event.createEvent(event);
  } catch (error) {
    const brevoBody = brevoErrorBody(error);
    const brevoMsg = brevoBody?.message ?? brevoBody?.code ?? errorMessage(error) ?? "unknown error";
    const status = brevoErrorStatus(error);
    throw new Error(`Brevo API error [${status}] when creating event "${payload.eventName}": ${brevoMsg}`);
  }
};
