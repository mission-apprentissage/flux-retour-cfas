import { ObjectId } from "mongodb";

import { voeuxAffelnetDb } from "../model/collections";

const directionMap = {
  ASC: 1,
  DESC: -1,
};

const computeSort = (sort, direction) => {
  const defaultSort = {
    "data.raw.rang": 1,
    "data.raw.nom": 1,
    "data.raw.prenom": 1,
  };

  switch (sort) {
    case "nom":
      return {
        "data.raw.nom": directionMap[direction],
      };
    case "prenom":
      return {
        "data.raw.prenom": directionMap[direction],
      };
    case "rang":
      return {
        "data.raw.rang": directionMap[direction],
      };
    case "formation":
      return {
        "data._computed.formation.libelle": directionMap[direction],
      };
    default:
      return defaultSort;
  }
};

export const getAffelnetVoeuxByOrganisme = async (
  organismeId: ObjectId,
  page: number = 1,
  limit: number = 20,
  sort: string,
  direction: string
) => {
  const computedSort = computeSort(sort, direction);
  const voeux = await voeuxAffelnetDb()
    .aggregate([
      {
        $match: {
          $or: [{ organisme_formateur_id: organismeId }, { organisme_responsable_id: organismeId }],
        },
      },
      {
        $group: {
          _id: "$voeu_id",
          data: {
            $top: {
              output: "$$ROOT",
              sortBy: {
                revision: -1,
              },
            },
          },
        },
      },
      {
        $match: {
          "data.deleted_at": { $exists: false },
        },
      },
      {
        $sort: computedSort,
      },
      {
        $project: {
          _id: 1,
          nom: "$data.raw.nom",
          prenom: "$data.raw.prenom_1",
          rang: "$data.raw.rang",
          formation: "$data._computed.formation",
          email_1: "$data.raw.mail_responsable_1",
          email_2: "$data.raw.mail_responsable_2",
          is_contacted: "$data.is_contacted",
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
