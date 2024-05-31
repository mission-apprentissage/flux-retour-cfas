import { ObjectId } from "mongodb";

import { voeuxAffelnetDb } from "../model/collections";

export const getAffelnetVoeuxByOrganisme = async (organismeId: ObjectId, page: number = 0, limit: number = 20) => {
  const voeux = await voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          $or: [{ organisme_formateur_id: organismeId }, { organisme_responsable_id: organismeId }],
        },
      },
      {
        $project: {
          _id: 1,
          nom: "$raw.nom",
          prenom: "$raw.prenom_1",
          formation: "$_computed.formation",
          email_1: "$raw.mail_responsable_1",
          email_2: "$raw.mail_responsable_2",
          is_contacted: "$is_contacted",
        },
      },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  if (voeux?.pagination) {
    voeux.pagination.lastPage = Math.ceil(voeux.pagination.total / limit);
  }

  return voeux;
};
