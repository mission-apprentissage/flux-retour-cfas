import { v4 as uuidv4 } from "uuid";
import { usersDb } from "../model/collections.js";
import { generateHtml } from "../utils/emailsUtils.js";

export function addEmail(userEmail, token, templateName) {
  return usersDb().findOneAndUpdate(
    { email: userEmail },
    {
      $push: {
        emails: {
          token,
          templateName,
          sendDates: [new Date()],
        },
      },
    },
    { returnDocument: "after" }
  );
}

export function addEmailMessageId(token, messageId) {
  return usersDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $addToSet: {
        "emails.$.messageIds": messageId,
      },
      $unset: {
        "emails.$.error": 1,
      },
    },
    { returnDocument: "after" }
  );
}

export function addEmailError(token, e) {
  return usersDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.error": {
          type: "fatal",
          message: e.message,
        },
      },
    },
    { returnDocument: "after" }
  );
}

export function addEmailSendDate(token, templateName) {
  return usersDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.templateName": templateName,
      },
      $push: {
        "emails.$.sendDates": new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function markEmailAsDelivered(messageId) {
  return usersDb().findOneAndUpdate(
    { "emails.messageIds": messageId },
    {
      $unset: {
        "emails.$.error": 1,
      },
    },
    { returnDocument: "after" }
  );
}

export async function markEmailAsFailed(messageId, type) {
  return usersDb().findOneAndUpdate(
    { "emails.messageIds": messageId },
    {
      $set: {
        "emails.$.error": {
          type,
        },
      },
    },
    { returnDocument: "after" }
  );
}

export async function markEmailAsOpened(token) {
  return usersDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.openDate": new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function cancelUnsubscription(email) {
  return usersDb().findOneAndUpdate(
    { email },
    {
      $set: {
        unsubscribe: false,
      },
    },
    { returnDocument: "after" }
  );
}

export async function unsubscribeUser(id) {
  return usersDb().findOneAndUpdate(
    { $or: [{ email: id }, { "emails.token": id }] },
    {
      $set: {
        unsubscribe: true,
      },
    },
    { returnDocument: "after" }
  );
}

export async function renderEmail({ templates }, token) {
  const user = await usersDb().findOne({ "emails.token": token });
  const { templateName } = user.emails.find((e) => e.token === token);
  const template = templates[templateName](user, token);

  return generateHtml(user.email, template);
}

export async function checkIfEmailExists(token) {
  const count = await usersDb().countDocuments({ "emails.token": token });
  return count > 0;
}

//Ces actions sont construites à la volée car il est nécessaire de pouvoir injecter un mailer durant les tests
export const createMailer = (mailerService) => {
  return {
    async sendEmail({ to, payload }, templateName) {
      const token = uuidv4();
      if (!mailerService.templates[templateName]) {
        throw new Error(`No email template found for ${templateName}`);
      }
      const template = mailerService.templates[templateName]({ to, payload }, token);

      try {
        await addEmail(to, token, templateName);
        const messageId = await mailerService.sendEmailMessage(to, template);
        await addEmailMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

      return token;
    },
    async resendEmail(token, options = {}) {
      const user = await usersDb().findOne({ "emails.token": token });
      const previous = user.emails.find((e) => e.token === token);

      const nextTemplateName = options.newTemplateName || previous.templateName;
      const template = mailerService.templates[nextTemplateName](user, token, { resend: !options.retry });

      try {
        await addEmailSendDate(token, nextTemplateName);
        const messageId = await mailerService.sendEmailMessage(user.email, template);
        await addEmailMessageId(token, messageId);
      } catch (e) {
        await addEmailError(token, e);
      }

      return token;
    },
    templates: mailerService.templates,
  };
};
