import { mergeObjectsBy } from "../utils/mergeObjectsBy.js";
import { asyncForEach } from "../utils/asyncUtils.js";
import { EFFECTIF_INDICATOR_NAMES } from "../constants/dossierApprenantConstants.js";
import { EffectifsApprentisFromDossiersOld } from "./effectifs-dossiers-old/apprentis.dossiers.js";
import { EffectifsAbandonsFromDossiersOld } from "./effectifs-dossiers-old/abandons.dossiers.js";
import { EffectifsInscritsSansContratsFromDossiersOld } from "./effectifs-dossiers-old/inscrits-sans-contrats.dossiers.js";
import { EffectifsRupturantsFromDossiersOld } from "./effectifs-dossiers-old/rupturants.dossiers.js";

/**
 * TODO : A Supprimer une fois passé sur le modèle effectifs
 * Permets de faire la comparaison avant migration
 * Gestion des effectifs depuis les dossiersApprenants
 */
export default () => {
  const apprentis = new EffectifsApprentisFromDossiersOld();
  const abandons = new EffectifsAbandonsFromDossiersOld();
  const inscritsSansContrats = new EffectifsInscritsSansContratsFromDossiersOld();
  const rupturants = new EffectifsRupturantsFromDossiersOld();

  /**
   * Récupération des effectifs pour tous les indicateurs du TdB
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} param2
   * @returns
   */
  const getEffectifsCountAtDateFromDossiersOld = async (searchDate, filters = {}, { groupedBy, projection }) => {
    // compute number of apprentis, abandons, inscrits sans contrat and rupturants
    const apprentisCountByCfa = await apprentis.getCountAtDate(searchDate, filters, {
      groupedBy: { ...groupedBy, apprentis: { $sum: 1 } },
      projection,
    });
    const abandonsCountByCfa = await abandons.getCountAtDate(searchDate, filters, {
      groupedBy: { ...groupedBy, abandons: { $sum: 1 } },
      projection,
    });
    const inscritsSansContratCountByCfa = await inscritsSansContrats.getCountAtDate(searchDate, filters, {
      groupedBy: { ...groupedBy, inscritsSansContrat: { $sum: 1 } },
      projection,
    });
    const rupturantsCountByCfa = await rupturants.getCountAtDate(searchDate, filters, {
      groupedBy: { ...groupedBy, rupturants: { $sum: 1 } },
      projection,
    });

    // merge apprentis, abandons, inscrits sans contrat and rupturants with same _id to have them grouped
    return mergeObjectsBy(
      [...apprentisCountByCfa, ...abandonsCountByCfa, ...inscritsSansContratCountByCfa, ...rupturantsCountByCfa],
      "_id"
    );
  };

  /**
   * Récupération des effectifs par niveau de formation à une date donnée
   * @param {Date} searchDate
   * @param {*} filters
   * @returns [{
   *  niveau: string
   *  niveau_libelle: string
   *  effectifs: {
   *    apprentis: number
   *    inscritsSansContrat: number
   *    rupturants: number
   *    abandons: number
   *  }
   * }]
   */
  const getEffectifsCountByNiveauFormationAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    const projection = { niveau_formation: 1, niveau_formation_libelle: 1 };
    const groupedBy = { _id: "$niveau_formation", niveau_libelle: { $first: "$niveau_formation_libelle" } };
    // compute number of apprentis, abandons, inscrits sans contrat and rupturants
    const effectifsByNiveauFormation = await getEffectifsCountAtDateFromDossiersOld(
      searchDate,
      // compute effectifs with a niveau_formation
      { ...filters, niveau_formation: { $ne: null } },
      { groupedBy, projection }
    );

    return effectifsByNiveauFormation.map(({ _id, niveau_libelle, ...effectifs }) => {
      return {
        niveau_formation: _id,
        niveau_formation_libelle: niveau_libelle,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs par formation à une date donnée
   * @param {Date} searchDate
   * @param {*} filters
   * @returns [{
   *  cfd: string
   *  intitule: string
   *  effectifs: {
   *    apprentis: number
   *    inscritsSansContrat: number
   *    rupturants: number
   *    abandons: number
   *  }
   * }]
   */
  const getEffectifsCountByFormationAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    const projection = { formation_cfd: 1, libelle_long_formation: 1 };
    const groupedBy = {
      _id: "$formation_cfd",
      // we will send libelle_long_formation along with the grouped effectifs so we need to project it
      libelle_long_formation: { $first: "$libelle_long_formation" },
    };
    const effectifsByFormation = await getEffectifsCountAtDateFromDossiersOld(searchDate, filters, {
      groupedBy,
      projection,
    });

    return effectifsByFormation.map(({ _id, libelle_long_formation, ...effectifs }) => {
      return {
        formation_cfd: _id,
        intitule: libelle_long_formation,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs par formation et département à une date donnée
   * @param {Date} searchDate
   * @param {*} filters
   * @returns [{
   *  formation_cfd: string
   *  departement: string
   *  intitule: string
   *  effectifs: {
   *    apprentis: number
   *    inscritsSansContrat: number
   *    rupturants: number
   *    abandons: number
   *  }
   * }]
   */
  const getEffectifsCountByFormationAndDepartementAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    const projection = {
      formation_cfd: 1,
      etablissement_num_departement: 1,
      libelle_long_formation: 1,
    };
    const groupedBy = {
      _id: { formation_cfd: "$formation_cfd", departement: "$etablissement_num_departement" },
      // we will send libelle_long_formation along with the grouped effectifs so we need to project it
      libelle_long_formation: { $first: "$libelle_long_formation" },
    };
    const effectifsByFormationAndDepartement = await getEffectifsCountAtDateFromDossiersOld(searchDate, filters, {
      groupedBy,
      projection,
    });

    return effectifsByFormationAndDepartement.map(({ _id, libelle_long_formation, ...effectifs }) => {
      return {
        formation_cfd: _id.formation_cfd,
        departement: _id.departement,
        intitule: libelle_long_formation,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs par annee_formation à une date donnée
   * @param {Date} searchDate
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
  const getEffectifsCountByAnneeFormationAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    const projection = { annee_formation: 1 };
    const groupedBy = { _id: "$annee_formation" };
    const effectifsByAnneeFormation = await getEffectifsCountAtDateFromDossiersOld(searchDate, filters, {
      groupedBy,
      projection,
    });

    return effectifsByAnneeFormation.map(({ _id, ...effectifs }) => {
      return {
        annee_formation: _id,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs par uai_etablissement à une date donnée
   * @param {Date} searchDate
   * @param {*} filters
   * @returns [{
   *  uai_etablissement: string
   *  nom_etablissement: string
   *  effectifs: {
   *    apprentis: number
   *    inscritsSansContrat: number
   *    rupturants: number
   *    abandons: number
   *  }
   * }]
   */
  const getEffectifsCountByCfaAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    // we need to project these fields to give information about the CFAs
    const projection = {
      uai_etablissement: 1,
      siret_etablissement: 1,
      nom_etablissement: 1,
    };
    const groupedBy = {
      _id: "$uai_etablissement",
      // we will send information about the organisme along with the grouped effectifs so we project it
      nom_etablissement: { $first: "$nom_etablissement" },
      siret_etablissement: { $addToSet: "$siret_etablissement" },
    };
    const effectifsCountByCfa = await getEffectifsCountAtDateFromDossiersOld(searchDate, filters, {
      groupedBy,
      projection,
    });

    const result = [];

    await asyncForEach(
      effectifsCountByCfa,
      async ({ _id: uai, nom_etablissement, siret_etablissement, ...effectifs }) => {
        result.push({
          uai_etablissement: uai,
          siret_etablissement,
          nom_etablissement,
          effectifs: {
            apprentis: effectifs.apprentis || 0,
            inscritsSansContrat: effectifs.inscritsSansContrat || 0,
            rupturants: effectifs.rupturants || 0,
            abandons: effectifs.abandons || 0,
          },
        });
      }
    );

    return result;
  };

  /**
   * Récupération des effectifs par siret_etablissement à une date donnée
   * @param {Date} searchDate
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
  const getEffectifsCountBySiretAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    // we need to project these fields to give information about the CFAs
    const projection = {
      siret_etablissement: 1,
      nom_etablissement: 1,
    };
    const groupedBy = {
      _id: "$siret_etablissement",
      // we will send information about the organisme along with the grouped effectifs so we project it
      nom_etablissement: { $first: "$nom_etablissement" },
    };
    const effectifsCountByCfa = await getEffectifsCountAtDateFromDossiersOld(
      searchDate,
      // compute effectifs with a siret_etablissement
      { ...filters, siret_etablissement: { $ne: null } },
      { groupedBy, projection }
    );

    return effectifsCountByCfa.map((effectifForCfa) => {
      const { _id, nom_etablissement, ...effectifs } = effectifForCfa;
      return {
        siret_etablissement: _id,
        nom_etablissement,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs par etablissement_num_departement à une date donnée
   * @param {Date} searchDate
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
  const getEffectifsCountByDepartementAtDateFromDossiersOld = async (searchDate, filters = {}) => {
    // we need to project these fields to give information about the departement
    const projection = {
      etablissement_nom_departement: 1,
      etablissement_num_departement: 1,
    };
    const groupedBy = {
      _id: "$etablissement_num_departement",
      etablissement_nom_departement: { $first: "$etablissement_nom_departement" },
    };
    const effectifsCountByDepartement = await getEffectifsCountAtDateFromDossiersOld(searchDate, filters, {
      groupedBy,
      projection,
    });

    return effectifsCountByDepartement.map((effectifForDepartement) => {
      const { _id, etablissement_nom_departement, ...effectifs } = effectifForDepartement;
      return {
        etablissement_num_departement: _id,
        etablissement_nom_departement,
        effectifs: {
          apprentis: effectifs.apprentis || 0,
          inscritsSansContrat: effectifs.inscritsSansContrat || 0,
          rupturants: effectifs.rupturants || 0,
          abandons: effectifs.abandons || 0,
        },
      };
    });
  };

  /**
   * Récupération des effectifs anonymisés à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  const getDataListEffectifsAtDateFromDossiersOld = async (searchDate, filters = {}, namedDataMode = false) => {
    const apprentisAnonymous = await apprentis.getFullExportFormattedListAtDate(
      searchDate,
      filters,
      EFFECTIF_INDICATOR_NAMES.apprentis,
      namedDataMode
    );
    const inscritsSansContratAnonymous = await inscritsSansContrats.getFullExportFormattedListAtDate(
      searchDate,
      filters,
      EFFECTIF_INDICATOR_NAMES.inscritsSansContrats,
      namedDataMode
    );
    const rupturantsAnonymous = await rupturants.getFullExportFormattedListAtDate(
      searchDate,
      filters,
      EFFECTIF_INDICATOR_NAMES.rupturants,
      namedDataMode
    );
    const abandonsAnonymous = await abandons.getFullExportFormattedListAtDate(
      searchDate,
      filters,
      EFFECTIF_INDICATOR_NAMES.abandons,
      namedDataMode
    );

    return [...apprentisAnonymous, ...inscritsSansContratAnonymous, ...rupturantsAnonymous, ...abandonsAnonymous];
  };

  return {
    apprentis,
    abandons,
    inscritsSansContrats,
    rupturants,
    getEffectifsCountByCfaAtDateFromDossiersOld,
    getEffectifsCountByNiveauFormationAtDateFromDossiersOld,
    getEffectifsCountByFormationAtDateFromDossiersOld,
    getEffectifsCountByAnneeFormationAtDateFromDossiersOld,
    getEffectifsCountByDepartementAtDateFromDossiersOld,
    getEffectifsCountByFormationAndDepartementAtDateFromDossiersOld,
    getEffectifsCountBySiretAtDateFromDossiersOld,
    getDataListEffectifsAtDateFromDossiersOld,
  };
};
