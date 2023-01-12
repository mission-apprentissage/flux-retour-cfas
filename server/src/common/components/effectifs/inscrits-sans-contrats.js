import { CODES_STATUT_APPRENANT, getStatutApprenantNameFromCode } from "../../constants/dossierApprenantConstants.js";
import { SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS } from "../../utils/validationsUtils/effectif.js";
import { Indicator } from "./indicator.js";
import { addMonths } from "date-fns";

export class EffectifsInscritsSansContrats extends Indicator {
  /**
   * Pipeline de récupération des inscrits sans contrats à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, filters = {}, options = {}) {
    return [
      { $match: { ...filters, "historique_statut_apprenant.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      {
        $match: {
          "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "historique_statut_apprenant.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
        },
      },
    ];
  }

  /**
   * Function de récupération de la liste des inscrits sans contrats formatée pour un export à une date donnée
   * @param {*} searchDate
   * @param {*} filters
   * @returns
   */
  async getExportFormattedListAtDate(searchDate, filters = {}) {
    const projection = this.exportProjection;
    return (await this.getListAtDate(searchDate, filters, { projection })).map((item) => ({
      ...item,
      statut: getStatutApprenantNameFromCode(item.statut_apprenant_at_date.valeur_statut),
      date_inscription: item.statut_apprenant_at_date.date_statut, // Specific for inscrits sans contrats indicateur
      historique_statut_apprenant: JSON.stringify(
        item.historique_statut_apprenant.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
      dans_le_statut_depuis:
        addMonths(new Date(item.statut_apprenant_at_date.date_statut), SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS) >
        Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`,
    }));
  }
}
