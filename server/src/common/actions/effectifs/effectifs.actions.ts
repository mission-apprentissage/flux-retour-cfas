import Boom from "boom";
import { format } from "date-fns";
import { ObjectId } from "mongodb";

import {
  buildMongoPipelineFilterStages,
  EffectifsFiltersWithRestriction,
  LegacyEffectifsFilters,
  organismeLookup,
} from "@/common/actions/helpers/filters";
import {
  getEffectifsAnonymesRestriction,
  getIndicateursEffectifsRestriction,
  requireOrganismeIndicateursAccess,
} from "@/common/actions/helpers/permissions";
import { DEPARTEMENTS_BY_CODE } from "@/common/constants/territoires";
import { effectifsDb, organismesDb } from "@/common/model/collections";
import { AuthContext } from "@/common/model/internal/AuthContext";
import { getAnneesScolaireListFromDate } from "@/common/utils/anneeScolaireUtils";
import { tryCachedExecution } from "@/common/utils/cacheUtils";
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

/**
 * Récupération des effectifs pour tous les indicateurs du TdB
 * @param {*} filters
 * @param {*} options
 * @returns
 */
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

/**
 * Récupération des effectifs par niveau de formation à une date donnée
 * @param {*} filters
 * @returns [{
 *  niveau_formation: string
 *  niveau_formation_libelle: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountByNiveauFormationAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  // compute number of apprentis, abandons, inscrits sans contrat and rupturants
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const effectifsByNiveauFormation = await getEffectifsCountAtDate(filtersWithRestriction, {
    additionalFilterStages: [{ $match: { "formation.niveau": { $ne: null } } }],
    projection: { "formation.niveau": 1, "formation.niveau_libelle": 1 },
    groupedBy: { _id: "$formation.niveau", niveau_libelle: { $first: "$formation.niveau_libelle" } },
  });

  return effectifsByNiveauFormation.map(({ _id: niveauFormation, niveau_libelle, ...effectifs }: any) => ({
    niveau_formation: niveauFormation,
    niveau_formation_libelle: niveau_libelle,
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

/**
 * Récupération des effectifs par formation à une date donnée
 * @param {*} filters
 * @returns [{
 *  formation_cfd: string
 *  intitule: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountByFormationAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const effectifsByFormation = await getEffectifsCountAtDate(filtersWithRestriction, {
    projection: { "formation.cfd": 1, "formation.libelle_long": 1 },
    groupedBy: {
      _id: "$formation.cfd",
      // we will send formation.libelle_long along with the grouped effectifs so we need to project it
      libelle_long_formation: { $first: "$formation.libelle_long" },
    },
  });

  return effectifsByFormation.map(({ _id: cfd, libelle_long_formation, ...effectifs }: any) => ({
    formation_cfd: cfd,
    intitule: libelle_long_formation,
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

/**
 * Récupération des effectifs par annee_formation à une date donnée
 * @param {*} filters
 * @returns [{
 *  annee_formation: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountByAnneeFormationAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const effectifsByAnneeFormation = await getEffectifsCountAtDate(filtersWithRestriction, {
    projection: { "formation.annee": 1 },
    groupedBy: { _id: "$formation.annee" },
  });

  return effectifsByAnneeFormation.map(({ _id: anneeFormation, ...effectifs }: any) => ({
    annee_formation: anneeFormation,
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

/**
 * Récupération des effectifs par uai_etablissement à une date donnée
 * @param {*} filters
 * @returns [{
 *  uai_etablissement: string
 *  siret_etablissement: string
 *  nom_etablissement: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountByCfaAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  // on descend au niveau des organismes, donc restriction comme pour les effectifs anonymes
  (filters as EffectifsFiltersWithRestriction).restrictionMongo = await getEffectifsAnonymesRestriction(ctx);
  const effectifsCountByCfa = await getEffectifsCountAtDate(filters, {
    // we need to project these fields to give information about the CFAs
    additionalFilterStages: [{ $lookup: organismeLookup }],
    projection: {
      "organisme.uai": 1,
      "organisme.siret": 1,
      "organisme.nom": 1,
      "organisme.nature": 1,
      "organisme.nature_validity_warning": 1,
    },
    groupedBy: {
      _id: { $first: "$organisme.uai" },
      // we will send information about the organisme along with the grouped effectifs so we project it
      nom_etablissement: { $first: { $first: "$organisme.nom" } },
      siret_etablissement: { $first: { $first: "$organisme.siret" } },
      nature: { $first: { $first: "$organisme.nature" } },
      nature_validity_warning: { $first: { $first: "$organisme.nature_validity_warning" } },
    },
  });
  return effectifsCountByCfa.map(
    ({ _id: uai, nom_etablissement, siret_etablissement, nature, nature_validity_warning, ...effectifs }: any) => ({
      uai_etablissement: uai,
      siret_etablissement,
      nom_etablissement,
      nature,
      nature_validity_warning,
      effectifs: {
        apprentis: effectifs.apprentis || 0,
        inscritsSansContrat: effectifs.inscritsSansContrat || 0,
        rupturants: effectifs.rupturants || 0,
        abandons: effectifs.abandons || 0,
      },
    })
  );
};

/**
 * Récupération des effectifs par siret_etablissement à une date donnée
 * @param {*} filters
 * @returns [{
 *  siret_etablissement: string
 *  nom_etablissement: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountBySiretAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const effectifsCountByCfa = await getEffectifsCountAtDate(filtersWithRestriction, {
    additionalFilterStages: [{ $lookup: organismeLookup }, { $match: { "organisme.siret": { $ne: null } } }],
    // we need to project these fields to give information about the CFAs
    projection: {
      "organisme.siret": 1,
      "organisme.nom": 1,
    },
    groupedBy: {
      _id: { $first: "$organisme.siret" },
      // we will send information about the organisme along with the grouped effectifs so we project it
      nom_etablissement: { $first: { $first: "$organisme.nom" } },
    },
  });

  return effectifsCountByCfa.map(({ _id: siret, nom_etablissement, ...effectifs }: any) => ({
    siret_etablissement: siret,
    nom_etablissement,
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

/**
 * Récupération des effectifs par etablissement_num_departement à une date donnée
 * @param {*} filters
 * @returns [{
 *  etablissement_num_departement: string
 *  etablissement_nom_departement: string
 *  effectifs: {
 *    apprentis: number
 *    inscritsSansContrat: number
 *    rupturants: number
 *    abandons: number
 *  }
 * }]
 */
export const getEffectifsCountByDepartementAtDate = async (ctx: AuthContext, filters: LegacyEffectifsFilters) => {
  const filtersWithRestriction = await checkIndicateursFiltersPermissions(ctx, filters);
  const effectifsCountByDepartement = await getEffectifsCountAtDate(filtersWithRestriction, {
    additionalFilterStages: [{ $lookup: organismeLookup }],
    projection: {
      "organisme.adresse.departement": 1,
    },
    groupedBy: {
      _id: { $first: "$organisme.adresse.departement" },
    },
  });

  return effectifsCountByDepartement.map(({ _id: codeDepartement, ...effectifs }: any) => ({
    etablissement_num_departement: codeDepartement,
    etablissement_nom_departement: DEPARTEMENTS_BY_CODE[codeDepartement]?.nom || "Inconnu",
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

const indicateursNationalCacheExpirationMs = 3600 * 1000; // 1 hour

export async function getIndicateursNational(date: Date) {
  return await tryCachedExecution(
    `indicateurs-national:${format(date, "yyyy-MM-dd")}`,
    indicateursNationalCacheExpirationMs,
    async () => {
      const filterStages = [{ $match: { annee_scolaire: { $in: getAnneesScolaireListFromDate(date) } } }];
      const [indicateurs, totalOrganismes] = await Promise.all([
        (async () => {
          const [apprentis, inscritsSansContrat, rupturants, abandons] = await Promise.all([
            apprentisIndicator.getCountAtDate(date, filterStages),
            inscritsSansContratsIndicator.getCountAtDate(date, filterStages),
            rupturantsIndicator.getCountAtDate(date, filterStages),
            abandonsIndicator.getCountAtDate(date, filterStages),
          ]);
          return {
            date,
            apprentis,
            inscritsSansContrat,
            rupturants,
            abandons,
          };
        })(),
        (async () => {
          const distinctOrganismes = await effectifsDb().distinct("organisme_id", {
            annee_scolaire: { $in: getAnneesScolaireListFromDate(date) },
          });
          return distinctOrganismes ? distinctOrganismes.length : 0;
        })(),
      ]);
      return { ...indicateurs, totalOrganismes };
    }
  );
}
/**
 * Méthode de récupération de la liste des effectifs en base
 * @param {*} query
 * @returns
 */
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

/**
 * Méthode de récupération d'un effectif et de ses détails (formation, doublons, ...) depuis son id
 * @param {*} _id
 * @returns
 */
export const getDetailedEffectifById = async (_id) => {
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
