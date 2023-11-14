import Boom from "boom";
import { STATUT_FIABILISATION_ORGANISME } from "shared";

import logger from "@/common/logger";
import { auditLogsDb, invitationsDb, organisationsDb, usersMigrationDb } from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { createActivationToken, createResetPasswordToken } from "@/common/utils/jwtUtils";
import { RegistrationSchema, RegistrationUnknownNetworkSchema } from "@/common/validation/registrationSchema";
import config from "@/config";

import { AuthContext } from "../model/internal/AuthContext.js";

import { buildOrganisationLabel, createOrganisation } from "./organisations.actions";
import {
  createOrganisme,
  getOrganismeByUAIAndSIRET,
  getOrganismeInfosFromSiret,
} from "./organismes/organismes.actions";
import { createSession } from "./sessions.actions";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions";

export async function register(registration: RegistrationSchema): Promise<{
  account_status: "PENDING_EMAIL_VALIDATION" | "CONFIRMED";
}> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  if (alreadyExists) {
    throw Boom.conflict("Cet email est déjà utilisé.");
  }

  // on s'assure que l'organisme existe pour un OF
  const type = registration.organisation.type;
  if (type === "ORGANISME_FORMATION") {
    const { uai, siret } = registration.organisation;
    try {
      await getOrganismeByUAIAndSIRET(uai, siret);
    } catch (err) {
      // si pas d'organisme en base (et donc le référentiel), on en crée un à partir depuis API entreprise
      logger.warn({ action: "register", uai, siret }, "organisme inconnu créé");
      // Récupération des infos depuis API Entreprise si option active, sinon renvoi des nom / adresse passé en paramètres
      const data = await getOrganismeInfosFromSiret(siret);

      // si aucun champ ferme fourni en entrée on récupère celui de l'organisme trouvé par son id
      await createOrganisme({
        ...data,
        ...(uai ? { uai } : {}),
        siret,
        fiabilisation_statut: STATUT_FIABILISATION_ORGANISME.INCONNU_INSCRIPTION,
      });
    }
  }

  const organisation = await organisationsDb().findOne(registration.organisation);
  const organisationId = organisation ? organisation._id : await createOrganisation(registration.organisation);

  const userId = await createUser(registration.user, organisationId);

  // si l'utilisateur est invité, alors on juge son email comme validé et ses permissions valides
  const invitation = await invitationsDb().findOne({
    organisation_id: organisationId,
    email: registration.user.email,
  });
  if (invitation) {
    await usersMigrationDb().updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          account_status: "CONFIRMED",
        },
      }
    );
    await invitationsDb().deleteOne({ _id: invitation._id });
    return {
      account_status: "CONFIRMED",
    };
  } else {
    await sendEmail(registration.user.email, "activation_user", {
      recipient: {
        civility: registration.user.civility,
        nom: registration.user.nom,
        prenom: registration.user.prenom,
      },
      tdbEmail: config.email,
      activationToken: createActivationToken(registration.user.email),
    });
    return {
      account_status: "PENDING_EMAIL_VALIDATION",
    };
  }
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

  const sessionToken = await createSession(email);
  return sessionToken;
}

/**
 * Confirmation de l'email d'un utilisateur
 */
export async function activateUser(ctx: AuthContext) {
  const gestionnaires = await usersMigrationDb()
    .find({
      organisation_id: ctx.organisation_id,
      account_status: "CONFIRMED",
    })
    .toArray();

  // tant que l'utilisateur n'est pas confirmé
  if (ctx.account_status === "PENDING_EMAIL_VALIDATION") {
    const res = await usersMigrationDb().updateOne(
      {
        email: ctx.email,
        account_status: "PENDING_EMAIL_VALIDATION",
      },
      {
        $set: {
          account_status: "PENDING_ADMIN_VALIDATION",
        },
      }
    );
    if (res.modifiedCount === 0) {
      throw Boom.badRequest("Permissions invalides");
    }

    // Notification à l'administrateur TDB
    await sendEmail("tableau-de-bord@apprentissage.beta.gouv.fr", "validation_user_by_tdb_team", {
      user: {
        _id: ctx._id.toString(),
        civility: ctx.civility,
        prenom: ctx.prenom,
        nom: ctx.nom,
        email: ctx.email,
      },
      organisationLabel: await buildOrganisationLabel(ctx.organisation_id),
    });
  }

  // renvoi du statut du compte pour rediriger l'utilisateur si son statut change
  return {
    account_status: (
      await usersMigrationDb().findOne(
        { email: ctx.email },
        {
          projection: {
            _id: 0,
            account_status: 1,
          },
        }
      )
    )?.account_status,
    validationByGestionnaire: gestionnaires.length > 0,
  };
}

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

export async function registerUnknownNetwork(registrationUnknownNetwork: RegistrationUnknownNetworkSchema) {
  // On stocke la demande dans les logs d'audits
  await auditLogsDb().insertOne({
    action: "register-unknown-network",
    date: new Date(),
    data: { email: registrationUnknownNetwork.email, reseau: registrationUnknownNetwork.unknownNetwork },
  });

  // Notification à l'administrateur TDB
  await sendEmail("tableau-de-bord@apprentissage.beta.gouv.fr", "register_unknown_network", {
    email: registrationUnknownNetwork.email,
    reseau: registrationUnknownNetwork.unknownNetwork,
  });
}
