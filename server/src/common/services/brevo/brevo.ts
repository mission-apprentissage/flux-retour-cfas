import brevo, { ContactsApiApiKeys } from "@getbrevo/brevo";

import config from "@/config";

const initContactApi = () => {
  let apiInstance = new brevo.ContactsApi();
  apiInstance.setApiKey(ContactsApiApiKeys.apiKey, config.brevo.api_key);
  return apiInstance;
};

const ContactInstance: brevo.ContactsApi = initContactApi();

export const createContact = (
  listeId: number,
  email?: string | null,
  prenom?: string | null,
  nom?: string | null,
  token?: string | null,
  telephone?: string | null,
  nomOrganisme?: string | null
) => {
  const contact = new brevo.CreateContact();

  if (!email) {
    return;
  }

  contact.email = email;
  contact.attributes = {
    PRENOM: prenom,
    NOM: nom,
    TOKEN: token,
    TELEPHONE: telephone,
    NOM_ORGANISME: nomOrganisme,
  };
  contact.listIds = [listeId];
  return ContactInstance.createContact(contact);
};

//2703 - RECETTE Rupturant - Contact ML
//
