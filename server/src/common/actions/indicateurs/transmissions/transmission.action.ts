import type { ObjectId } from "bson";
import { startOfDay, endOfDay } from "date-fns";
import { TransmissionStat } from "shared/models";

import { effectifsQueueDb } from "@/common/model/collections";

const groupPipeline = {
  total: {
    $sum: 1,
  },
  error: {
    $sum: { $cond: [{ $eq: ["$has_error", true] }, 1, 0] },
  },
  success: {
    $sum: { $cond: [{ $eq: ["$has_error", false] }, 1, 0] },
  },
};

export const getTransmissionRelatedToOrganismeByDate = async (organismeId: ObjectId): Promise<TransmissionStat[]> => {
  return await effectifsQueueDb()
    .aggregate<TransmissionStat>([
      {
        $match: {
          $or: [{ source_organisme_id: organismeId.toString() }, { organisme_id: organismeId }],
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$processed_at",
              },
            },
            source_organisme_id: "$source_organisme_id",
            organisme_id: "$organisme_id",
          },
          ...groupPipeline,
        },
      },
      {
        $addFields: {
          source_organisme_id: {
            $toObjectId: "$_id.source_organisme_id",
          },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "source_organisme_id",
          foreignField: "_id",
          as: "source_organisme",
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "_id.organisme_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          source_organisme: {
            $first: "$source_organisme",
          },
          organisme: {
            $first: "$organisme",
          },
          total: 1,
          error: 1,
          success: 1,
        },
      },
      {
        $project: {
          date: 1,
          source_organisme: {
            uai: "$source_organisme.uai",
            siret: "$source_organisme.siret",
            nom: "$source_organisme.nom",
          },
          organisme: {
            uai: "$organisme.uai",
            siret: "$organisme.siret",
            nom: "$organisme.nom",
          },
          total: 1,
          error: 1,
          success: 1,
        },
      },
      {
        $sort: {
          date: -1,
        },
      },
    ])
    .toArray();
};

export const getTransmissionStatusByOrganismeGroupedByDate = async (
  organismeId: string,
  page: number = 1,
  limit: number = 20
) => {
  const transmissions = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$processed_at",
            },
          },
          ...groupPipeline,
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
      {
        $project: {
          _id: 0,
          day: "$_id",
          success: "$success",
          error: "$error",
          total: "$total",
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

  if (!transmissions) {
    return {
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }
  if (transmissions?.pagination) {
    transmissions.pagination.lastPage = Math.ceil(transmissions.pagination.total / limit);
  }
  return transmissions;
};

export const getErrorsTransmissionStatusDetailsForAGivenDay = async (
  organismeId: string,
  day: string,
  page: number = 1,
  limit: number = 20
) => {
  const selectedDay = new Date(day);
  const start = startOfDay(selectedDay);
  const end = endOfDay(selectedDay);

  const aggregateUnknownOrganisme = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
          processed_at: {
            $gte: start,
            $lte: end,
          },
          validation_errors: {
            $exists: true,
          },
        },
      },
      {
        $facet: {
          numberErrors: [
            {
              $group: {
                _id: null,
                total: {
                  $sum: { $size: "$validation_errors" },
                },
              },
            },
            {
              $project: {
                total: "$total",
                _id: 0,
              },
            },
          ],
          lieu: [
            {
              $match: {
                validation_errors: {
                  $elemMatch: {
                    message: "organisme non trouvé",
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  uai: "$etablissement_lieu_de_formation_uai",
                  siret: "$etablissement_lieu_de_formation_siret",
                },
                effectifCount: {
                  $sum: 1,
                },
              },
            },
            {
              $project: {
                uai: "$_id.uai",
                siret: "$_id.siret",
                effectifCount: "$effectifCount",
                numberErrors: "$numberErrors",
                _id: 0,
              },
            },
          ],
          formateur: [
            {
              $match: {
                validation_errors: {
                  $elemMatch: {
                    message: "organisme formateur non trouvé",
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  uai: "$etablissement_formateur_uai",
                  siret: "$etablissement_formateur_siret",
                },
                effectifCount: {
                  $sum: 1,
                },
              },
            },
            {
              $project: {
                uai: "$_id.uai",
                siret: "$_id.siret",
                effectifCount: "$effectifCount",
                numberErrors: "$numberErrors",
                _id: 0,
              },
            },
          ],
          responsable: [
            {
              $match: {
                validation_errors: {
                  $elemMatch: {
                    message: "organisme responsable non trouvé",
                  },
                },
              },
            },
            {
              $group: {
                _id: {
                  uai: "$etablissement_responsable_uai",
                  siret: "$etablissement_responsable_siret",
                },
                effectifCount: {
                  $sum: 1,
                },
              },
            },
            {
              $project: {
                uai: "$_id.uai",
                siret: "$_id.siret",
                effectifCount: "$effectifCount",
                numberErrors: "$numberErrors",
                _id: 0,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          numberErrors: {
            $arrayElemAt: ["$numberErrors", 0],
          },
        },
      },
    ])
    .next();

  const transmissionsDetails = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
          processed_at: {
            $gte: start,
            $lte: end,
          },
          validation_errors: {
            $exists: true,
          },
        },
      },
      {
        $sort: {
          processed_at: 1,
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

  if (!transmissionsDetails) {
    return {
      summary: {},
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }

  if (transmissionsDetails?.pagination) {
    transmissionsDetails.pagination.lastPage = Math.ceil(transmissionsDetails.pagination.total / limit);
  }
  return {
    summary: aggregateUnknownOrganisme,
    ...transmissionsDetails,
  };
};

export const getSuccessfulTransmissionStatusDetailsForAGivenDay = async (
  organismeId: string,
  day: string,
  page: number = 1,
  limit: number = 20
) => {
  const selectedDay = new Date(day);
  const start = startOfDay(selectedDay);
  const end = endOfDay(selectedDay);

  const effectifCounts = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
          processed_at: {
            $gte: start,
            $lte: end,
          },
          effectif_id: {
            $exists: true,
          },
        },
      },
      {
        $count: "totalEffectifs",
      },
    ])
    .next();

  const transmissionsDetails = await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          source_organisme_id: organismeId,
          processed_at: {
            $gte: start,
            $lte: end,
          },
          effectif_id: {
            $exists: true,
          },
        },
      },
      {
        $group: {
          _id: "$organisme_id",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [
            {
              $skip: (page - 1) * limit,
            },
            {
              $limit: limit,
            },
            {
              $lookup: {
                from: "organismes",
                localField: "_id",
                foreignField: "_id",
                as: "orga",
                pipeline: [{ $project: { uai: 1, nom: 1, siret: 1, adresse: "$adresse.complete" } }],
              },
            },
            {
              $unwind: "$orga",
            },
            {
              $project: {
                id: "$_id",
                uai: "$orga.uai",
                name: "$orga.nom",
                siret: "$orga.siret",
                adresse: "$orga.adresse",
                effectifCount: "$count",
                _id: 0,
              },
            },
          ],
        },
      },
      {
        $unwind: "$pagination",
      },
    ])
    .next();

  if (!transmissionsDetails) {
    return {
      totalEffectifs: 0,
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }

  if (transmissionsDetails?.pagination) {
    transmissionsDetails.pagination.lastPage = Math.ceil(transmissionsDetails.pagination.total / limit);
  }
  return { ...transmissionsDetails, ...effectifCounts };
};

export const getAllTransmissionStatusGroupedByDate = async (page: number = 1, limit: number = 20) => {
  const aggr = [
    {
      $group: {
        _id: "$computed_day",
        ...groupPipeline,
      },
    },
    {
      $sort: {
        _id: -1,
      },
    },
    {
      $project: {
        _id: 0,
        day: "$_id",
        success: "$success",
        error: "$error",
        total: "$total",
      },
    },
    {
      $facet: {
        pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
      },
    },
    { $unwind: { path: "$pagination" } },
  ];
  const transmissions = await effectifsQueueDb().aggregate(aggr).next();
  console.log(JSON.stringify(aggr, null, 2));
  if (!transmissions) {
    return {
      pagination: {
        page,
        limit,
        lastPage: page,
        total: 0,
      },
      data: [],
    };
  }
  if (transmissions?.pagination) {
    transmissions.pagination.lastPage = Math.ceil(transmissions.pagination.total / limit);
  }
  return transmissions;
};

export const getAllErrorsTransmissionStatusGroupedByOrganismeForAGivenDay = async (selectedDay: Date) => {
  console.log(selectedDay);
  const start = startOfDay(selectedDay);
  const end = endOfDay(selectedDay);

  const transmissionsDetails = (await effectifsQueueDb()
    .aggregate([
      {
        $match: {
          processed_at: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: "$source_organisme_id",
          ...groupPipeline,
        },
      },
      {
        $addFields: {
          source_organisme_id: {
            $toObjectId: "$_id",
          },
        },
      },
      {
        $lookup: {
          from: "organismes",
          localField: "source_organisme_id",
          foreignField: "_id",
          as: "source_organisme",
        },
      },
      {
        $unwind: "$source_organisme",
      },
      {
        $project: {
          _id: 0,
          organisme_id: "$source_organisme._id",
          success: "$success",
          error: "$error",
          total: "$total",
        },
      },
    ])
    .toArray()) as Array<{
    organisme_id: ObjectId;
    success: number;
    error: number;
    total: number;
  }>;

  if (!transmissionsDetails) {
    return [];
  }
  return transmissionsDetails;
};

export const getAllTransmissionsDate = () => {
  return effectifsQueueDb().distinct("computed_day");
};
