import { randomUUID } from "node:crypto";

import { captureException } from "@sentry/node";
import Boom from "boom";

import logger from "@/common/logger";
import { usersMigrationDb } from "@/common/model/collections";
import {
  EmailTemplate,
  getEmailInfos,
  SendEmailOptions,
  TemplateName,
  TemplatePayloads,
} from "@/common/services/mailer/mailer";
import { generateHtml } from "@/common/utils/emailsUtils";
import { getErrorMessage } from "@/common/utils/errorUtils";
import { mailer } from "@/services";

function addEmail(userEmail: string, token: string, templateName: string, payload: unknown) {
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

function addEmailMessageId(token: string, messageId: string) {
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

function addEmailError(token: string, e: unknown) {
  return usersMigrationDb().findOneAndUpdate(
    { "emails.token": token },
    {
      $set: {
        "emails.$.error": {
          type: "fatal",
          message: getErrorMessage(e),
        },
      },
    },
    { returnDocument: "after" }
  );
}

export async function markEmailAsDelivered(messageId: string) {
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

export async function markEmailAsFailed(messageId: string, type: string) {
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

export async function markEmailAsOpened(token: string) {
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

export async function unsubscribeUser(id: string) {
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
  const user = await usersMigrationDb().findOne({ "emails.token": token });
  const email = user?.emails?.find((e) => e.token === token);
  if (!user || !email) {
    throw Boom.notFound("Email introuvable");
  }
  const { templateName, payload } = email;
  return generateHtml(
    user.email,
    getEmailInfos(templateName as TemplateName, payload as TemplatePayloads[TemplateName])
  );
}

export async function checkIfEmailExists(token: string) {
  const count = await usersMigrationDb().countDocuments({ "emails.token": token });
  return count > 0;
}

// version intermédiaire qui prend le template en paramètre (constuit et vérifié au préalable avec TS)
export async function sendStoredEmail<T extends TemplateName>(
  recipient: string,
  templateName: T,
  payload: TemplatePayloads[T],
  template: EmailTemplate<T>,
  options?: SendEmailOptions
): Promise<void> {
  const emailToken = randomUUID();
  try {
    template.data.token = emailToken;
    await addEmail(recipient, emailToken, templateName, payload);
    const messageId = await mailer.sendEmailMessage(recipient, template, options);
    await addEmailMessageId(emailToken, messageId);
  } catch (err) {
    logger.error({ err, template: templateName }, "error sending email");
    captureException(err);
    await addEmailError(emailToken, err);
  }
}
