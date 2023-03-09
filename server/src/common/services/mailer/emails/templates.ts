import path from "path";
import config from "../../../../config";
import { createResetPasswordToken, createActivationToken } from "../../../utils/jwtUtils";
import { __dirname } from "../../../utils/esmUtils";
import { ACADEMIES_BY_ID, REGIONS_BY_ID, DEPARTEMENTS_BY_ID } from "../../../constants/territoiresConstants";

function getTemplateFile(name) {
  return path.join(__dirname(import.meta.url), `${name}.mjml.ejs`);
}

function getRegionAsString(code) {
  const region = REGIONS_BY_ID[code];
  return region ? `${region.nom} (${region.code})` : code;
}

function getDepartementAsString(code) {
  const dep = DEPARTEMENTS_BY_ID[code];
  return dep ? `${dep.nom} (${dep.code})` : code;
}

function getAcademyAsString(code) {
  const academie = ACADEMIES_BY_ID[code];
  return academie ? `${academie.nom} (${academie.code})` : code;
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
  const region_as_string = getRegionAsString(payload.organisme.adresse.region);
  const departement_as_string = getDepartementAsString(payload.organisme.adresse.departement);
  const academie_as_string = getAcademyAsString(payload.organisme.adresse.academie);

  return {
    subject: `${prefix} [ADMIN] Demande d'accès à l'organisme ${payload.organisme.nom}`,
    templateFile: getTemplateFile("validation_first_organisme_user_by_tdb_team"),
    data: {
      user: payload.user,
      organisme: payload.organisme,
      region_as_string,
      academie_as_string,
      departement_as_string,
      type: payload.type,
      token,
    },
  };
}

export function validation_user_by_tdb_team({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  const regions_as_string = payload.user.codes_region.map(getRegionAsString).join(", ");
  const departements_as_string = payload.user.codes_departement.map(getDepartementAsString).join(", ");
  const academies_as_string = payload.user.codes_academie.map(getAcademyAsString).join(", ");

  return {
    subject: `${prefix} [ADMIN] Demande d'accès`,
    templateFile: getTemplateFile("validation_user_by_tdb_team"),
    data: {
      user: payload.user,
      type: payload.type,
      regions_as_string,
      academies_as_string,
      departements_as_string,
      token,
    },
  };
}

export function validation_user_by_orga_admin({ payload }, token, options = {}) {
  const prefix = options.resend ? "[Rappel] " : "";
  const region_as_string = getRegionAsString(payload.organisme.adresse.region);
  const departement_as_string = getDepartementAsString(payload.organisme.adresse.departement);
  const academie_as_string = getAcademyAsString(payload.organisme.adresse.academie);

  return {
    subject: `${prefix} Demande d'accès à votre organisme ${payload.organisme.nom}`,
    templateFile: getTemplateFile("validation_user_by_orga_admin"),
    data: {
      user: payload.user,
      organisme: payload.organisme,
      region_as_string,
      academie_as_string,
      departement_as_string,
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
