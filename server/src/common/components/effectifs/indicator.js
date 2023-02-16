import { effectifsDb } from "../../model/collections.js";

export class Indicator {
  /**
   * Constructeur avec définition d'une projection d'export par défaut
   */
  constructor() {
    this.exportProjection = {
      organisme_id: 1,

      "apprenant.nom": 1,
      "apprenant.prenom": 1,
      "apprenant.date_de_naissance": 1,
      "apprenant.historique_statut": 1,
      "apprenant.contrats.date_debut": 1,
      "apprenant.contrats.date_fin": 1,
      "apprenant.contrats.date_rupture": 1,

      "formation.cfd": 1,
      "formation.rncp": 1,
      "formation.libelle_long": 1,
      "formation.annee": 1,
      "formation.periode": 1,

      annee_scolaire: 1,

      statut_apprenant_at_date: 1,
    };
  }

  /**
   *
   * @param {*} _searchDate
   * @param {*} _filters
   * @param {*} _options
   * @returns {any[]}
   */
  getAtDateAggregationPipeline(_searchDate, _filters = {}, _options = {}) {
    // fonction implémentée dans les classes filles
    return [];
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
    const result = await effectifsDb().aggregate(groupedAggregationPipeline).toArray();

    if (!options.groupedBy) {
      return result.length === 1 ? result[0].count : 0;
    }
    return result;
  }

  /**
   * Liste tous les Effectifs correspondants à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filters Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getListAtDate(searchDate, filters = {}, options = {}) {
    const aggregationPipeline = await this.getAtDateAggregationPipeline(searchDate, filters, options);
    const result = await effectifsDb().aggregate(aggregationPipeline).toArray();
    return result ?? [];
  }

  /**
   * Pipeline de récupération des effectifs avec un statut donné à une date donnée - Principe :
   * 1. On filtre dans l'historique sur les éléments ayant une date <= date recherchée
   * 2. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
   * 3. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
   *
   * @param {*} date
   * @param {*} projection
   * @returns
   */
  getEffectifsWithStatutAtDateAggregationPipeline(date, projection = {}) {
    return [
      // Filtrage sur les élements avec date antérieure à la date recherchée
      {
        $project: {
          ...projection,
          "apprenant.historique_statut": {
            $filter: {
              input: "$apprenant.historique_statut",
              as: "result",
              // Filtre dans l'historique sur les valeurs ayant une date antérieure à la date de recherche
              cond: {
                $lte: ["$$result.date_statut", date],
              },
            },
          },
        },
      },
      // on élimine les historique vides (un dossier sur lequel on aurait un seul élément à une date ultérieure à celle donnée)
      {
        $match: { "apprenant.historique_statut": { $not: { $size: 0 } } },
      },
      // on trie les historique par date_statut puis par date_reception si date_statut identiques (cas régulier)
      {
        $project: {
          ...projection,
          "apprenant.historique_statut": {
            $sortArray: {
              input: "$apprenant.historique_statut",
              sortBy: { date_statut: 1, date_reception: 1 },
            },
          },
        },
      },
      // on récupère le dernier élément, considéré comme le statut à la date donnée
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$apprenant.historique_statut",
          },
        },
      },
    ];
  }

  async getExportFormattedListAtDate(_searchDate, _filters, _indicateur) {
    // TODO Not implemented
    return [];
  }

  /**
   * Fonction de récupération de la liste des apprentis anonymisée et formatée pour un export à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  async getFullExportFormattedListAtDate(searchDate, filters = {}, indicateur) {
    return (await this.getExportFormattedListAtDate(searchDate, filters, indicateur)).map((item) => ({
      // @ts-ignore
      ...item,
      indicateur,
      // @ts-ignore
      date_debut_formation: item.formation.periode ? item.formation.periode[0] : null,
      // @ts-ignore
      date_fin_formation: item.formation.periode ? item.formation.periode[1] : null,
    }));
  }
}
