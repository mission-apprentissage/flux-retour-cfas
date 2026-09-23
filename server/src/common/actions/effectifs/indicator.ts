import type { Document } from "mongodb";

import { effectifsDb } from "@/common/model/collections";

/**
  Indicator s'occupe de construire un pipeline d'aggrégation pour obtenir un indicateur
  spécifique sur les effectifs selon certains filtres.

  Exemple de pipeline exécuté :
[
  {
    "$match": {
      "annee_scolaire": {
        "$in": [
          "2022-2022",
          "2022-2023"
        ]
      },
      "organisme_id": {
        "$in": [
          "635acdad5e798f12bd919861"
        ]
      }
    }
  },
  {
    "$match": {}
  },
  {
    "$match": {
      "apprenant.historique_statut.valeur_statut": 3
    }
  },
  {
    "$project": {
      "apprenant.historique_statut": {
        "$filter": {
          "input": "$apprenant.historique_statut",
          "as": "result",
          "cond": {
            "$lte": [
              "$$result.date_statut",
              "2023-02-28T13:45:22.978Z"
            ]
          }
        }
      }
    }
  },
  {
    "$match": {
      "apprenant.historique_statut": {
        "$not": {
          "$size": 0
        }
      }
    }
  },
  {
    "$project": {
      "apprenant.historique_statut": {
        "$sortArray": {
          "input": "$apprenant.historique_statut",
          "sortBy": {
            "date_statut": 1,
            "date_reception": 1
          }
        }
      }
    }
  },
  {
    "$addFields": {
      "statut_apprenant_at_date": {
        "$last": "$apprenant.historique_statut"
      }
    }
  },
  {
    "$match": {
      "statut_apprenant_at_date.valeur_statut": 3
    }
  },
  {
    "$group": {
      "_id": null,
      "count": {
        "$sum": 1
      }
    }
  }
]
 */
interface IndicatorConfig {
  preStages: Document[];
  postStages: Document[];
  formatRow?: (item: Document) => Record<string, unknown>;
}

interface IndicatorOptions {
  projection?: Document;
  groupedBy?: Document;
}

export class Indicator {
  config: IndicatorConfig;

  constructor(config: IndicatorConfig) {
    this.config = config;
  }

  getAtDateAggregationPipeline(searchDate: Date, options: IndicatorOptions = {}): Document[] {
    return [
      ...this.config.preStages,
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      ...this.config.postStages,
    ];
  }

  /**
   * Décompte du nombre de jeunes correspondant à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filterStages Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getCountAtDate(searchDate: Date, filterStages: Document[] = [], options: IndicatorOptions = {}) {
    const result = await effectifsDb()
      .aggregate([
        ...filterStages,
        ...this.getAtDateAggregationPipeline(searchDate, options),
        { $group: options.groupedBy ?? { _id: null, count: { $sum: 1 } } },
      ])
      .toArray();

    if (!options.groupedBy) {
      return result.length === 1 ? result[0].count : 0;
    }
    return result;
  }

  /**
   * Liste tous les Effectifs correspondants à cet indicateur à la date donnée
   * @param {*} searchDate Date de recherche
   * @param {*} filterStages Filtres optionnels
   * @param {*} options Options de regroupement / projection optionnelles
   * @returns
   */
  async getListAtDate(searchDate: Date, filterStages: Document[] = [], options: IndicatorOptions = {}) {
    const result = await effectifsDb()
      .aggregate([...filterStages, ...this.getAtDateAggregationPipeline(searchDate, options)])
      .toArray();
    return result ?? [];
  }

  /**
   * Pipeline de récupération des effectifs avec un statut donné à une date donnée - Principe :
   * 1. On filtre dans l'historique sur les éléments ayant une date <= date recherchée
   * 2. On construit dans l'historique des statuts un champ diff_date_search = différence entre la date du statut de l'historique et la date recherchée
   * 3. On crée un champ statut_apprenant_at_date = statut dans l'historique avec le plus petit diff_date_search
   */
  getEffectifsWithStatutAtDateAggregationPipeline(searchDate: Date, projection: Document = {}): Document[] {
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
                $lte: ["$$result.date_statut", searchDate],
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
}
