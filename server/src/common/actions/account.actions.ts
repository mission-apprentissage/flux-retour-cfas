import Boom from "boom";
import { ObjectId } from "mongodb";
import { IInvitation } from "shared/models/data/invitations.model";

import logger from "@/common/logger";
import {
  auditLogsDb,
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { createActivationToken, createResetPasswordToken } from "@/common/utils/jwtUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";
import { RegistrationCfaSchema } from "@/common/validation/registrationCfaSchema";
import { RegistrationSchema, RegistrationUnknownNetworkSchema } from "@/common/validation/registrationSchema";
import config from "@/config";

import { AuthContext } from "../model/internal/AuthContext.js";

import { buildOrganisationLabel, createOrganisation, getOrganisationById } from "./organisations.actions";
import { getOrganismeByUAIAndSIRET } from "./organismes/organismes.actions";
import { createSession } from "./sessions.actions";
import { authenticate, createUser, getUserByEmail, updateUserLastConnection } from "./users.actions";

export async function register(registration: RegistrationSchema): Promise<{
  account_status: "PENDING_EMAIL_VALIDATION" | "CONFIRMED";
}> {
  const alreadyExists = await getUserByEmail(registration.user.email);
  let registrationExtraData: { organisme_id?: string } = {};
  if (alreadyExists) {
    throw Boom.conflict("Cet email est déjà utilisé.");
  }

  const orga = registration.organisation;

  if (orga.type === "MISSION_LOCALE") {
    delete orga.adresse; // Dirty fix, suppression de l'adresse autrement le findOne ne fonctionne pas. A corriger.
  }

  // on s'assure que l'organisme existe pour un OF
  const type = orga.type;
  if (type === "ORGANISME_FORMATION") {
    const { uai, siret } = orga;
    const organisme = await getOrganismeByUAIAndSIRET(uai, siret);
    if (!organisme) {
      throw Boom.badRequest("Aucun organisme trouvé");
    }
    registrationExtraData.organisme_id = organisme._id.toString();
  }

  const organisation = await organisationsDb().findOne(orga);
  const organisationId = organisation
    ? organisation._id
    : await createOrganisation({
        ...orga,
        ...registrationExtraData,
      });

  const invitation = await invitationsDb().findOne({
    organisation_id: organisationId,
    email: registration.user.email,
  });
  if (invitation) {
    if (orga.type === "ORGANISME_FORMATION") {
      throw Boom.badRequest("Une invitation CFA est en attente pour cet email. Utilisez le lien reçu par email.");
    }
    if (invitation.expires_at && getCurrentTime() > invitation.expires_at) {
      throw Boom.unauthorized("Le lien d'invitation a expiré. Veuillez demander une nouvelle invitation.");
    }
  }

  const userId = await createUser(registration.user, organisationId);

  // si l'utilisateur est invité, alors on juge son email comme validé et ses permissions valides
  if (invitation) {
    await usersMigrationDb().updateOne(
      {
        _id: userId,
      },
      {
        $set: {
          account_status: "CONFIRMED",
          confirmed_at: new Date(),
          ...(invitation.role ? { organisation_role: invitation.role } : {}),
        },
      }
    );
    await invitationsArchiveDb().insertOne(invitation);
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

    await usersMigrationDb().updateOne({ _id: userId }, { $set: { last_activation_email_sent_at: new Date() } });

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
 * Confirmation de l'email d'un utilisateur.
 *
 * Deux branches :
 * - Utilisateur CFA venu d'une invitation (`organisation_role` défini) → passe
 *   directement à CONFIRMED et reçoit le mail de bienvenue `confirmation_cfa`.
 * - Utilisateur standard → passe en PENDING_ADMIN_VALIDATION (flow existant).
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
    if (ctx.organisation_role) {
      const res = await usersMigrationDb().updateOne(
        {
          email: ctx.email,
          account_status: "PENDING_EMAIL_VALIDATION",
        },
        {
          $set: {
            account_status: "CONFIRMED",
            confirmed_at: new Date(),
          },
        }
      );
      if (res.modifiedCount === 0) {
        throw Boom.badRequest("Permissions invalides");
      }

      const organisation = await getOrganisationById(ctx.organisation_id);
      let cfaName = "Organisme";
      if (organisation.type === "ORGANISME_FORMATION") {
        const organisme = await organismesDb().findOne({
          siret: organisation.siret,
          ...(organisation.uai ? { uai: organisation.uai } : {}),
        });
        cfaName = organisme?.nom || organisme?.enseigne || organisme?.raison_sociale || "Organisme";
      }
      await sendEmail(ctx.email, "confirmation_cfa", {
        recipient: { prenom: ctx.prenom },
        cfaName,
      });
    } else {
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
  const orga = await getOrganisationById(user?.organisation_id);

  const token = createResetPasswordToken(user.email);
  sendEmail(user.email, "reset_password", {
    recipient: {
      civility: user.civility,
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
    },
    resetPasswordToken: token,
    role: orga.type,
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

/**
 * Inscription CFA via token d'invitation — sans civility, sans saisie d'organisation.
 *
 * Flow (PRD Bloc 2/3) : création du compte en PENDING_EMAIL_VALIDATION + envoi
 * d'un mail d'activation. Le compte devient CONFIRMED lorsque l'utilisateur
 * clique sur le lien d'activation (cf. `activateUser`).
 */
export async function registerCfa(data: RegistrationCfaSchema): Promise<{
  account_status: "PENDING_EMAIL_VALIDATION";
}> {
  const invitation = await invitationsDb().findOne<IInvitation>({ token: data.token });
  if (!invitation) {
    throw Boom.notFound("Jeton d'invitation non valide");
  }
  if (invitation.expires_at && getCurrentTime() > invitation.expires_at) {
    throw Boom.unauthorized("Le lien d'invitation a expiré. Veuillez demander une nouvelle invitation.");
  }

  const emailEsc = invitation.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const alreadyExists = await usersMigrationDb().findOne(
    { email: { $regex: `^${emailEsc}$`, $options: "i" } },
    { projection: { _id: 1 } }
  );
  if (alreadyExists) {
    throw Boom.conflict("Cet email est déjà utilisé.");
  }

  const isAdmin = invitation.role === "admin";

  await invitationsArchiveDb().insertOne(invitation);

  let userId: ObjectId | null = null;
  try {
    userId = await createUser(
      {
        email: invitation.email,
        nom: data.nom,
        prenom: data.prenom,
        telephone: data.telephone,
        fonction: data.fonction,
        password: data.password,
        has_accept_cgu_version: data.has_accept_cgu_version,
      },
      invitation.organisation_id
    );

    if (invitation.role) {
      await usersMigrationDb().updateOne({ _id: userId }, { $set: { organisation_role: invitation.role } });
    }

    await invitationsDb().deleteOne({ _id: invitation._id });
  } catch (err) {
    await invitationsArchiveDb().deleteOne({ _id: invitation._id });
    if (userId) {
      await usersMigrationDb().deleteOne({ _id: userId });
    }
    throw err;
  }

  await sendEmail(invitation.email, "activation_cfa", {
    recipient: {
      nom: data.nom,
      prenom: data.prenom,
    },
    activationToken: createActivationToken(invitation.email),
    isAdmin,
  });

  await usersMigrationDb().updateOne({ _id: userId }, { $set: { last_activation_email_sent_at: new Date() } });

  return { account_status: "PENDING_EMAIL_VALIDATION" };
}

/**
 * Retourne les infos nécessaires au wizard d'onboarding CFA :
 * - infos établissement (nom, adresse, UAI, SIRET)
 * - liste des ML du même département
 * - nombre de CFA connectés sur le département
 */
export async function getCfaOnboardingInfo(token: string) {
  const invitation = await invitationsDb().findOne({ token });
  if (!invitation) {
    throw Boom.notFound("Jeton d'invitation non valide");
  }
  if (invitation.expires_at && getCurrentTime() > invitation.expires_at) {
    throw Boom.unauthorized("Le lien d'invitation a expiré. Veuillez demander une nouvelle invitation.");
  }

  const organisation = await getOrganisationById(invitation.organisation_id);
  if (organisation.type !== "ORGANISME_FORMATION") {
    throw Boom.badRequest("Cette invitation ne concerne pas un CFA");
  }

  const organisme = await organismesDb().findOne({
    siret: organisation.siret,
    ...(organisation.uai ? { uai: organisation.uai } : {}),
  });

  const departement = organisme?.adresse?.departement;

  const missionsLocales = departement
    ? await organisationsDb()
        .find(
          { type: "MISSION_LOCALE", "adresse.departement": departement },
          { projection: { _id: 1, nom: 1, adresse: 1 } }
        )
        .toArray()
    : [];

  const cfaBetaOrganisations = departement
    ? await organisationsDb()
        .find(
          {
            type: "ORGANISME_FORMATION",
            ml_beta_activated_at: { $exists: true },
          },
          { projection: { organisme_id: 1 } }
        )
        .toArray()
    : [];

  const cfaBetaOrganismeIds = cfaBetaOrganisations
    .filter((o: any) => o.organisme_id)
    .map((o: any) => new ObjectId(o.organisme_id));

  const cfaConnectesCount =
    cfaBetaOrganismeIds.length > 0
      ? await organismesDb().countDocuments({
          _id: { $in: cfaBetaOrganismeIds },
          "adresse.departement": departement,
        })
      : 0;

  return {
    email: invitation.email,
    role: invitation.role,
    etablissement: {
      nom: organisme?.nom || organisme?.enseigne || organisme?.raison_sociale || "Organisme",
      adresse: organisme?.adresse
        ? `${organisme.adresse.numero ?? ""} ${organisme.adresse.voie ?? ""} ${organisme.adresse.code_postal ?? ""} ${organisme.adresse.commune ?? ""}`
            .replace(/\s+/g, " ")
            .trim()
        : "",
      commune: organisme?.adresse?.commune ?? "",
      uai: organisation.uai,
      siret: organisation.siret,
      departement,
    },
    missionsLocales: missionsLocales.map((ml) => {
      const mlAny = ml as any;
      return {
        _id: ml._id,
        nom: mlAny.nom as string,
        commune: mlAny.adresse?.commune as string | undefined,
        codePostal: mlAny.adresse?.code_postal as string | undefined,
      };
    }),
    cfaConnectesCount,
  };
}
