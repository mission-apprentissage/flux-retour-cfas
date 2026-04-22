import Boom from "boom";
import { format } from "date-fns";
import { ObjectId } from "mongodb";

import { INVITATION_EXPIRATION_MS } from "@/common/actions/organisations.actions";
import {
  invitationsArchiveDb,
  invitationsDb,
  organisationsDb,
  organismesDb,
  usersMigrationDb,
} from "@/common/model/collections";
import { sendEmail } from "@/common/services/mailer/mailer";
import { getCurrentTime } from "@/common/utils/timeUtils";

export type InvitationStatus = "pending" | "consumed";

export interface ListAdminInvitationsParams {
  status: InvitationStatus;
  type?: string;
  role?: "admin" | "member";
  organisation_id?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

const escapeRegex = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function parseSort(sort?: string): { field: string; order: 1 | -1 } {
  if (!sort) return { field: "created_at", order: -1 };
  const [field, dir] = sort.split(":");
  return { field, order: dir === "1" ? 1 : -1 };
}

export async function listAdminInvitations(params: ListAdminInvitationsParams) {
  const { status, type, role, organisation_id, search, page = 1, limit = 20, sort } = params;
  const { field, order } = parseSort(sort);

  const collection = status === "pending" ? invitationsDb() : invitationsArchiveDb();

  const match: Record<string, any> = {};
  if (role) match.role = role;
  if (organisation_id) match.organisation_id = new ObjectId(organisation_id);

  const pipeline: any[] = [{ $match: match }];

  pipeline.push(
    {
      $lookup: {
        from: "organisations",
        localField: "organisation_id",
        foreignField: "_id",
        as: "organisation",
        pipeline: [
          {
            $lookup: {
              from: "organismes",
              as: "organisme",
              let: { uai: "$uai", siret: "$siret" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [{ $eq: ["$siret", "$$siret"] }, { $eq: ["$uai", "$$uai"] }],
                    },
                  },
                },
                {
                  $project: {
                    nom: 1,
                    raison_sociale: 1,
                    enseigne: 1,
                    siret: 1,
                    uai: 1,
                  },
                },
              ],
            },
          },
          { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
          { $project: { type: 1, nom: 1, siret: 1, uai: 1, organisme: 1 } },
        ],
      },
    },
    { $unwind: { path: "$organisation", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "usersMigration",
        localField: "author_id",
        foreignField: "_id",
        as: "author",
        pipeline: [{ $project: { email: 1, nom: 1, prenom: 1 } }],
      },
    },
    { $unwind: { path: "$author", preserveNullAndEmptyArrays: true } }
  );

  if (type) {
    pipeline.push({ $match: { "organisation.type": type } });
  }

  if (search && search.trim()) {
    const esc = escapeRegex(search.trim());
    pipeline.push({
      $match: {
        $or: [
          { email: { $regex: esc, $options: "i" } },
          { nom: { $regex: esc, $options: "i" } },
          { prenom: { $regex: esc, $options: "i" } },
          { "organisation.nom": { $regex: esc, $options: "i" } },
          { "organisation.siret": { $regex: esc, $options: "i" } },
          { "organisation.organisme.nom": { $regex: esc, $options: "i" } },
          { "organisation.organisme.enseigne": { $regex: esc, $options: "i" } },
          { "organisation.organisme.raison_sociale": { $regex: esc, $options: "i" } },
        ],
      },
    });
  }

  const countPipeline = [...pipeline, { $count: "total" }];
  const [countResult] = await collection.aggregate(countPipeline).toArray();
  const total = countResult?.total ?? 0;

  pipeline.push({ $sort: { [field]: order } }, { $skip: (page - 1) * limit }, { $limit: limit }, { $unset: "token" });

  const data = await collection.aggregate(pipeline).toArray();

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      lastPage: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function cancelAdminInvitation(invitationId: string): Promise<void> {
  const { deletedCount } = await invitationsDb().deleteOne({ _id: new ObjectId(invitationId) });
  if (deletedCount === 0) {
    throw Boom.notFound("Invitation introuvable ou déjà consommée");
  }
}

export async function resendAdminInvitation(invitationId: string): Promise<{ email: string; expiresAt: Date }> {
  const invitation = await invitationsDb().findOne({ _id: new ObjectId(invitationId) });
  if (!invitation) {
    throw Boom.notFound("Invitation introuvable ou déjà consommée");
  }

  const organisation = await organisationsDb().findOne({ _id: invitation.organisation_id });
  if (!organisation) {
    throw Boom.notFound("Organisation introuvable");
  }

  const newExpiresAt = new Date(Date.now() + INVITATION_EXPIRATION_MS);
  await invitationsDb().updateOne({ _id: invitation._id }, { $set: { expires_at: newExpiresAt } });

  if (organisation.type === "ORGANISME_FORMATION") {
    const organisme = await organismesDb().findOne({
      siret: organisation.siret,
      ...(organisation.uai ? { uai: organisation.uai } : {}),
    });
    const cfaName = organisme?.nom || organisme?.enseigne || organisme?.raison_sociale || "Organisme";

    if (invitation.role === "admin") {
      await sendEmail(invitation.email, "invitation_cfa_admin", {
        recipient: { prenom: invitation.prenom || "", nom: invitation.nom || "" },
        cfaName,
        cfaCity: organisme?.adresse?.commune || "",
        cfaPostalCode: organisme?.adresse?.code_postal || "",
        requestDate: format(getCurrentTime(), "dd/MM/yyyy"),
        invitationToken: invitation.token,
      });
    } else {
      const author = invitation.author_id
        ? await usersMigrationDb().findOne(
            { _id: invitation.author_id },
            { projection: { prenom: 1, nom: 1, fonction: 1 } }
          )
        : null;
      await sendEmail(invitation.email, "invitation_cfa_member", {
        admin: {
          prenom: author?.prenom || "Administrateur",
          nom: author?.nom || "",
          fonction: author?.fonction || "",
        },
        cfaName,
        invitationToken: invitation.token,
      });
    }
  } else {
    const author = invitation.author_id
      ? await usersMigrationDb().findOne(
          { _id: invitation.author_id },
          { projection: { civility: 1, prenom: 1, nom: 1, email: 1 } }
        )
      : null;
    const organisationLabel =
      organisation.type === "MISSION_LOCALE"
        ? `Mission locale ${(organisation as any).nom ?? ""}`
        : organisation.type === "FRANCE_TRAVAIL"
          ? "France Travail"
          : organisation.type;
    await sendEmail(invitation.email, "invitation_organisation", {
      author: {
        civility: author?.civility,
        nom: author?.nom || "",
        prenom: author?.prenom || "",
        email: author?.email || "",
      },
      organisationLabel,
      invitationToken: invitation.token,
    });
  }

  return { email: invitation.email, expiresAt: newExpiresAt };
}

export async function getOrganisationCounts(organisationId: string): Promise<{
  usersTotal: number;
  usersAdmin: number;
  invitationsPending: number;
}> {
  const orgId = new ObjectId(organisationId);
  const [usersTotal, usersAdmin, invitationsPending] = await Promise.all([
    usersMigrationDb().countDocuments({ organisation_id: orgId, account_status: "CONFIRMED" }),
    usersMigrationDb().countDocuments({
      organisation_id: orgId,
      account_status: "CONFIRMED",
      organisation_role: "admin",
    }),
    invitationsDb().countDocuments({ organisation_id: orgId }),
  ]);
  return { usersTotal, usersAdmin, invitationsPending };
}

export async function getOrganismeCounts(organismeId: string): Promise<{
  organisation_id: string | null;
  usersTotal: number;
  usersAdmin: number;
  invitationsPending: number;
}> {
  const organisation = await organisationsDb().findOne({
    organisme_id: organismeId,
    type: "ORGANISME_FORMATION",
  });
  if (!organisation) {
    return { organisation_id: null, usersTotal: 0, usersAdmin: 0, invitationsPending: 0 };
  }
  const counts = await getOrganisationCounts(organisation._id.toString());
  return { organisation_id: organisation._id.toString(), ...counts };
}
