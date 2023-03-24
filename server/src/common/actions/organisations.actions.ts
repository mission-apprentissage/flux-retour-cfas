import Boom from "boom";
import { ObjectId } from "mongodb";
import { REGIONS_BY_ID, DEPARTEMENTS_BY_ID, ACADEMIES_BY_ID } from "../constants/territoiresConstants.js";
import { UsersMigration } from "../model/@types/UsersMigration.js";

import { invitationsDb, organisationsDb, organismesDb, usersMigrationDb } from "../model/collections.js";
import { AuthContext } from "../model/internal/AuthContext.js";
import { Organisation } from "../model/organisations.model.js";
import { generateKey } from "../utils/cryptoUtils.js";
import { sendSimpleEmail } from "../services/mailer/mailer.js";

export async function createOrganisation(organisation: Organisation): Promise<ObjectId> {
  const { insertedId } = await organisationsDb().insertOne(organisation);
  return insertedId;
}

export async function getOrganisationById(organisationId: ObjectId): Promise<Organisation> {
  const organisation = await organisationsDb().findOne<Organisation>({ _id: organisationId });
  if (!organisation) {
    throw Boom.notFound(`missing organisation ${organisationId}`);
  }
  return organisation;
}

export async function listOrganisationMembers(organisationId: ObjectId): Promise<Partial<UsersMigration[]>> {
  return await usersMigrationDb()
    .find(
      {
        organisation_id: organisationId,
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
  const invitationToken = generateKey();
  await invitationsDb().insertOne({
    organisation_id: ctx.organisation_id,
    email,
    token: invitationToken,
    created_at: new Date(),
  });

  await sendSimpleEmail(email, "invitation_organisation", {
    author: {
      civility: ctx.civility,
      nom: ctx.nom,
      prenom: ctx.prenom,
      email: ctx.email,
    },
    organisationLabel: await buildOrganisationLabel(ctx.organisation),
    invitationToken,
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

async function buildOrganisationLabel(organisation: Organisation): Promise<string> {
  switch (organisation.type) {
    case "ORGANISME_FORMATION_FORMATEUR":
    case "ORGANISME_FORMATION_REPONSABLE":
    case "ORGANISME_FORMATION_REPONSABLE_FORMATEUR": {
      const organisme = await organismesDb().findOne({ siret: organisation.siret, uai: organisation.uai });
      return `${organisme?.nom} - SIRET : ${organisation.siret}, UAI :${organisation.uai}`;
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
