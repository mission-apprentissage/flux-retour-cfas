const { DossierApprenantModel } = require("../../model");

const ANONYMOUS_LABEL = "_ANONYME_";

class Indicator {
  /**
   * Constructeur avec définition d'une projection d'export par défaut
   */
  constructor() {
    this.exportProjection = {
      uai_etablissement: 1,
      siret_etablissement: 1,
      nom_etablissement: 1,
      nom_apprenant: 1,
      prenom_apprenant: 1,
      date_de_naissance_apprenant: 1,
      formation_cfd: 1,
      formation_rncp: 1,
      libelle_long_formation: 1,
      annee_formation: 1,
      annee_scolaire: 1,
      contrat_date_debut: 1,
      contrat_date_rupture: 1,
      historique_statut_apprenant: 1,
      statut_apprenant_at_date: 1,
    };
  }

  /**
   * Décompte du nombre de jeunes correspondant à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filters Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getCountAtDate(searchDate, filters = {}, options = {}) {
    const groupedBy = options.groupedBy ?? { _id: null, count: { $sum: 1 } };
    const aggregationPipeline = this.getAtDateAggregationPipeline(searchDate, filters, options);
    const groupedAggregationPipeline = [...aggregationPipeline, { $group: groupedBy }];
    const result = await DossierApprenantModel.aggregate(groupedAggregationPipeline);

    if (!options.groupedBy) {
      return result.length === 1 ? result[0].count : 0;
    }
    return result;
  }

  /**
   * Liste tous les DossierApprenant correspondants à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filters Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getListAtDate(searchDate, filters = {}, options = {}) {
    const aggregationPipeline = await this.getAtDateAggregationPipeline(searchDate, filters, options);
    const result = await DossierApprenantModel.aggregate(aggregationPipeline);
    return result ?? [];
  }

  /**
   * Pipeline de récupération des effectifs avec un statut donné à une date donnée - Principe :
   * 1. On filtre dans l'historique sur les éléments ayant une date <= date recherchée
   * 2. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
   * 3. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
   */
  getEffectifsWithStatutAtDateAggregationPipeline(date, projection = {}) {
    return [
      // Filtrage sur les élements avec date antérieure à la date recherchée
      {
        $project: {
          ...projection,
          historique_statut_apprenant: {
            $filter: {
              input: "$historique_statut_apprenant",
              as: "result",
              // Filtre dans l'historique sur les valeurs ayant une date antérieure à la date de recherche
              cond: {
                $lte: ["$$result.date_statut", date],
              },
            },
          },
        },
      },
      {
        $match: { historique_statut_apprenant: { $not: { $size: 0 } } },
      },
      // Ajout d'un champ diff_date_search : écart entre la date de l'historique et la date recherchée
      {
        $addFields: {
          historique_statut_apprenant: {
            $map: {
              input: "$historique_statut_apprenant",
              as: "item",
              in: {
                date_statut: "$$item.date_statut",
                valeur_statut: "$$item.valeur_statut",
                // Calcul de la différence entre item.date_statut & date
                diff_date_search: { $abs: [{ $subtract: ["$$item.date_statut", date] }] },
              },
            },
          },
        },
      },
      // Ajout d'un champ statut_apprenant_at_date correspondant à l'élément de l'historique ayant le plus petit écart avec la date recherchée
      {
        $addFields: {
          statut_apprenant_at_date: {
            $first: {
              $filter: {
                input: "$historique_statut_apprenant",
                as: "result",
                cond: {
                  $eq: ["$$result.diff_date_search", { $min: "$historique_statut_apprenant.diff_date_search" }],
                },
              },
            },
          },
        },
      },
    ];
  }

  /**
   * Fonction de récupération de la liste des apprentis anonymisée et formatée pour un export à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  async getAnonymousExportFormattedListAtDate(searchDate, filters = {}, indicateur) {
    return (await this.getExportFormattedListAtDate(searchDate, filters, indicateur)).map((item) => ({
      ...item,
      indicateur,
      nom_apprenant: ANONYMOUS_LABEL,
      prenom_apprenant: ANONYMOUS_LABEL,
      date_de_naissance_apprenant: ANONYMOUS_LABEL,
    }));
  }
}

module.exports = { Indicator };
