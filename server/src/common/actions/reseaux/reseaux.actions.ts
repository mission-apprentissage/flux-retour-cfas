import { ObjectId } from "mongodb";

import { reseauxDb } from "@/common/model/collections";

export const getAllReseaux = async (
  query = {},
  { page, limit, sort } = { page: 1, limit: 100, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const result = await reseauxDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
    ])
    .next();

  if (result?.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  return result;
};

export const getReseauById = async (id: string) => {
  const result = await reseauxDb().findOne({ _id: new ObjectId(id) });
  return result;
};
