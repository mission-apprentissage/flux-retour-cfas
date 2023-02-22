import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { mapMongoObjectToCSVObject } from "./export.js";
import { Indicator } from "./indicator.js";

export class EffectifsAbandons extends Indicator {
  /**
   * Pipeline de récupération des abandons à une date donnée
   * @param {*} searchDate
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, options = {}) {
    return [
      { $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.abandon } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.abandon } },
    ];
  }

  /**
   * Fonction de formattage d'une ligne d'un abandon
   * @param {*} item
   * @returns
   */
  formatRow(item) {
    return mapMongoObjectToCSVObject(item);
  }
}
