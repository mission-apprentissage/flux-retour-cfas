import Boom from "boom";
import { ObjectId } from "mongodb";

import {
  buildMongoPipelineFilterStages,
  EffectifsFiltersWithRestriction,
  LegacyEffectifsFilters,
  organismeLookup,
} from "@/common/actions/helpers/filters";
import {
  getIndicateursEffectifsRestriction,
  requireOrganismeIndicateursAccess,
} from "@/common/actions/helpers/permissions";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { mergeObjectsBy } from "@/common/utils/mergeObjectsBy";

import { IndicateursEffectifs } from "../indicateurs/indicateurs";

import {
  abandonsIndicator,
  apprentisIndicator,
  inscritsSansContratsIndicator,
  rupturantsIndicator,
} from "./indicators";

// ce helper est principalement appelé dans les routes des indicateurs agrégés et non scopés à un organisme, mais aussi pour un organisme :
// - si organisme_id, uai ou siret, indicateurs pour un organisme, on vérifie que l'organisation y a accès
// - si pas d'organisme_id, indicateurs agrégés, restriction classique
// TODO il faudra sortir organisme_id (et uai / siret) pour le spécifier dans une autre route /organismes/:id/indicateurs
// pour que les indicateurs ici ne soit que ceux agrégés
/**
 * Vérifie si l'utilisateur peut accéder à des indicateurs.
 * Selon le contexte et les filtres, peut compléter les filtres avec une restriction (un territoire par exemple)
 */
export async function checkIndicateursFiltersPermissions(
  ctx: AuthContext,
  filters: LegacyEffectifsFilters
): Promise<EffectifsFiltersWithRestriction> {
  if (filters.organisme_id) {
    await requireOrganismeIndicateursAccess(ctx, filters.organisme_id);
  } else if (filters.uai_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via uai
    const organisme = await organismesDb().findOne({
      uai: filters.uai_etablissement,
    });
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(ctx, organisme._id);
  } else if (filters.siret_etablissement) {
    // comme on a pas l'organisme_id on doit retrouver l'organisme via siret
    const organisme = await organismesDb().findOne({
      siret: filters.siret_etablissement,
    });
    if (!organisme) {
      throw Boom.notFound("Organisme non trouvé");
    }
    await requireOrganismeIndicateursAccess(ctx, organisme._id);
  } else {
    // amend filters with a restriction
    (filters as EffectifsFiltersWithRestriction).restrictionMongo = await getIndicateursEffectifsRestriction(ctx);
  }

  return filters;
}

export async function getOrganismeIndicateurs(
  ctx: AuthContext,
  organismeId: ObjectId,
  filters: LegacyEffectifsFilters
) {
  filters.organisme_id = organismeId;
  return await getIndicateurs(ctx, filters);
}

export const getIndicateurs = async (
  ctx: AuthContext,
  filters: LegacyEffectifsFilters
): Promise<IndicateursEffectifs> => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const filterStages = buildMongoPipelineFilterStages(filtersWithRestriction);
  const [apprentis, inscritsSansContrat, rupturants, abandons] = await Promise.all([
    apprentisIndicator.getCountAtDate(filters.date, filterStages),
    inscritsSansContratsIndicator.getCountAtDate(filters.date, filterStages),
    rupturantsIndicator.getCountAtDate(filters.date, filterStages),
    abandonsIndicator.getCountAtDate(filters.date, filterStages),
  ]);
  return {
    apprenants: apprentis + inscritsSansContrat,
    apprentis,
    inscritsSansContrat,
    rupturants,
    abandons,
  };
};

// Récupération des effectifs pour tous les indicateurs du TdB
export const getEffectifsCountAtDate = async (
  filters: any,
  { additionalFilterStages = [], groupedBy, projection }: any
) => {
  const filterStages: any = [...buildMongoPipelineFilterStages(filters), ...additionalFilterStages];
  // compute number of apprentis, abandons, inscrits sans contrat and rupturants
  const [apprentis, rupturants, inscritsSansContrat, abandons] = await Promise.all([
    apprentisIndicator.getCountAtDate(filters.date, filterStages, {
      projection,
      groupedBy: { ...groupedBy, apprentis: { $sum: 1 } },
    }),
    inscritsSansContratsIndicator.getCountAtDate(filters.date, filterStages, {
      projection,
      groupedBy: { ...groupedBy, inscritsSansContrat: { $sum: 1 } },
    }),
    rupturantsIndicator.getCountAtDate(filters.date, filterStages, {
      projection,
      groupedBy: { ...groupedBy, rupturants: { $sum: 1 } },
    }),
    abandonsIndicator.getCountAtDate(filters.date, filterStages, {
      projection,
      groupedBy: { ...groupedBy, abandons: { $sum: 1 } },
    }),
  ]);

  // merge apprentis, abandons, inscrits sans contrat and rupturants with same _id to have them grouped
  return mergeObjectsBy([...apprentis, ...inscritsSansContrat, ...rupturants, ...abandons], "_id");
};

// Méthode de récupération de la liste des effectifs en base
export const getAllEffectifs = async (
  query = {},
  { page, limit, sort } = { page: 1, limit: 10, sort: { created_at: -1 } as { [key: string]: number } }
) => {
  const result = await effectifsDb()
    .aggregate([
      { $match: query },
      { $sort: sort },
      { $project: { is_lock: 0 } },
      {
        $facet: {
          pagination: [{ $count: "total" }, { $addFields: { page, limit } }],
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        },
      },
      { $unwind: { path: "$pagination" } },
      {
        $lookup: {
          from: "organismes",
          localField: "data.organisme_id",
          foreignField: "_id",
          as: "_tmp_organismes",
          pipeline: [{ $project: { uai: 1, siret: 1, nom: 1, fiabilisation_statut: 1 } }],
        },
      },
    ])
    .next();

  // difficile de mettre le resultat d'un lookup sur un champ nested dans un array, du coup on le fait programmatiquement
  const organismesById = result?._tmp_organismes?.reduce(
    (acc, organisme) => ({
      [organisme._id]: organisme,
      ...acc,
    }),
    {}
  );
  result?.data.forEach((effectif) => {
    effectif.organisme = organismesById[effectif.organisme_id];
  });
  delete result?._tmp_organismes;

  if (result?.pagination) {
    result.pagination.lastPage = Math.ceil(result.pagination.total / limit);
  }
  return result;
};

// Méthode de récupération d'un effectif et de ses détails (formation, doublons, ...) depuis son id
export const getDetailedEffectifById = async (_id: any) => {
  const organisme = await effectifsDb()
    .aggregate(
      [
        { $match: { _id: new ObjectId(_id) } },
        // lookup formations
        {
          $lookup: {
            from: "formations",
            localField: "formation.formation_id",
            foreignField: "_id",
            as: "formation_detail",
          },
        },
        { $lookup: organismeLookup },
        { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },

        { $project: { is_lock: 0, organisme_id: 0 } },
        { $unwind: { path: "$formation_detail", preserveNullAndEmptyArrays: true } },
        // lookup effectifsQueue
        {
          $lookup: {
            from: "effectifsQueue",
            localField: "_id",
            foreignField: "effectif_id",
            as: "effectifsQueue",
          },
        },
        // lookup for doublons (including same apprenant, but different annee_scolaire)
        {
          $lookup: {
            from: "effectifs",
            as: "effectifsDoublon",
            let: {
              id: "$_id",
              source: "$source",
              id_erp_apprenant: "$id_erp_apprenant",
              nom: "$apprenant.nom",
              prenom: "$apprenant.prenom",
              date_de_naissance: "$apprenant.date_de_naissance",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $not: { $eq: ["$_id", "$$id"] } },
                      {
                        $or: [
                          {
                            $and: [
                              { $gt: ["$apprenant.nom", null] },
                              { $eq: ["$apprenant.nom", "$$nom"] },
                              { $gt: ["$apprenant.prenom", null] },
                              { $eq: ["$apprenant.prenom", "$$prenom"] },
                              { $gt: ["$apprenant.date_de_naissance", null] },
                              { $eq: ["$apprenant.date_de_naissance", "$$date_de_naissance"] },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  ...organismeLookup,
                  pipeline: [{ $project: { uai: 1, siret: 1, nom: 1, fiabilisation_statut: 1, created_at: 1 } }],
                },
              },
              { $unwind: { path: "$organisme", preserveNullAndEmptyArrays: true } },
              { $project: { is_lock: 0, organisme_id: 0 } },
            ],
          },
        },
      ],
      { collation: { locale: "simple", strength: 1 } }
    )
    .next();

  return organisme;
};
