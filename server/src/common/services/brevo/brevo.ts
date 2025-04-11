import brevo, { ContactsApiApiKeys } from "@getbrevo/brevo";
import { captureException } from "@sentry/node";

import config from "@/config";

const initContactApi = () => {
  let apiInstance = new brevo.ContactsApi();

  const apiKey = config.brevo.api_key;

  if (!apiKey) {
    captureException(new Error(`Init Brevo: no api key provided`));
    return null;
  }

  apiInstance.setApiKey(ContactsApiApiKeys.apiKey, config.brevo.api_key);
  return apiInstance;
};

const ContactInstance: brevo.ContactsApi | null = initContactApi();

export const createContact = (
  listeId: number,
  email?: string | null,
  prenom?: string | null,
  nom?: string | null,
  token?: string | null,
  url?: string | null,
  telephone?: string | null,
  nomOrganisme?: string | null
) => {
  if (!ContactInstance) {
    captureException(new Error(`Create contact Brevo: no instance initialized`));
    return;
  }

  const contact = new brevo.CreateContact();

  if (!email) {
    captureException(
      new Error(`Create contact Brevo: no email provided initialized`, { cause: { prenom, nom, telephone } })
    );
    return;
  }

  contact.email = email;
  contact.attributes = {
    PRENOM: prenom,
    NOM: nom,
    TOKEN: token,
    URL_TBA_ML: url,
    TELEPHONE: telephone,
    NOM_ORGANISME: nomOrganisme,
  };
  contact.listIds = [listeId];
  return ContactInstance.createContact(contact);
};

export const importContacts = async (
  listeId: number,
  contacts: Array<{
    email: string;
    prenom?: string | null;
    nom?: string | null;
    token?: string | null;
    url?: string | null;
    telephone?: string | null;
    nomOrganisme?: string | null;
  }>
) => {
  if (!ContactInstance) {
    captureException(new Error(`Create contact Brevo: no instance initialized`));
    return;
  }
  const contactImport = new brevo.RequestContactImport();
  contactImport.listIds = [listeId];

  const contactList = contacts.map((contact) => {
    const contactData = new brevo.RequestContactImportJsonBodyInner();
    contactData.email = contact.email;
    contactData.attributes = {
      PRENOM: contact.prenom,
      NOM: contact.nom,
      TOKEN: contact.token,
      URL_TBA_ML: contact.url,
      TELEPHONE: contact.telephone,
      NOM_ORGANISME: contact.nomOrganisme,
    };
    return contactData;
  });
  contactImport.jsonBody = contactList;
  try {
    return await ContactInstance.importContacts(contactImport);
  } catch (e) {
    captureException(new Error(`Brevo importContacts error: ${e}`));
    return;
  }
};
