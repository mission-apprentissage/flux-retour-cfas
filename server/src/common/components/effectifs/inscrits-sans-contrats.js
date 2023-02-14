import { addMonths } from "date-fns";
import { CODES_STATUT_APPRENANT, getStatutApprenantNameFromCode } from "../../constants/dossierApprenantConstants.js";
import { SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS } from "../../utils/validationsUtils/effectif.js";
import { Indicator } from "./indicator.js";

export class EffectifsInscritsSansContrats extends Indicator {
  /**
   * Pipeline de récupération des inscrits sans contrats à une date donnée
   * @param {*} searchDate
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, options = {}) {
    return [
      { $match: { "apprenant.historique_statut.valeur_statut": CODES_STATUT_APPRENANT.inscrit } },
      ...this.getEffectifsWithStatutAtDateAggregationPipeline(searchDate, options.projection),
      {
        $match: {
          "statut_apprenant_at_date.valeur_statut": CODES_STATUT_APPRENANT.inscrit,
          "apprenant.historique_statut.valeur_statut": { $ne: CODES_STATUT_APPRENANT.apprenti },
        },
      },
    ];
  }

  /**
   * Fonction de formattage d'une ligne d'un inscrit sans constrats
   * @param {*} item
   * @returns
   */
  async formatRow(item) {
    return {
      ...item,
      statut: getStatutApprenantNameFromCode(item.statut_apprenant_at_date.valeur_statut),
      date_inscription: item.statut_apprenant_at_date.date_statut, // Specific for inscrits sans contrats indicateur
      historique_statut_apprenant: JSON.stringify(
        item.apprenant.historique_statut.map((item) => ({
          date: item.date_statut,
          statut: getStatutApprenantNameFromCode(item.valeur_statut),
        }))
      ),
      dans_le_statut_depuis:
        addMonths(
          new Date(item.statut_apprenant_at_date.date_statut),
          SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS
        ).getTime() > Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_INSCRITS_SANS_CONTRATS} mois`,
    };
  }
}
