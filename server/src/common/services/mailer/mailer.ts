import { omit } from "lodash-es";
import nodemailer from "nodemailer";
import { htmlToText } from "nodemailer-html-to-text";

import { sendStoredEmail } from "@/common/actions/emails.actions";
import { getPublicUrl, generateHtml } from "@/common/utils/emailsUtils";
import { __dirname } from "@/common/utils/esmUtils";
import { getStaticFilePath } from "@/common/utils/getStaticFilePath";
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
    templateFile: getStaticFilePath(`./emails/${template}.mjml.ejs`),
    data: payload,
  });
}

export function getEmailInfos<T extends TemplateName>(template: T, payload: TemplatePayloads[T]) {
  return {
    subject: templatesTitleFuncs[template](payload),
    templateFile: getStaticFilePath(`./emails/${template}.mjml.ejs`),
    data: payload,
  };
}

const templatesTitleFuncs: TemplateTitleFuncs = {
  activation_user: () => "Activation de votre compte",
  invitation_organisation: (payload) =>
    `${payload.author.civility} ${payload.author.nom} vous invite à rejoindre le tableau de bord de l'apprentissage`,
  notify_access_granted: () => "Votre demande d'accès a été acceptée",
  notify_access_granted_ofa: () => "Votre demande d’accès a été acceptée : transmettez vos effectifs",
  notify_access_rejected: () => "Votre demande d'accès a été refusée",
  notify_invitation_rejected: () => "Votre invitation à rejoindre le tableau de bord de l'apprentissage n'a pas abouti",
  reminder_missing_configuration_and_data: () => "Finalisez votre configuration de votre moyen de transmission",
  reminder_missing_data: () => "Nous n'avons pas reçu vos effectifs",
  reset_password: () => "Réinitialisation du mot de passe",
  validation_user_by_orga_gestionnaire: (payload) =>
    `Demande d'accès à votre organisation ${payload.organisationLabel}`,
  validation_user_by_tdb_team: (payload) => `[ADMIN] Demande d'accès à l'organisation ${payload.organisationLabel}`,
  register_unknown_network: () => `[ADMIN] Demande d'accès au tableau de bord : nouveau réseau signalé`,
  mission_locale_weekly_recap: (payload) =>
    `${payload.total} jeune${payload.total > 1 ? "s" : ""} en rupture de contrat ${payload.total > 1 ? "attendent" : "attend"} votre aide cette semaine`,
  mission_locale_daily_recap: (payload) =>
    `${payload.effectifs_count} nouveau${payload.effectifs_count > 1 ? "x" : ""} jeune${payload.effectifs_count > 1 ? "s" : ""} à traiter de ${payload.cfa.nom}`,
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
  notify_access_granted_ofa: {
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
  notify_invitation_rejected: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    invitation: {
      date: string;
      email: string;
    };
  };
  reminder_missing_configuration_and_data: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
  };
  reminder_missing_data: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
    };
    mode_de_transmission: string;
    erp: string;
    erp_unsupported: string;
  };
  reset_password: {
    recipient: {
      civility: string;
      nom: string;
      prenom: string;
      email: string;
    };
    resetPasswordToken: string;
    role: string;
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
  register_unknown_network: {
    email: string;
    reseau: string;
  };
  mission_locale_weekly_recap: {
    recipient: {
      nom: string;
      prenom: string;
    };
    effectifs_prioritaire: number;
    effectifs_a_traiter: number;
    effectifs_a_recontacter: number;
    total: number;
    date_debut: string;
    date_fin: string;
    mission_locale: {
      id: number;
      nom: string;
    };
  };
  mission_locale_daily_recap: {
    recipient: {
      nom: string;
      prenom: string;
    };
    cfa: {
      nom: string;
      siret?: string;
    };
    effectifs_count: number;
    mission_locale: {
      id: number;
      nom: string;
    };
  };
};

export type TemplateName = keyof TemplatePayloads;

type TemplateSubjectFunc<T extends TemplateName, Payload = TemplatePayloads[T]> = (payload: Payload) => string;
type TemplateTitleFuncs = { [types in TemplateName]: TemplateSubjectFunc<types> };
