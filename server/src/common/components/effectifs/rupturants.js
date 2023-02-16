import { addMonths } from "date-fns";
import { CODES_STATUT_APPRENANT, getStatutApprenantNameFromCode } from "../../constants/dossierApprenantConstants.js";
import { SEUIL_ALERTE_NB_MOIS_RUPTURANTS } from "../../utils/validationsUtils/effectif.js";
import { Indicator } from "./indicator.js";

export class EffectifsRupturants extends Indicator {
  /**
   * Pipeline de récupération des rupturants à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      // Filtrage sur les filtres passés en paramètres
      {
        $match: {
          ...filters,
          "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "apprenant.historique_statut.1": { $exists: true },
        },
      },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      { $match: { "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
      // set previousStatutAtDate to be the element in apprenant.historique_statut juste before statut_apprenant_at_date
      {
        $addFields: {
          previousStatutAtDate: {
            $arrayElemAt: ["$apprenant.historique_statut", -2],
          },
        },
      },
      { $match: { "previousStatutAtDate.valeur_statut": CODES_STATUT_APPRENANT.apprenti } },
    ];
  }

  /**
   * Function de récupération de la liste des rupturants formatée pour un export à une date donnée
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
        item.apprenant.historique_statut.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
      dans_le_statut_depuis:
        addMonths(new Date(item.statut_apprenant_at_date.date_statut), SEUIL_ALERTE_NB_MOIS_RUPTURANTS).getTime() >
        Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`,
    }));
  }
}
