import { addMonths } from "date-fns";
import { CODES_STATUT_APPRENANT } from "../../constants/dossierApprenantConstants.js";
import { SEUIL_ALERTE_NB_MOIS_RUPTURANTS } from "../../utils/validationsUtils/effectif.js";
import { mapMongoObjectToCSVObject } from "./export.js";
import { Indicator } from "./indicator.js";

export class EffectifsRupturants extends Indicator {
  /**
   * Pipeline de récupération des rupturants à une date donnée
   * @param {*} searchDate
   * @param {*} options
   * @returns
   */
  getAtDateAggregationPipeline(searchDate, options = {}) {
    return [
      {
        $match: {
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
   * Fonction de formattage d'une ligne d'un rupturant
   * @param {*} item
   * @returns
   */
  formatRow(item) {
    return {
      ...mapMongoObjectToCSVObject(item),
      dans_le_statut_depuis:
        addMonths(new Date(item.statut_apprenant_at_date.date_statut), SEUIL_ALERTE_NB_MOIS_RUPTURANTS).getTime() >
        Date.now()
          ? `Moins de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`
          : `Plus de ${SEUIL_ALERTE_NB_MOIS_RUPTURANTS} mois`,
    };
  }
}
