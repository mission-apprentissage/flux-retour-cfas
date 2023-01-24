import path from "path";
import config from "../../../../config.js";
import { createResetPasswordToken, createActivationToken } from "../../../utils/jwtUtils.js";
import { __dirname } from "../../../utils/esmUtils.js";

function getTemplateFile(name) {
  return path.join(__dirname(import.meta.url), `${name}.mjml.ejs`);
}

export function activation_user({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix}Activation de votre compte`,
    templateFile: getTemplateFile("activation_user"),
    data: {
      email: config.email,
      user: {
        civility: payload.civility,
        nom: payload.nom,
        prenom: payload.prenom,
        email: payload.email,
      },
      token,
      activationToken: createActivationToken(payload.email, { payload: { tmpPwd: payload.tmpPwd } }),
    },
  };
}

export function validation_first_organisme_user_by_tdb_team({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix} [ADMIN] Demande d'accès à l'organisme ${payload.organisme.nom}`,
    templateFile: getTemplateFile("validation_first_organisme_user_by_tdb_team"),
    data: {
      user: payload.user,
      organisme: payload.organisme,
      type: payload.type,
      token,
    },
  };
}

export function validation_user_by_tdb_team({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix} [ADMIN] Demande d'accès`,
    templateFile: getTemplateFile("validation_user_by_tdb_team"),
    data: {
      user: payload.user,
      type: payload.type,
      token,
    },
  };
}

export function validation_user_by_orga_admin({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix} Demande d'accès à votre organisme ${payload.organisme.nom}`,
    templateFile: getTemplateFile("validation_user_by_orga_admin"),
    data: {
      user: payload.user,
      organisme: payload.organisme,
      type: payload.type,
      token,
    },
  };
}

export function notify_access_granted({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix} Votre demande d'accès a été acceptée`,
    templateFile: getTemplateFile("notify_access_granted"),
    data: {
      userCivility: payload.user.civility,
      userName: payload.user.nom,
      organismeName: payload.organisme?.nom,
    },
  };
}

export function notify_access_rejected({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  return {
    subject: `${prefix} Votre demande d'accès a été refusée`,
    templateFile: getTemplateFile("notify_access_rejected"),
    data: {
      userCivility: payload.user.civility,
      userName: payload.user.nom,
      organismeName: payload.organisme?.nom,
    },
  };
}

// TODO [metier]
// export function notification(cfa, token, options = {}) {
//   const prefix = options.resend ? "[Rappel] " : "";
//   return {
//     subject: `${prefix}Notification`,
//     templateFile: getTemplateFile("notification"),
//     data: {
//       email: config.email,
//       cfa,
//       token,
//       actionToken: createActionToken(cfa.username),
//     },
//   };
// }

export function reset_password({ payload }, token) {
  return {
    subject: "Réinitialisation du mot de passe",
    templateFile: getTemplateFile("reset_password"),
    data: {
      email: config.email,
      user: payload,
      token,
      resetPasswordToken: createResetPasswordToken(payload.email),
    },
  };
}
