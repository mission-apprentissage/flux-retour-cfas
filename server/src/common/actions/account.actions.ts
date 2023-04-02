import { mailerActions } from "../../services.js";
import Boom from "boom";

import { invitationsDb, organisationsDb, usersMigrationDb } from "../model/collections.js";
import { RegistrationSchema } from "../validation/registrationSchema.js";
import { createOrganisation, getOrganisationById } from "./organisations.actions.js";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions.js";
import { createSession } from "./sessions.actions.js";
import { getOrganismeByUAIAndSIRET } from "./organismes/organismes.actions.js";
import logger from "../logger.js";
import { sendSimpleEmail } from "../services/mailer/mailer.js";
import config from "../../config.js";
import { createActivationToken } from "../utils/jwtUtils.js";
import { getOrganisationLabel } from "../model/organisations.model.js";

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
      // FIXME créer un organisme depuis API entreprise ?
      // paramètres par défaut = va chercher dans API entreprise
      logger.warn({ action: "register", uai, siret }, "organisme inconnu");
      throw new Error("création à partir de API entreprise à faire");
      // await createOrganisme({ uai, siret });
    }
  }

  const organisation = await organisationsDb().findOne(registration.organisation);
  const organisationId = organisation ? organisation._id : await createOrganisation(registration.organisation);

  await createUser(registration.user, organisationId);

  // FIXME send simple email
  await mailerActions.sendEmail({ to: registration.user.email, payload: registration.user }, "activation_user");

  // 2 pour voir la différence
  await sendSimpleEmail(registration.user.email, "activation_user", {
    tdbEmail: config.email,
    user: {
      civility: registration.user.civility,
      nom: registration.user.nom,
      prenom: registration.user.prenom,
      email: registration.user.email,
    },
    activationToken: createActivationToken(registration.user.email, { payload: {} }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const user = await getUserByEmail(email.toLowerCase());
  if (!user) {
    throw Boom.unauthorized("Accès non autorisé");
  }

  const auth = await authenticate(user.email, password);
  if (!auth) {
    throw Boom.unauthorized("Accès non autorisé");
  }

  await updateUserLastConnection(auth.email);

  const sessionToken = createSession(auth.email);
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
    // FIXME pour l'instant, pas de notif aux admins ou gestionnaires directement
    await sendSimpleEmail("tableau-de-bord@apprentissage.beta.gouv.fr", "validation_user_by_tdb_team", {
      user: {
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
      },
      organisationLabel: getOrganisationLabel(await getOrganisationById(user.organisation_id)),
    });
  }
};
