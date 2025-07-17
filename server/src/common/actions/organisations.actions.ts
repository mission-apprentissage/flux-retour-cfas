import Boom from "boom";
import { format } from "date-fns";
import { ObjectId, WithId } from "mongodb";
import { REGIONS_BY_CODE, DEPARTEMENTS_BY_CODE, withOrganismeListSummary, getAcademieByCode } from "shared";
import { IInvitation } from "shared/models/data/invitations.model";
import {
  IOrganisationCreate,
  IOrganisation,
  IOrganisationMissionLocale,
  IOrganisationARML,
  IOrganisationOrganismeFormation,
} from "shared/models/data/organisations.model";
import { IUsersMigration } from "shared/models/data/usersMigration.model";

import logger from "@/common/logger";
import {
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { sendEmail } from "@/common/services/mailer/mailer";
import { generateKey } from "@/common/utils/cryptoUtils";
import { getCurrentTime } from "@/common/utils/timeUtils";

import { OrganismeWithPermissions } from "./helpers/permissions-organisme";
import { getOrganismeProjection } from "./organismes/organismes.actions";
import { getUserById } from "./users.actions";

export async function createOrganisation(organisation: IOrganisationCreate): Promise<ObjectId> {
  const formatOrganisme = async (organisation) => {
    const organisme = await organismesDb().findOne({
      siret: organisation.siret,
      ...(organisation.uai ? { uai: organisation.uai } : {}),
    });

    return {
      ...organisation,
      organisme_id: organisme?._id.toString(),
    } as IOrganisationOrganismeFormation;
  };

  const formatDetaultOrganisation = (organisation: IOrganisationCreate) => {
    return organisation;
  };

  let data: IOrganisationCreate | null = null;

  switch (organisation.type) {
    case "ORGANISME_FORMATION":
      data = await formatOrganisme(organisation);
      break;
    default:
      data = formatDetaultOrganisation(organisation);
  }

  const { insertedId } = await organisationsDb().insertOne({
    _id: new ObjectId(),
    created_at: getCurrentTime(),
    ...data,
  });
  return insertedId;
}

export async function getOrganisationById(organisationId: ObjectId): Promise<IOrganisation> {
  const organisation = await organisationsDb().findOne<IOrganisation>({ _id: organisationId });
  if (!organisation) {
    throw Boom.notFound(`missing organisation ${organisationId}`);
  }
  return organisation;
}

export async function listOrganisationMembers(ctx: AuthContext): Promise<Partial<IUsersMigration[]>> {
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

export async function listContactsOrganisation(organisationId: ObjectId): Promise<Partial<IUsersMigration>[]> {
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

export async function inviteUserToOrganisation(
  ctx: AuthContext,
  email: string,
  organisation_id: ObjectId
): Promise<void> {
  const existingUser = await usersMigrationDb().findOne({
    email: email,
  });
  if (existingUser) {
    const sameOrganisation = existingUser.organisation_id.equals(organisation_id);
    throw Boom.badRequest(
      sameOrganisation
        ? "Cet utilisateur est déjà présent dans votre organisation..."
        : "Cet utilisateur est déjà présent dans une autre organisation. Si vous pensez que c'est une erreur, merci de contacter le support."
    );
  }
  const invitationToken = generateKey(50, "hex");
  await invitationsDb().insertOne({
    _id: new ObjectId(),
    organisation_id,
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
  const invitation = await getInvitationById(ctx, new ObjectId(invitationId));
  const res = await invitationsDb().deleteOne({
    organisation_id: ctx.organisation_id,
    _id: new ObjectId(invitationId),
  });
  if (res.deletedCount === 0) {
    throw Boom.forbidden("Permissions invalides");
  }
  await invitationsArchiveDb().insertOne(invitation);
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

  const userOrganisation = await getOrganisationById(user.organisation_id);

  await sendEmail(
    user.email,
    userOrganisation.type === "ORGANISME_FORMATION" ? "notify_access_granted_ofa" : "notify_access_granted",
    {
      recipient: {
        civility: user.civility,
        nom: user.nom,
        prenom: user.prenom,
      },
      organisationLabel: await buildOrganisationLabel(user.organisation_id),
    }
  );
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
  const { organisation } = ctx;
  if (organisation.type !== "ORGANISME_FORMATION") {
    throw Boom.forbidden("Permissions invalides");
  }

  const organisme = await organismesDb().findOne(
    {
      siret: organisation.siret,
      uai: organisation.uai as string,
    },
    {
      projection: getOrganismeProjection({
        viewContacts: true,
        infoTransmissionEffectifs: true,
        indicateursEffectifs: true,
        effectifsNominatifs: true,
        manageEffectifs: true,
        configurerModeTransmission: true,
      }),
    }
  );
  if (!organisme) {
    throw Boom.notFound("organisme de l'organisation non trouvé", {
      siret: organisation.siret,
      uai: organisation.uai,
    });
  }

  const organismesWithAdditionalData = withOrganismeListSummary(organisme);

  return {
    ...organismesWithAdditionalData,
    permissions: {
      viewContacts: true,
      infoTransmissionEffectifs: true,
      indicateursEffectifs: true,
      effectifsNominatifs: true,
      manageEffectifs: true,
      configurerModeTransmission: true,
    },
  };
}

export const getOrganisationOrganismeByOrganismeId = async (
  organismeId: ObjectId
): Promise<WithId<IOrganisationOrganismeFormation> | null> => {
  const found = await organisationsDb().findOne({
    organisme_id: organismeId.toString(),
    type: "ORGANISME_FORMATION",
  });

  if (!found) {
    const organisme = await organismesDb().findOne({
      _id: organismeId,
    });

    if (!organisme?.siret) {
      return null;
    }

    const id = await createOrganisation({
      type: "ORGANISME_FORMATION",
      uai: organisme?.uai ?? null,
      siret: organisme.siret ?? null,
    });

    return organisationsDb().findOne({
      _id: id,
      type: "ORGANISME_FORMATION",
    }) as Promise<WithId<IOrganisationOrganismeFormation>>;
  }

  return found as WithId<IOrganisationOrganismeFormation>;
};

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
  await invitationsArchiveDb().insertOne(invitation);
}

// utilitaires

async function getInvitationById(ctx: AuthContext, invitationId: ObjectId): Promise<IInvitation> {
  const invitation = await invitationsDb().findOne<IInvitation>({
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
    case "MISSION_LOCALE":
      return `Mission locale ${organisation.nom}`;
    case "ARML":
      return `ARML ${organisation.nom}`;
    case "ORGANISME_FORMATION": {
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
    case "DRAFPIC":
      return `DRAFPIC ${REGIONS_BY_CODE[organisation.code_region]?.nom}`;
    case "DDETS":
      return `DDETS ${DEPARTEMENTS_BY_CODE[organisation.code_departement]?.nom}`;
    case "ACADEMIE":
      return `Académie ${getAcademieByCode(organisation.code_academie)?.nom}`;

    case "OPERATEUR_PUBLIC_NATIONAL":
      return organisation.nom;
    case "CARIF_OREF_NATIONAL":
      return "CARIF OREF National";

    case "ADMINISTRATEUR":
      return "ADMINISTRATEUR";
  }
}

export const getAllMissionsLocales = async (): Promise<IOrganisationMissionLocale[]> => {
  const organisations = await organisationsDb().find<IOrganisationMissionLocale>({ type: "MISSION_LOCALE" }).toArray();
  if (!organisations) {
    throw Boom.notFound("Aucune mission locale trouvée");
  }
  return organisations;
};

export const getAllARML = async (): Promise<IOrganisationARML[]> => {
  const organisations = await organisationsDb().find<IOrganisationARML>({ type: "ARML" }).toArray();
  if (!organisations) {
    throw Boom.notFound("Aucune ARML trouvée");
  }
  return organisations;
};
