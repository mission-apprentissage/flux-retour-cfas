import { mailer } from "../../services.js";
import { v4 as uuidv4 } from "uuid";
import logger from "../logger.js";
import { usersMigrationDb } from "../model/collections.js";
import { getEmailInfos, TemplateName, TemplatePayloads } from "../services/mailer/mailer.js";
import { generateHtml } from "../utils/emailsUtils.js";

function addEmail(userEmail: string, token: string, templateName: string, payload: any) {
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

export async function renderEmail(token: string) {
  const user: any = await usersMigrationDb().findOne({ "emails.token": token });
  const { templateName, payload } = user.emails.find((e) => e.token === token);
  return generateHtml(user.email, getEmailInfos(templateName as TemplateName, payload));
}

export async function checkIfEmailExists(token) {
  const count = await usersMigrationDb().countDocuments({ "emails.token": token });
  return count > 0;
}

// version intermédiaire qui prend le template en paramètre (constuit et vérifié au préalable avec TS)
export async function sendStoredEmail<T extends TemplateName>(
  recipient: string,
  templateName: T,
  payload: TemplatePayloads[T],
  template: any
): Promise<void> {
  const emailToken = uuidv4();
  try {
    template.data.token = emailToken;
    await addEmail(recipient, emailToken, templateName, payload);
    const messageId = await mailer.sendEmailMessage(recipient, template);
    await addEmailMessageId(emailToken, messageId);
  } catch (err: any) {
    logger.error({ err, template: templateName }, "error sending email");
    await addEmailError(emailToken, err);
  }
}
