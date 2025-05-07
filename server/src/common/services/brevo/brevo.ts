import brevo, { TransactionalEmailsApiApiKeys } from "@getbrevo/brevo";
import { captureException } from "@sentry/node";
import Boom from "boom";

import config from "@/config";

const initEmailApi = () => {
  const apiInstance = new brevo.TransactionalEmailsApi();
  const apiKey = config.brevo.apiKey;
  if (!apiKey) {
    throw Boom.internal("Brevo API key not set");
  }
  apiInstance.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
  return apiInstance;
};

const EmailInstance: brevo.TransactionalEmailsApi | null = initEmailApi();

export const sendTransactionalEmail = async (
  recipientEmail: string,
  templateId: number,
  params?: Record<string, any>
) => {
  if (!EmailInstance) {
    throw Boom.internal("Brevo instance not initialized");
  }
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.templateId = templateId;
  sendSmtpEmail.to = [{ email: recipientEmail }];
  if (params) {
    sendSmtpEmail.params = params;
  }
  try {
    return await EmailInstance.sendTransacEmail(sendSmtpEmail);
  } catch (e) {
    captureException(new Error(`Brevo sendTransactionalEmail error: ${e}`));
    return;
  }
};
