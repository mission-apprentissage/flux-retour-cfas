import { EFFECTIF_INDICATOR_NAMES } from "../../constants/dossierApprenantConstants.js";
import { buildMongoPipelineFilterStages, organismeLookup } from "../helpers/filters.js";
import { mergeObjectsBy } from "../../utils/mergeObjectsBy.js";
import { DEPARTEMENTS_BY_ID } from "../../constants/territoiresConstants.js";
import {
  abandonsIndicator,
  apprentisIndicator,
  inscritsSansContratsIndicator,
  rupturantsIndicator,
} from "./indicators.js";
import { effectifsDb } from "../../model/collections.js";

export const getIndicateurs = async (filters: any) => {
  const filterStages = buildMongoPipelineFilterStages(filters);
  const [apprentis, inscritsSansContrat, rupturants, abandons] = await Promise.all([
    apprentisIndicator.getCountAtDate(filters.date, filterStages),
    inscritsSansContratsIndicator.getCountAtDate(filters.date, filterStages),
    rupturantsIndicator.getCountAtDate(filters.date, filterStages),
    abandonsIndicator.getCountAtDate(filters.date, filterStages),
  ]);
  return {
    date: filters.date,
    apprentis,
    inscritsSansContrat,
    rupturants,
    abandons,
    totalOrganismes: 0,
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
export const getEffectifsCountByNiveauFormationAtDate = async (filters: any) => {
  // compute number of apprentis, abandons, inscrits sans contrat and rupturants
  const effectifsByNiveauFormation = await getEffectifsCountAtDate(filters, {
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
export const getEffectifsCountByFormationAtDate = async (filters: any) => {
  const effectifsByFormation = await getEffectifsCountAtDate(filters, {
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
export const getEffectifsCountByAnneeFormationAtDate = async (filters) => {
  const effectifsByAnneeFormation = await getEffectifsCountAtDate(filters, {
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
export const getEffectifsCountByCfaAtDate = async (filters) => {
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
export const getEffectifsCountBySiretAtDate = async (filters) => {
  const effectifsCountByCfa = await getEffectifsCountAtDate(filters, {
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
export const getEffectifsCountByDepartementAtDate = async (filters: any) => {
  const effectifsCountByDepartement = await getEffectifsCountAtDate(filters, {
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
    etablissement_nom_departement: DEPARTEMENTS_BY_ID[codeDepartement]?.nom || "Inconnu",
    effectifs: {
      apprentis: effectifs.apprentis || 0,
      inscritsSansContrat: effectifs.inscritsSansContrat || 0,
      rupturants: effectifs.rupturants || 0,
      abandons: effectifs.abandons || 0,
    },
  }));
};

/**
 * Récupération des effectifs anonymisés à une date donnée
 * @param {*} filters
 * @returns
 */
export const getDataListEffectifsAtDate = async (filters: any = {}) => {
  const filterStages = buildMongoPipelineFilterStages(filters);
  const [apprentis, inscritsSansContrat, rupturants, abandons] = await Promise.all([
    apprentisIndicator.getFullExportFormattedListAtDate(filters.date, filterStages, EFFECTIF_INDICATOR_NAMES.apprentis),
    inscritsSansContratsIndicator.getFullExportFormattedListAtDate(
      filters.date,
      filterStages,
      EFFECTIF_INDICATOR_NAMES.inscritsSansContrats
    ),
    rupturantsIndicator.getFullExportFormattedListAtDate(
      filters.date,
      filterStages,
      EFFECTIF_INDICATOR_NAMES.rupturants
    ),
    abandonsIndicator.getFullExportFormattedListAtDate(filters.date, filterStages, EFFECTIF_INDICATOR_NAMES.abandons),
  ]);
  return [...apprentis, ...inscritsSansContrat, ...rupturants, ...abandons];
};

/**
 * Récupération du nb distinct d'organismes transmettant des effectifs (distinct organisme_id dans la collection effectifs)
 * @param {import("mongodb").Filter<any>} filters
 * @returns
 */
export const getNbDistinctOrganismes = async (filters = {}) => {
  const distinctOrganismes = await effectifsDb().distinct("organisme_id", filters);
  return distinctOrganismes ? distinctOrganismes.length : 0;
};
