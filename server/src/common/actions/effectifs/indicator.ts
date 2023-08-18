import { organismeLookup } from "@/common/actions/helpers/filters";
import { effectifsDb } from "@/common/model/collections";

import { exportedMongoFieldsProjection } from "./export";

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
export class Indicator {
  config: any;

  constructor(config) {
    this.config = config;
  }

  getAtDateAggregationPipeline(searchDate: any, options: any = {}): any[] {
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
  async getCountAtDate(searchDate: any, filterStages: any = [], options: any = {}) {
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
  async getListAtDate(searchDate: any, filterStages: any[] = [], options: any = {}) {
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
  getEffectifsWithStatutAtDateAggregationPipeline(searchDate: any, projection = {}) {
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

  /**
   * Fonction de récupération de la liste des apprentis anonymisée et formatée pour un export à une date donnée
   */
  async getFullExportFormattedListAtDate(searchDate: any, filterStages: any[] = [], indicateur: any) {
    const exportList = await this.getListAtDate(searchDate, [...filterStages, { $lookup: organismeLookup }], {
      projection: exportedMongoFieldsProjection,
    });
    return exportList.map((item) => ({
      ...this.config.formatRow(item),
      indicateur,
      date_debut_formation: item.formation.periode ? item.formation.periode[0] : null,
      date_fin_formation: item.formation.periode ? item.formation.periode[1] : null,
    }));
  }
}
