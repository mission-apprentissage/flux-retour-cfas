import brevo, { ContactsApiApiKeys, TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";
import { captureException } from "@sentry/node";
import Boom from "boom";

import config from "@/config";

const initEmailApi = () => {
  const apiEmailInstance = new brevo.TransactionalEmailsApi();
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    throw Boom.internal("Brevo API key not set");
  }
  apiEmailInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return apiEmailInstance;
};

const initContactApi = () => {
  const apiContactInstance = new brevo.ContactsApi();
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    throw Boom.internal("Brevo API key not set");
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
    captureException(new Error(`Brevo sendTransactionalEmail error: ${e}`));
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
    captureException(new Error(`Brevo getContactDetails error: ${e}`));
    return;
  }
};
