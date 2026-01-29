import { captureException } from "@sentry/node";
import { v4 as uuidv4 } from "uuid";

import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";
import { getEmailInfos, SendEmailOptions, TemplateName, TemplatePayloads } from "@/common/services/mailer/mailer";
import { generateHtml } from "@/common/utils/emailsUtils";
import { mailer } from "@/services";

function addEmail(userEmail: string, token: string, templateName: string, payload: any) {
  return usersMigrationDb().findOneAndUpdate(
    { email: userEmail },
    {
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
    { returnDocument: "after", includeResultMetadata: true }
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
    { returnDocument: "after", includeResultMetadata: true }
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
    { returnDocument: "after", includeResultMetadata: true }
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
    { returnDocument: "after", includeResultMetadata: true }
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
    { returnDocument: "after", includeResultMetadata: true }
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
    { returnDocument: "after", includeResultMetadata: true }
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
  template: any,
  options?: SendEmailOptions
): Promise<void> {
  const emailToken = uuidv4();
  try {
    template.data.token = emailToken;
    await addEmail(recipient, emailToken, templateName, payload);
    const messageId = await mailer.sendEmailMessage(recipient, template, options);
    await addEmailMessageId(emailToken, messageId);
  } catch (err: any) {
    logger.error({ err, template: templateName }, "error sending email");
    captureException(err);
    await addEmailError(emailToken, err);
  }
}
