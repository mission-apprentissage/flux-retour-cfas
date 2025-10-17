import { IEffectif } from "shared/models";

import logger from "@/common/logger";
import { franceTravailEffectifsDb, organisationsDb } from "@/common/model/collections";

import { getRomeByRncp } from "../rome/rome.actions";

export const createFranceTravailEffectif = () => {};

export const getFranceTravailOrganisationByCodeRegion = async (codeRegion: string) => {
  const orga = await organisationsDb().findOne({ type: "FRANCE_TRAVAIL", code_region: codeRegion });
  return orga;
};

export const getFranceTravailEffectifsByCodeRome = async (
  codeRome: string,
  codeRegion?: string,
  options?: {
    page: number;
    limit: number;
    search?: string;
    sort?: "jours_sans_contrat" | "nom" | "organisme";
    order?: "asc" | "desc";
  }
) => {
  try {
    const isValidRomeCode = /^[A-Z]\d{4}$/.test(codeRome);
    if (!isValidRomeCode) {
      throw new Error(`Invalid ROME code format: ${codeRome}. Expected format: [A-Z][0-9]{4}`);
    }

    const query: Record<string, any> = { [`ft_data.${codeRome}`]: { $exists: true } };

    if (codeRegion) {
      query.code_region = codeRegion;
    }

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = options?.search;
    const sort = options?.sort ?? "jours_sans_contrat";
    const order = options?.order ?? "desc";

    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "organismes",
          localField: "effectif_snapshot.organisme_id",
          foreignField: "_id",
          as: "organisme",
        },
      },
      {
        $unwind: {
          path: "$organisme",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          jours_sans_contrat: {
            $dateDiff: {
              startDate: "$current_status.date",
              endDate: new Date(),
              unit: "day",
            },
          },
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "effectif_snapshot.apprenant.nom": { $regex: search, $options: "i" } },
            { "effectif_snapshot.apprenant.prenom": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    const sortDirection = order === "asc" ? 1 : -1;
    const sortStage: Record<string, 1 | -1> = {};
    switch (sort) {
      case "jours_sans_contrat":
        sortStage.jours_sans_contrat = sortDirection;
        break;
      case "nom":
        sortStage["effectif_snapshot.apprenant.nom"] = sortDirection;
        sortStage["effectif_snapshot.apprenant.prenom"] = sortDirection;
        break;
      case "organisme":
        sortStage["organisme.nom"] = sortDirection;
        break;
    }

    pipeline.push({ $sort: sortStage });

    pipeline.push({
      $facet: {
        results: [
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              created_at: 1,
              effectif_id: 1,
              effectif_snapshot: 1,
              code_region: 1,
              current_status: 1,
              ft_data: 1,
              jours_sans_contrat: 1,
              organisme: {
                _id: "$organisme._id",
                nom: "$organisme.nom",
                raison_sociale: "$organisme.raison_sociale",
                enseigne: "$organisme.enseigne",
              },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    });

    pipeline.push({
      $project: {
        results: "$results",
        total: { $arrayElemAt: ["$totalCount.count", 0] },
      },
    });

    const [data] = await franceTravailEffectifsDb().aggregate(pipeline).toArray();

    const total = data?.total || 0;

    return {
      effectifs: data?.results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error("Error in getFranceTravailEffectifsByCodeRome", { codeRome, codeRegion, options, error });
    throw error;
  }
};

export const createFranceTravailEffectifSnapshot = async (effectif: IEffectif) => {
  const currentStatus =
    effectif._computed?.statut?.parcours.filter((statut) => statut.date <= new Date()).slice(-1)[0] ||
    effectif._computed?.statut?.parcours.slice(-1)[0];
  const effectifCodeRegion = effectif?.apprenant?.adresse?.region;

  if (!effectifCodeRegion) {
    return;
  }

  const inscritFilter = currentStatus?.valeur === "INSCRIT";
  const romes = await getRomeByRncp(effectif.formation?.rncp);
  const ftData = romes.reduce((acc, curr) => ({ ...acc, [curr]: null }), {});
  try {
    await franceTravailEffectifsDb().findOneAndUpdate(
      {
        _id: effectif._id,
      },
      {
        $set: {
          current_status: {
            value: currentStatus?.valeur || null,
            date: currentStatus?.date || null,
          },
        },
        $setOnInsert: {
          created_at: new Date(),
          effectif_id: effectif._id,
          effectif_snapshot: effectif,
          effectif_snapshot_date: new Date(),
          code_region: effectif?.apprenant?.adresse?.region,
          ft_data: ftData,
        },
      },
      { upsert: !!inscritFilter }
    );
  } catch (e) {
    logger.error(e);
    console.error("Error while creating France Travail effectif snapshot", e);
  }
};
