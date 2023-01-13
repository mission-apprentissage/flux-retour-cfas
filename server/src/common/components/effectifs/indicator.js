import { dossiersApprenantsMigrationDb } from "../../model/collections.js";

export class Indicator {
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
    const result = await dossiersApprenantsMigrationDb().aggregate(groupedAggregationPipeline).toArray();

    if (!options.groupedBy) {
      return result.length === 1 ? result[0].count : 0;
    }
    return result;
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
      // on élimine les historique vides (un dossier sur lequel on aurait un seul élément à une date ultérieure à celle donnée)
      {
        $match: { historique_statut_apprenant: { $not: { $size: 0 } } },
      },
      // on trie les historique par date_statut puis par date_reception si date_statut identiques (cas régulier)
      {
        $project: {
          ...projection,
          historique_statut_apprenant: {
            $sortArray: {
              input: "$historique_statut_apprenant",
              sortBy: { date_statut: 1, date_reception: 1 },
            },
          },
        },
      },
      // on récupère le dernier élément, considéré comme le statut à la date donnée
      {
        $addFields: {
          statut_apprenant_at_date: {
            $last: "$historique_statut_apprenant",
          },
        },
      },
    ];
  }
}
