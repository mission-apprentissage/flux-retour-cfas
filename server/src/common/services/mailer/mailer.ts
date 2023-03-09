import nodemailer from "nodemailer";
import { omit } from "lodash-es";
import { htmlToText } from "nodemailer-html-to-text";
import config from "../../../config";
import { getPublicUrl, generateHtml } from "../../utils/emailsUtils";
import * as templates from "./emails/templates";

function createTransporter(smtp) {
  const needsAuthentication = !!smtp.auth.user;
  const transporter = nodemailer.createTransport(needsAuthentication ? smtp : omit(smtp, ["auth"]));
  transporter.use("compile", htmlToText({ ignoreImage: true }));
  return transporter;
}

export function createMailerService(transporter = createTransporter({ ...config.smtp, secure: false })) {
  async function sendEmailMessage(to, template) {
    const { from, subject, data, replyTo } = template;
    const address = from || "tableau-de-bord@apprentissage.beta.gouv.fr";

    const { messageId } = await transporter.sendMail({
      from: address,
      replyTo: replyTo || address,
      to,
      subject,
      html: await generateHtml(to, template),
      list: {
        help: "https://mission-apprentissage.gitbook.io/general/les-services-en-devenir/accompagner-les-futurs-apprentis", // TODO [metier/tech]
        unsubscribe: getPublicUrl(`/api/emails/${data.token}/unsubscribe`),
      },
    });

    return messageId;
  }

  return {
    sendEmailMessage,
    templates,
  };
}
