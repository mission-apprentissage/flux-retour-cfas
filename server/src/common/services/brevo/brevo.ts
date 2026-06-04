import brevo, { AccountApiApiKeys, ContactsApiApiKeys, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";
import { captureException } from "@sentry/node";
import Boom from "boom";
import { format } from "date-fns";

import logger from "@/common/logger";
import config from "@/config";

const initEmailApi = () => {
  const apiEmailInstance = new brevo.TransactionalEmailsApi();
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    captureException(new Error("Brevo API key not set"));
    return null;
  }
  apiEmailInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return apiEmailInstance;
};

const initContactApi = () => {
  const apiContactInstance = new brevo.ContactsApi();
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    captureException(new Error("Brevo API key not set"));
    return null;
  }
  apiContactInstance.setApiKey(ContactsApiApiKeys.apiKey, apiKey);
  return apiContactInstance;
};

const EmailInstance: brevo.TransactionalEmailsApi | null = initEmailApi();
const ContactInstance: brevo.ContactsApi | null = initContactApi();

export interface SendTransactionalEmailOptions {
  cc?: string[];
  /**
   * Hors production, redirige l'email vers cette adresse (l'utilisateur connecté qui teste) au lieu
   * du vrai destinataire. Permet de tester les envois (ex. invitation CFA via impersonation d'une ML)
   * sans écrire aux vrais destinataires. Sans aucun effet en production.
   */
  redirectRecipientInNonProdTo?: string;
}

export const sendTransactionalEmail = async (
  recipientEmail: string,
  templateId: number,
  params?: Record<string, unknown>,
  options?: SendTransactionalEmailOptions
) => {
  if (!EmailInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  // Par défaut les variables du template proviennent de la fiche contact Brevo du destinataire
  // (cas des campagnes ML → jeunes). Quand `params` est fourni, on les passe directement : utile
  // lorsque le destinataire n'est pas un contact Brevo (ex. le directeur d'un CFA invité par une ML).
  const emailParams = params ?? (await getContactDetails(recipientEmail));

  if (!emailParams) {
    throw Boom.internal("No Brevo attributes found");
  }

  // Garde-fou hors production : on n'écrit jamais au vrai destinataire mais à l'utilisateur qui teste.
  const redirectTo = config.env !== "production" ? options?.redirectRecipientInNonProdTo : undefined;
  const finalRecipient = redirectTo || recipientEmail;
  const isRedirected = finalRecipient !== recipientEmail;

  if (isRedirected) {
    logger.info(
      { templateId, realRecipient: recipientEmail, redirectedTo: finalRecipient, env: config.env },
      "Email Brevo redirigé vers l'utilisateur de test (hors production)"
    );
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.to = [{ email: finalRecipient }];
  // En mode redirigé, on expose le vrai destinataire dans les variables pour information du testeur.
  sendSmtpEmail.params = isRedirected
    ? { ...(emailParams as Record<string, unknown>), DESTINATAIRE_REEL: recipientEmail }
    : emailParams;
  // Pas de CC quand l'email est redirigé (le testeur est déjà le destinataire principal).
  if (options?.cc?.length && !isRedirected) {
    sendSmtpEmail.cc = options.cc.map((email) => ({ email }));
  }
  try {
    return await EmailInstance.sendTransacEmail(sendSmtpEmail);
  } catch (e) {
    captureException(e);
    return;
  }
};

export const getContactDetails = async (email: string) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }
  try {
    return (await ContactInstance.getContactInfo(email)).body.attributes;
  } catch (e) {
    captureException(e);
    return;
  }
};

export const importContacts = async (
  listeId: number,
  contacts: Array<{
    email: string;
    prenom: string;
    nom: string;
    urls?: Record<string, string> | null;
    telephone?: string | null;
    nom_organisme?: string | null;
    mission_locale_id: string;
    nom_mission_locale: string;
    date_de_naissance?: Date | null;
    date_derniere_rupture?: Date | null;
  }>
) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const contactImport = new brevo.RequestContactImport();
  contactImport.listIds = [listeId];

  const contactList = contacts.map((contact) => {
    const contactData = new brevo.RequestContactImportJsonBodyInner();
    contactData.email = contact.email;
    contactData.attributes = {
      PRENOM: contact.prenom,
      NOM: contact.nom,
      ...contact.urls,
      TELEPHONE: contact.telephone,
      NOM_ORGANISME: contact.nom_organisme,
      MISSION_LOCALE_ID: contact.mission_locale_id,
      MISSION_LOCALE: contact.nom_mission_locale,
      DATE_DE_NAISSANCE: contact.date_de_naissance && format(contact.date_de_naissance, "yyyy-MM-dd"),
      DATE_DERNIERE_RUPTURE: contact.date_derniere_rupture && format(contact.date_derniere_rupture, "yyyy-MM-dd"),
    };
    return contactData;
  });
  contactImport.jsonBody = contactList;

  try {
    return await ContactInstance.importContacts(contactImport);
  } catch (e) {
    captureException(e);
    return;
  }
};

export const removeAllContactFromList = async (listeId: number) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const contactList = new brevo.RemoveContactFromList();
  contactList.all = true;

  try {
    return await ContactInstance.removeContactFromList(listeId, contactList);
  } catch (e) {
    captureException(e);
    return;
  }
};

export const createContactList = async (missionLocaleName: string) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0"); // getMonth() is zero-based
  const ddmm = day + month;

  const contactList = new brevo.CreateList();
  contactList.name = `${ddmm} -  ${config.env} Rupturant - ${missionLocaleName}`;
  contactList.folderId = 5; // Folder TBA
  try {
    return await ContactInstance.createList(contactList);
  } catch (e) {
    captureException(e);
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
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }
  if (Object.keys(schema).length === 0) return report;

  let existing: Array<{ name?: string; category?: string; type?: string }> = [];
  try {
    const res = await ContactInstance.getAttributes();
    existing = ((res?.body as any)?.attributes ?? []) as typeof existing;
  } catch (e: any) {
    captureException(e);
    const brevoMsg = e?.response?.body?.message ?? e?.message ?? "unknown error";
    throw new Error(`Brevo API error when listing attributes: ${brevoMsg}`);
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
        captureException(
          new Error(`Brevo attribute exists as "${found.name}" but code uses "${name}". Consider aligning the casing.`)
        );
      }
      if (found.type && found.type !== type) {
        report.conflicts.push({ name, existingType: found.type, expectedType: type });
        captureException(
          new Error(
            `Brevo attribute "${name}" exists with type "${found.type}" but code expects "${type}". Update Brevo manually or rename the code attribute.`
          )
        );
      }
      continue;
    }
    const attr = new brevo.CreateAttribute();
    attr.type = type as any;
    try {
      await ContactInstance.createAttribute("normal", name, attr);
      report.created.push(name);
    } catch (e: any) {
      // Brevo répond de plusieurs façons sur un doublon (casse différente non
      // détectée par le GET, race condition). On tolère tous les signaux connus.
      const brevoCode = e?.response?.body?.code;
      const brevoMsg = e?.response?.body?.message ?? "";
      const isDuplicate =
        brevoCode === "duplicate_parameter" ||
        brevoCode === "unique_attribute_name" ||
        /must be unique|already exist/i.test(brevoMsg);
      if (isDuplicate) {
        report.skipped.push(name);
        continue;
      }
      captureException(e);
      const status = e?.response?.statusCode ?? e?.statusCode ?? "?";
      throw new Error(
        `Brevo API error [${status}] when creating attribute "${name}" (${type}): ${brevoMsg || e?.message || "unknown error"}`
      );
    }
  }
  return report;
};

export const createBrevoList = async (params: { name: string; folderId: number }) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const contactList = new brevo.CreateList();
  contactList.name = params.name;
  contactList.folderId = params.folderId;
  try {
    return await ContactInstance.createList(contactList);
  } catch (e: any) {
    captureException(e);
    // Propage le message Brevo réel (folderId invalide, clé API erronée, quota, …).
    const brevoBody = e?.response?.body ?? e?.body;
    const brevoMsg = brevoBody?.message ?? brevoBody?.code ?? e?.message ?? "unknown error";
    const status = e?.response?.statusCode ?? e?.statusCode ?? "?";
    throw new Error(
      `Brevo API error [${status}] when creating list "${params.name}" (folderId=${params.folderId}): ${brevoMsg}`
    );
  }
};

export const importContactsToBrevoList = async (listeId: number, contacts: BrevoContact[]) => {
  if (!ContactInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }
  if (contacts.length === 0) {
    return [];
  }

  const results: Array<Awaited<ReturnType<NonNullable<typeof ContactInstance>["importContacts"]>> | undefined> = [];

  for (let i = 0; i < contacts.length; i += BREVO_IMPORT_BATCH_SIZE) {
    const batch = contacts.slice(i, i + BREVO_IMPORT_BATCH_SIZE);

    const contactImport = new brevo.RequestContactImport();
    contactImport.listIds = [listeId];
    contactImport.jsonBody = batch.map((contact) => {
      const contactData = new brevo.RequestContactImportJsonBodyInner();
      contactData.email = contact.email;
      contactData.attributes = serializeBrevoAttributes(contact.attributes);
      return contactData;
    });

    try {
      results.push(await ContactInstance.importContacts(contactImport));
    } catch (e) {
      captureException(e);
      results.push(undefined);
    }
  }

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
const briefError = (e: unknown): string => {
  const err = e as { response?: { body?: { message?: string }; statusCode?: number }; message?: string };
  return err?.response?.body?.message ?? err?.message ?? "erreur inconnue";
};

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
      const accountApi = new brevo.AccountApi();
      accountApi.setApiKey(AccountApiApiKeys.apiKey, apiKey);
      const { body } = await accountApi.getAccount();
      apiKeyCheck = {
        configured: true,
        ok: true,
        label: "Clé API Brevo",
        detail: `Connectée — ${body.companyName ?? body.email ?? "compte sans nom"}`,
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
      const { body } = await ContactInstance!.getList(listId);
      listCheck = {
        configured: true,
        ok: true,
        label: "Liste cible tba-contacts",
        detail: `Liste #${listId} « ${body.name ?? "(sans nom)"} » accessible`,
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
