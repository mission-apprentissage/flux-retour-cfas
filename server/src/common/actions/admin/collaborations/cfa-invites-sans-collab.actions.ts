import type {
  ICfaInvitesSansCollabQuery,
  ICfaInvitesSansCollabResponse,
} from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { missionLocaleCfaInvitationsDb } from "@/common/model/collections";

const SORT_STAGES: Record<ICfaInvitesSansCollabQuery["sort_by"], (direction: 1 | -1) => Record<string, 1 | -1>> = {
  invitations: (direction) => ({ invitations_recues: direction, derniere_invitation_at: -1, siret: 1, _id: 1 }),
  localisation: (direction) => ({ "adresse.code_postal": direction, "adresse.commune": direction, siret: 1, _id: 1 }),
};

export async function getCfaInvitesSansCollab(
  query: ICfaInvitesSansCollabQuery
): Promise<ICfaInvitesSansCollabResponse> {
  const { page, limit, sort_by, sort_order } = query;
  const direction = sort_order === "asc" ? 1 : -1;

  const result = await missionLocaleCfaInvitationsDb()
    .aggregate([
      {
        $group: {
          _id: "$organisme_id",
          siret: { $first: "$siret" },
          uai: { $first: "$uai" },
          invitations_recues: { $sum: 1 },
          mission_locale_ids: { $addToSet: "$mission_locale_id" },
          derniere_invitation_at: { $max: "$created_at" },
        },
      },
      {
        $lookup: {
          from: "missionLocaleEffectif",
          let: { organismeId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$effectif_snapshot.organisme_id", "$$organismeId"] },
                "organisme_data.acc_conjoint": true,
                soft_deleted: { $ne: true },
              },
            },
            { $limit: 1 },
            { $project: { _id: 1 } },
          ],
          as: "collaborations",
        },
      },
      { $match: { collaborations: { $size: 0 } } },
      {
        $lookup: {
          from: "organismes",
          localField: "_id",
          foreignField: "_id",
          pipeline: [{ $project: { nom: 1, raison_sociale: 1, enseigne: 1, adresse: 1 } }],
          as: "organisme",
        },
      },
      { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          organisme_id: { $toString: "$_id" },
          siret: 1,
          uai: { $ifNull: ["$uai", null] },
          raison_sociale: {
            $ifNull: ["$organisme.nom", "$organisme.raison_sociale", "$organisme.enseigne", null],
          },
          adresse: {
            $cond: [
              { $eq: [{ $ifNull: ["$organisme.adresse", null] }, null] },
              null,
              {
                code_postal: { $ifNull: ["$organisme.adresse.code_postal", null] },
                commune: { $ifNull: ["$organisme.adresse.commune", null] },
                complete: { $ifNull: ["$organisme.adresse.complete", null] },
              },
            ],
          },
          invitations_recues: 1,
          ml_invitantes: { $size: "$mission_locale_ids" },
          derniere_invitation_at: 1,
        },
      },
      {
        $facet: {
          total: [{ $count: "count" }],
          data: [{ $sort: SORT_STAGES[sort_by](direction) }, { $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
    ])
    .next();

  const total: number = result?.total?.[0]?.count ?? 0;

  return {
    total,
    pagination: { page, limit, total_pages: Math.ceil(total / limit) },
    data: result?.data ?? [],
  };
}
