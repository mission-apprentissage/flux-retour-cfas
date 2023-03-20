import Boom from "boom";

import { invitationsDb, organisationsDb, usersMigrationDb } from "../model/collections.js";
import { RegistrationSchema } from "../validation/registrationSchema.js";
import { buildOrganisationLabel, createOrganisation } from "./organisations.actions.js";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions.js";
import { createSession } from "./sessions.actions.js";
import { createOrganisme, getOrganismeByUAIAndSIRET } from "./organismes/organismes.actions.js";
import logger from "../logger.js";
import { sendEmail } from "../services/mailer/mailer.js";
import config from "../../config.js";
import { createActivationToken, createResetPasswordToken } from "../utils/jwtUtils.js";
import { STATUT_FIABILISATION_ORGANISME } from "../constants/fiabilisationConstants.js";

export async function register(registration: RegistrationSchema): Promise<void> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  if (alreadyExists) {
    throw Boom.conflict("email already in use", { message: "email already in use" });
  }

  // on s'assure que l'organisme existe pour un OF
  const type = registration.organisation.type;
  if (
    type === "ORGANISME_FORMATION_FORMATEUR" ||
    type === "ORGANISME_FORMATION_RESPONSABLE" ||
    type === "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR"
  ) {
    const { uai, siret } = registration.organisation;
    try {
      await getOrganismeByUAIAndSIRET(uai, siret);
    } catch (err) {
      // si pas d'organisme en base (et donc le référentiel), on en crée un à partir depuis API entreprise
      logger.warn({ action: "register", uai, siret }, "organisme inconnu créé");
      await createOrganisme({
        uai,
        siret,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU_INSCRIPTION,
      });
    }
  }

  const organisation = await organisationsDb().findOne(registration.organisation);
  const organisationId = organisation ? organisation._id : await createOrganisation(registration.organisation);

  await createUser(registration.user, organisationId);

  await sendEmail(registration.user.email, "activation_user", {
    recipient: {
      civility: registration.user.civility,
      nom: registration.user.nom,
      prenom: registration.user.prenom,
    },
    tdbEmail: config.email,
    activationToken: createActivationToken(registration.user.email, { payload: {} }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const user = await authenticate(email, password);
  if (!user) {
    throw Boom.unauthorized("Votre identifiant ou votre mot de passe est incorrect");
  }
  if (user.account_status !== "CONFIRMED") {
    throw Boom.forbidden("Votre compte n'est pas encore validé.");
  }

  await updateUserLastConnection(user._id);

  const sessionToken = createSession(email);
  return sessionToken;
}

/** Ca serait mieux de gérer un token d'activation */
export const activateUser = async (email: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    logger.error({ email }, "utilisateur non trouvé à l'activation");
    throw Boom.internal("Une erreur est survenue");
  }

  // si une invitation existe, on confirme directement l'utilisateur
  const invitation = await invitationsDb().findOne({
    organisation_id: user.organisation_id,
    email: user.email,
  });

  const res = await usersMigrationDb().updateOne(
    {
      email,
      account_status: "PENDING_EMAIL_VALIDATION",
    },
    {
      $set: {
        account_status: invitation ? "CONFIRMED" : "PENDING_ADMIN_VALIDATION", // previously PENDING_PASSWORD_SETUP
      },
    }
  );
  if (res.modifiedCount === 0) {
    throw Boom.badRequest("Permissions invalides");
  }

  // si l'invitation a été utilisée, on la supprime et il n'y a pas besoin de notification
  if (invitation) {
    await invitationsDb().deleteOne({ _id: invitation._id });
  } else {
    // si des gestionnaires existent, on les notifie, sinon c'est un admin du TDB qui doit valider
    const gestionnaires = await usersMigrationDb()
      .find({
        organisation_id: user.organisation_id,
        account_status: "CONFIRMED",
      })
      .toArray();

    if (gestionnaires.length > 0) {
      await Promise.all(
        gestionnaires.map(async (gestionnaire) => {
          await sendEmail(gestionnaire.email, "validation_user_by_orga_gestionnaire", {
            recipient: {
              civility: gestionnaire.civility,
              prenom: gestionnaire.prenom,
              nom: gestionnaire.nom,
            },
            user: {
              _id: user._id.toString(),
              civility: user.civility,
              nom: user.nom,
              prenom: user.prenom,
              email: user.email,
            },
            organisationLabel: await buildOrganisationLabel(user.organisation_id),
          });
        })
      );
    } else {
      await sendEmail("tableau-de-bord@apprentissage.beta.gouv.fr", "validation_user_by_tdb_team", {
        user: {
          _id: user._id.toString(),
          civility: user.civility,
          prenom: user.prenom,
          nom: user.nom,
          email: user.email,
        },
        organisationLabel: await buildOrganisationLabel(user.organisation_id),
      });
    }
  }
};

export async function sendForgotPasswordRequest(email: string) {
  const user = await getUserByEmail(email);
  if (!user) {
    logger.warn({ email }, "forgot-password: missing user");
    return;
  }

  const token = createResetPasswordToken(user.email);
  sendEmail(user.email, "reset_password", {
    recipient: {
      civility: user.civility,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
    },
    resetPasswordToken: token,
  });
}
