import path from "path";
import nodemailer from "nodemailer";
import { omit } from "lodash-es";
import { htmlToText } from "nodemailer-html-to-text";
import config from "../../../config.js";
import { getPublicUrl, generateHtml } from "../../utils/emailsUtils.js";
import * as templates from "./emails/templates.js";
import { __dirname } from "../../utils/esmUtils.js";
import { mailerActions } from "../../../services.js";
import { v4 as uuidv4 } from "uuid";

function createTransporter(smtp) {
  const needsAuthentication = !!smtp.auth.user;
  const transporter = nodemailer.createTransport(needsAuthentication ? smtp : omit(smtp, ["auth"]));
  transporter.use("compile", htmlToText({ ignoreImage: true }));
  return transporter;
}

export function createMailerService(transporter = createTransporter({ ...config.smtp, secure: false })) {
  async function sendEmailMessage(to, template) {
    const { subject, data } = template;

    const { messageId } = await transporter.sendMail({
      from: config.email,
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

export async function sendSimpleEmail<T extends TemplateName>(
  recipient: string,
  template: T,
  payload: TemplatePayloads[T]
): Promise<void> {
  // identifiant email car stocké en BDD et possibilité de le consulter via navigateur
  const emailToken = uuidv4();
  await mailerActions.sendSimpleEmail(
    recipient,
    template,
    payload,
    {
      subject: templatesTitleFuncs[template](payload),
      templateFile: path.join(__dirname(import.meta.url), `emails/${template}.mjml.ejs`),
      data: payload,
    },
    emailToken
  );
}

const templatesTitleFuncs: TemplateTitleFuncs = {
  invitation_organisation: (payload) =>
    `${payload.author.civility} ${payload.author.nom} vous invite à rejoindre le tableau de bord de l'apprentissage`,
};

// Pour chaque template, déclarer les champs qui sont utilisés dans le template
export type TemplatePayloads = {
  invitation_organisation: {
    // token: string; // obligatoire et commun à tous les emails, ajouté automatiquement dans l'emails.actions
    author: {
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    organisationLabel: string;
    invitationToken: string;
  };
};

export type TemplateName = keyof TemplatePayloads;

type TemplateSubjectFunc<T extends TemplateName, Payload = TemplatePayloads[T]> = (payload: Payload) => string;
type TemplateTitleFuncs = { [types in TemplateName]: TemplateSubjectFunc<types> };
