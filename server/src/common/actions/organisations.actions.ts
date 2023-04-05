import Boom from "boom";
import { ObjectId } from "mongodb";
import { REGIONS_BY_ID, DEPARTEMENTS_BY_ID, ACADEMIES_BY_ID } from "../constants/territoiresConstants.js";
import { UsersMigration } from "../model/@types/UsersMigration.js";

import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "../model/collections.js";
import { AuthContext } from "../model/internal/AuthContext.js";
import { Organisation } from "../model/organisations.model.js";
import { sendEmail } from "../services/mailer/mailer.js";
import logger from "../logger.js";
import { Organisme } from "../model/@types/Organisme.js";
import { requireOrganisationOF } from "./helpers/permissions.js";
import { Invitation } from "../model/invitations.model.js";
import { generateKey } from "../utils/cryptoUtils.js";
import { getUserById } from "./users.actions.js";

type NewOrganisation = Omit<Organisation, "_id" | "created_at">;

export async function createOrganisation(organisation: NewOrganisation): Promise<ObjectId> {
  const { insertedId } = await organisationsDb().insertOne({
    created_at: new Date(),
    ...organisation,
  } as any); // FIXME pb de type
  return insertedId;
}

export async function getOrganisationById(organisationId: ObjectId): Promise<Organisation> {
  const organisation = await organisationsDb().findOne<Organisation>({ _id: organisationId });
  if (!organisation) {
    throw Boom.notFound(`missing organisation ${organisationId}`);
  }
  return organisation;
}

export async function listOrganisationMembers(ctx: AuthContext): Promise<Partial<UsersMigration[]>> {
  return await usersMigrationDb()
    .find(
      {
        organisation_id: ctx.organisation_id,
        account_status: {
          $in: ["PENDING_ADMIN_VALIDATION", "CONFIRMED"],
        },
      },
      {
        projection: {
          _id: 1,
          nom: 1,
          prenom: 1,
          email: 1,
          telephone: 1,
          account_status: 1,
          created_at: 1,
          last_connection: 1,
        },
      }
    )
    .toArray();
}

export async function listOrganisationPendingInvitations(ctx: AuthContext): Promise<any[]> {
  return await invitationsDb()
    .find({
      organisation_id: ctx.organisation_id,
    })
    .toArray();
}

export async function inviteUserToOrganisation(ctx: AuthContext, email: string): Promise<void> {
  const existingUser = await usersMigrationDb().findOne({
    email: email,
  });
  if (existingUser) {
    const sameOrganisation = existingUser.organisation_id.equals(ctx.organisation_id);
    throw Boom.badRequest(
      sameOrganisation
        ? "Cet utilisateur est déjà présent dans votre organisation..."
        : "Cet utilisateur est déjà présent dans une autre organisation. Si vous pensez que c'est une erreur, merci de contacter le support."
    );
  }
  const invitationToken = generateKey(50, "hex");
  await invitationsDb().insertOne({
    organisation_id: ctx.organisation_id,
    email,
    token: invitationToken,
    created_at: new Date(),
  });

  await sendEmail(email, "invitation_organisation", {
    author: {
      civility: ctx.civility,
      nom: ctx.nom,
      prenom: ctx.prenom,
      email: ctx.email,
    },
    organisationLabel: await buildOrganisationLabel(ctx.organisation_id),
    invitationToken,
  });
}

export async function resendInvitationEmail(ctx: AuthContext, invitationId: string): Promise<void> {
  const invitation = await getInvitationById(ctx, new ObjectId(invitationId));
  await sendEmail(invitation.email, "invitation_organisation", {
    author: {
      civility: ctx.civility,
      nom: ctx.nom,
      prenom: ctx.prenom,
      email: ctx.email,
    },
    organisationLabel: await buildOrganisationLabel(ctx.organisation_id),
    invitationToken: invitation.token,
  });
}

export async function cancelInvitation(ctx: AuthContext, invitationId: string): Promise<void> {
  const res = await invitationsDb().deleteOne({
    organisation_id: ctx.organisation_id,
    _id: new ObjectId(invitationId),
  });
  if (res.deletedCount === 0) {
    throw Boom.forbidden("Permissions invalides");
  }
}

export async function validateMembre(ctx: AuthContext, userId: string): Promise<void> {
  const user = await getUserById(new ObjectId(userId));
  if (user.account_status !== "PENDING_ADMIN_VALIDATION") {
    throw Boom.forbidden("Permissions invalides");
  }

  // seul un administrateur ou gestionnaire de l'organisation peut valider un utilisateur
  if (!(ctx.organisation.type === "ADMINISTRATEUR" || user.organisation_id.equals(ctx.organisation_id))) {
    throw Boom.forbidden("Permissions invalides");
  }

  await usersMigrationDb().updateOne(
    { _id: user._id },
    {
      $set: {
        account_status: "CONFIRMED",
      },
    }
  );
  await sendEmail(user.email, "notify_access_granted", {
    recipient: {
      civility: user.civility,
      nom: user.nom,
      prenom: user.prenom,
    },
    organisationLabel: await buildOrganisationLabel(user.organisation_id),
  });
}

export async function rejectMembre(ctx: AuthContext, userId: string): Promise<void> {
  const user = await getUserById(new ObjectId(userId));
  if (user.account_status !== "PENDING_ADMIN_VALIDATION") {
    throw Boom.forbidden("Permissions invalides");
  }
  // seul un administrateur ou gestionnaire de l'organisation peut valider un utilisateur
  if (!(ctx.organisation.type === "ADMINISTRATEUR" || user.organisation_id.equals(ctx.organisation_id))) {
    throw Boom.forbidden("Permissions invalides");
  }
  await usersMigrationDb().deleteOne({ _id: user._id });
  await sendEmail(user.email, "notify_access_rejected", {
    recipient: {
      civility: user.civility,
      nom: user.nom,
      prenom: user.prenom,
    },
    organisationLabel: await buildOrganisationLabel(user.organisation_id),
  });
}

export async function removeUserFromOrganisation(ctx: AuthContext, userId: string): Promise<void> {
  const res = await usersMigrationDb().deleteOne({
    organisation_id: ctx.organisation_id,
    _id: new ObjectId(userId),
  });
  if (res.deletedCount === 0) {
    throw Boom.forbidden("Permissions invalides");
  }
}

interface ConfigurationERP {
  erps?: string[];
  mode_de_transmission?: "API" | "MANUEL";
  setup_step_courante?: "STEP1" | "STEP2" | "STEP3" | "COMPLETE";
}

export async function configureOrganismeERP(ctx: AuthContext, conf: ConfigurationERP): Promise<void> {
  const organisationOF = requireOrganisationOF(ctx);

  const organisme = await organismesDb().findOne({ siret: organisationOF.siret, uai: organisationOF.uai });
  if (!organisme) {
    throw Boom.notFound("organisme de l'organisation non trouvé", {
      siret: organisationOF.siret,
      uai: organisationOF.uai,
    });
  }
  await organismesDb().updateOne({ _id: organisme._id }, conf);
}

export async function getOrganisationOrganisme(ctx: AuthContext): Promise<Organisme> {
  const organisationOF = requireOrganisationOF(ctx);

  const organisme = await organismesDb().findOne({ siret: organisationOF.siret, uai: organisationOF.uai });
  if (!organisme) {
    throw Boom.notFound("organisme de l'organisation non trouvé", {
      siret: organisationOF.siret,
      uai: organisationOF.uai,
    });
  }
  return organisme;
}

export async function getInvitationByToken(token: string): Promise<any> {
  const invitation = await invitationsDb().findOne({
    token,
  });
  if (!invitation) {
    throw Boom.notFound("Jeton d'invitation non valide");
  }
  const organisation = await getOrganisationById(invitation.organisation_id);
  return { ...invitation, organisation };
}

// utilitaires

async function getInvitationById(ctx: AuthContext, invitationId: ObjectId): Promise<Invitation> {
  const invitation = await invitationsDb().findOne<Invitation>({
    organisation_id: ctx.organisation_id, // filtrage pour restreindre les accès
    _id: invitationId,
  });
  if (!invitation) {
    throw Boom.notFound(`missing invitation ${invitationId}`);
  }
  return invitation;
}

export async function buildOrganisationLabel(organisationId: ObjectId): Promise<string> {
  const organisation = await getOrganisationById(organisationId);
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_RESPONSABLE":
    case "ORGANISME_FORMATION_RESPONSABLE_FORMATEUR": {
      const organisme = await organismesDb().findOne({ siret: organisation.siret, uai: organisation.uai });
      if (!organisme) {
        logger.error({ siret: organisation.siret, uai: organisation.uai }, "organisme de l'organisation non trouvé");
      }
      return `${organisme?.nom || organisme?.enseigne || organisme?.raison_sociale || "Organisme"} - SIRET : ${
        organisation.siret
      }, UAI : ${organisation.uai}`;
    }

    case "TETE_DE_RESEAU":
      return `Réseau ${organisation.reseau}`;

    case "DREETS":
      return `DREETS ${REGIONS_BY_ID[organisation.code_region]?.nom}`;
    case "DEETS":
      return `DEETS ${REGIONS_BY_ID[organisation.code_region]?.nom}`;
    case "DRAAF":
      return `DRAAF ${REGIONS_BY_ID[organisation.code_region]?.nom}`;
    case "CONSEIL_REGIONAL":
      return `Conseil régional ${REGIONS_BY_ID[organisation.code_region]?.nom}`;
    case "DDETS":
      return `DDETS ${DEPARTEMENTS_BY_ID[organisation.code_departement]?.nom}`;
    case "ACADEMIE":
      return `Académie ${ACADEMIES_BY_ID[organisation.code_academie]?.nom}`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;

    case "ADMINISTRATEUR":
      return "ADMINISTRATEUR";
  }
}
