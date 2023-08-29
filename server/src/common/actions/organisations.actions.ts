import Boom from "boom";
import { format } from "date-fns";
import { ObjectId, WithId } from "mongodb";
import { REGIONS_BY_CODE, DEPARTEMENTS_BY_CODE, ACADEMIES_BY_CODE } from "shared";

import logger from "@/common/logger";
import { UsersMigration } from "@/common/model/@types/UsersMigration";
import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { Invitation } from "@/common/model/invitations.model";
import { NewOrganisation, Organisation } from "@/common/model/organisations.model";
import { sendEmail } from "@/common/services/mailer/mailer";
import { generateKey } from "@/common/utils/cryptoUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";

import { requireOrganisationOF } from "./helpers/permissions";
import { OrganismeWithPermissions } from "./helpers/permissions-organisme";
import { getOrganismeProjection } from "./organismes/organismes.actions";
import { getUserById } from "./users.actions";

export async function createOrganisation(organisation: NewOrganisation): Promise<ObjectId> {
  const { insertedId } = await organisationsDb().insertOne({
    created_at: getCurrentTime(),
    ...organisation,
  });
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

export async function listContactsOrganisation(organisationId: ObjectId): Promise<Partial<UsersMigration>[]> {
  return await usersMigrationDb()
    .find(
      {
        organisation_id: organisationId,
        account_status: "CONFIRMED",
      },
      {
        sort: {
          created_at: 1,
        },
        projection: {
          _id: 1,
          nom: 1,
          prenom: 1,
          email: 1,
          telephone: 1,
          fonction: 1,
          created_at: 1,
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
    author_id: ctx._id,
    created_at: getCurrentTime(),
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
  if (user.account_status === "CONFIRMED") {
    throw Boom.forbidden("Permissions invalides");
  }

  // seul un administrateur ou gestionnaire de l'organisation peut valider un utilisateur
  // un administrateur peut aussi valider un compte non vérifié par email
  if (ctx.organisation.type !== "ADMINISTRATEUR") {
    if (user.account_status !== "PENDING_ADMIN_VALIDATION" || !user.organisation_id.equals(ctx.organisation_id)) {
      throw Boom.forbidden("Permissions invalides");
    }
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
  if (user.account_status === "CONFIRMED") {
    throw Boom.forbidden("Permissions invalides");
  }

  // seul un administrateur ou gestionnaire de l'organisation peut valider un utilisateur
  // un administrateur peut aussi valider un compte non vérifié par email
  if (ctx.organisation.type !== "ADMINISTRATEUR") {
    if (user.account_status !== "PENDING_ADMIN_VALIDATION" || !user.organisation_id.equals(ctx.organisation_id)) {
      throw Boom.forbidden("Permissions invalides");
    }
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

export async function getOrganisationOrganisme(ctx: AuthContext): Promise<WithId<OrganismeWithPermissions>> {
  const organisationOF = requireOrganisationOF(ctx);

  const organisme = await organismesDb().findOne(
    {
      siret: organisationOF.siret,
      uai: organisationOF.uai as string,
    },
    {
      projection: getOrganismeProjection(true),
    }
  );
  if (!organisme) {
    throw Boom.notFound("organisme de l'organisation non trouvé", {
      siret: organisationOF.siret,
      uai: organisationOF.uai,
    });
  }
  return {
    ...organisme,
    permissions: {
      viewContacts: true,
      infoTransmissionEffectifs: true,
      indicateursEffectifs: true,
      effectifsNominatifs: true,
      manageEffectifs: true,
    },
  };
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

export async function rejectInvitation(token: string): Promise<void> {
  const invitation = await invitationsDb().findOne({
    token,
  });
  if (!invitation) {
    throw Boom.notFound("Jeton d'invitation non valide");
  }
  // peut être non défini avec les anciennes invitations
  // condition à supprimer quand author_id sera défini pour toutes les invitations en prod
  if (invitation.author_id) {
    const author = await getUserById(invitation.author_id);
    await sendEmail(author.email, "notify_invitation_rejected", {
      recipient: {
        civility: author.civility,
        nom: author.nom,
        prenom: author.prenom,
      },
      invitation: {
        date: format(invitation.created_at, "dd/MM/yyyy"),
        email: invitation.email,
      },
    });
  }
  await invitationsDb().deleteOne({
    token,
  });
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
      const organisme = await organismesDb().findOne({
        siret: organisation.siret,
        ...(organisation.uai ? { uai: organisation.uai } : {}),
      });
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
      return `DREETS ${REGIONS_BY_CODE[organisation.code_region]?.nom}`;
    case "DRAAF":
      return `DRAAF ${REGIONS_BY_CODE[organisation.code_region]?.nom}`;
    case "CONSEIL_REGIONAL":
      return `Conseil régional ${REGIONS_BY_CODE[organisation.code_region]?.nom}`;
    case "CARIF_OREF_REGIONAL":
      return `CARIF OREF ${REGIONS_BY_CODE[organisation.code_region]?.nom}`;
    case "DDETS":
      return `DDETS ${DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom}`;
    case "ACADEMIE":
      return `Académie ${ACADEMIES_BY_CODE[organisation.code_academie]?.nom}`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;
    case "CARIF_OREF_NATIONAL":
      return "CARIF OREF National";

    case "ADMINISTRATEUR":
      return "ADMINISTRATEUR";
  }
}
