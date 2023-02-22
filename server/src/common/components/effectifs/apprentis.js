import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { mapMongoObjectToCSVObject } from "./export.js";
import { Indicator } from "./indicator.js";

export class EffectifsApprentis extends Indicator {
  /**
   * Pipeline de récupération des apprentis à une date donnée
   * @param {*} searchDate
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, options = {}) {
    return [
      {
        $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.apprenti },
      },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
    ];
  }

  /**
   * Fonction de formattage d'une ligne d'un apprenti
   * @param {*} item
   * @returns
   */
  formatRow(item) {
    return mapMongoObjectToCSVObject(item);
  }
}
