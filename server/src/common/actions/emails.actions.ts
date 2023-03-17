import { v4 as uuidv4 } from "uuid";
import { usersMigrationDb } from "../model/collections.js";
import { generateHtml } from "../utils/emailsUtils.js";

function addEmail(userEmail, token, templateName, payload) {
  return usersMigrationDb().findOneAndUpdate(
    { email: userEmail },
    {
      // @ts-ignore
      $push: {
        emails: {
          token,
          templateName,
          payload,
          sendDates: [new Date()],
        },
      },
    },
    { returnDocument: "after" }
  );
}

function addEmailMessageId(token, messageId) {
  return usersMigrationDb().findOneAndUpdate(
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

function addEmailError(token, e) {
  return usersMigrationDb().findOneAndUpdate(
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

function addEmailSendDate(token, templateName) {
  return usersMigrationDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.templateName": templateName,
      },
      // @ts-ignore
      $push: {
        "emails.$.sendDates": new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function markEmailAsDelivered(messageId) {
  return usersMigrationDb().findOneAndUpdate(
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
  return usersMigrationDb().findOneAndUpdate(
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
  return usersMigrationDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.openDate": new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function unsubscribeUser(id) {
  return usersMigrationDb().findOneAndUpdate(
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
  /** @type {any} */
  const user = await usersMigrationDb().findOne({ "emails.token": token });
  const { templateName, payload } = user.emails.find((e) => e.token === token);
  const template = templates[templateName]({ to: user.email, payload }, token);

  return generateHtml(user.email, template);
}

export async function checkIfEmailExists(token) {
  const count = await usersMigrationDb().countDocuments({ "emails.token": token });
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
        await addEmail(to, token, templateName, payload);
        const messageId = await mailerService.sendEmailMessage(to, template);
        await addEmailMessageId(token, messageId);
      } catch (e: any) {
        console.error(`Error sending email template "${templateName}"`, e);
        await addEmailError(token, e);
      }

      return token;
    },
    async resendEmail(token, options: any = {}) {
      const user = await usersMigrationDb().findOne({ "emails.token": token });
      if (!user) {
        throw new Error("user not found");
      }
      const previous = user.emails.find((e) => e.token === token);

      const nextTemplateName = options.newTemplateName || previous.templateName;
      const template = mailerService.templates[nextTemplateName](user, token, { resend: !options.retry });

      try {
        await addEmailSendDate(token, nextTemplateName);
        const messageId = await mailerService.sendEmailMessage(user.email, template);
        await addEmailMessageId(token, messageId);
      } catch (e: any) {
        console.error(`Error resending email with token "${token}"`, e);
        await addEmailError(token, e);
      }

      return token;
    },
    templates: mailerService.templates,
  };
};
