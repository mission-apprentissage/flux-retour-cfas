import { CODES_STATUT_APPRENANT, getStatutApprenantNameFromCode } from "../../constants/dossierApprenantConstants.js";
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
  async formatRow(item) {
    return {
      ...item,
      statut: getStatutApprenantNameFromCode(item.statut_apprenant_at_date.valeur_statut),
      date_abandon: item.statut_apprenant_at_date.date_statut,
      historique_statut_apprenant: JSON.stringify(
        item.apprenant.historique_statut.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
    };
  }
}
