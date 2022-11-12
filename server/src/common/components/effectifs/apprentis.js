import { CODES_STATUT_APPRENANT, getStatutApprenantNameFromCode } from "../../constants/dossierApprenantConstants";
import { Indicator } from "./indicator";

export class EffectifsApprentis extends Indicator {
  /**
   * Pipeline de récupération des apprentis à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "historique_statut_apprenant.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
    ];
  }

  /**
   * Function de récupération de la liste des apprentis formatée pour un export à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  async getExportFormattedListAtDate(searchDate, filters = {}) {
    const projection = this.exportProjection;
    return (await this.getListAtDate(searchDate, filters, { projection })).map((item) => ({
      ...item,
      statut: getStatutApprenantNameFromCode(item.statut_apprenant_at_date.valeur_statut),
      historique_statut_apprenant: JSON.stringify(
        item.historique_statut_apprenant.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
    }));
  }
}
