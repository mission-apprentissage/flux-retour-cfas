import path from "path";

import { omit } from "lodash-es";
import nodemailer from "nodemailer";
import { htmlToText } from "nodemailer-html-to-text";

import { sendStoredEmail } from "@/common/actions/emails.actions";
import { getPublicUrl, generateHtml } from "@/common/utils/emailsUtils";
import { __dirname } from "@/common/utils/esmUtils";
import config from "@/config";

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
      from: `${config.email_from} <${config.email}>`,
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
  };
}

export async function sendEmail<T extends TemplateName>(
  recipient: string,
  template: T,
  payload: TemplatePayloads[T]
): Promise<void> {
  // identifiant email car stocké en BDD et possibilité de le consulter via navigateur
  await sendStoredEmail(recipient, template, payload, {
    subject: templatesTitleFuncs[template](payload),
    templateFile: path.join(__dirname(import.meta.url), `emails/${template}.mjml.ejs`),
    data: payload,
  });
}

export function getEmailInfos<T extends TemplateName>(template: T, payload: TemplatePayloads[T]) {
  return {
    subject: templatesTitleFuncs[template](payload),
    templateFile: path.join(__dirname(import.meta.url), `emails/${template}.mjml.ejs`),
    data: payload,
  };
}

const templatesTitleFuncs: TemplateTitleFuncs = {
  activation_user: () => "Activation de votre compte",
  invitation_organisation: (payload) =>
    `${payload.author.civility} ${payload.author.nom} vous invite à rejoindre le tableau de bord de l'apprentissage`,
  notify_access_granted: () => "Votre demande d'accès a été acceptée",
  notify_access_rejected: () => "Votre demande d'accès a été refusée",
  reset_password: () => "Réinitialisation du mot de passe",
  validation_user_by_orga_gestionnaire: (payload) =>
    `Demande d'accès à votre organisation ${payload.organisationLabel}`,
  validation_user_by_tdb_team: (payload) => `[ADMIN] Demande d'accès à l'organisation ${payload.organisationLabel}`,
};

// Pour chaque template, déclarer les champs qui sont utilisés dans le template
// token: string; // obligatoire et commun à tous les emails, ajouté automatiquement dans l'emails.actions
export type TemplatePayloads = {
  activation_user: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    tdbEmail: string;
    activationToken: string;
  };
  invitation_organisation: {
    author: {
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    organisationLabel: string;
    invitationToken: string;
  };
  notify_access_granted: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    organisationLabel: string;
  };
  notify_access_rejected: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    organisationLabel: string;
  };
  reset_password: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    resetPasswordToken: string;
  };
  validation_user_by_orga_gestionnaire: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    user: {
      _id: string;
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    organisationLabel: string;
  };
  validation_user_by_tdb_team: {
    user: {
      _id: string;
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    organisationLabel: string;
  };
};

export type TemplateName = keyof TemplatePayloads;

type TemplateSubjectFunc<T extends TemplateName, Payload = TemplatePayloads[T]> = (payload: Payload) => string;
type TemplateTitleFuncs = { [types in TemplateName]: TemplateSubjectFunc<types> };
