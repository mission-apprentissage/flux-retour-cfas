import brevo, { ContactsApiApiKeys, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";
import { captureException } from "@sentry/node";
import Boom from "boom";

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

export const sendTransactionalEmail = async (recipientEmail: string, templateId: number) => {
  if (!EmailInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }

  const brevoAttributes = await getContactDetails(recipientEmail);

  if (!brevoAttributes) {
    throw Boom.internal("No Brevo attributes found");
  }

  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.to = [{ email: recipientEmail }];
  sendSmtpEmail.params = brevoAttributes;
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
