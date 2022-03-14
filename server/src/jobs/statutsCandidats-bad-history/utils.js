const { isAfter } = require("date-fns");
const { CODES_STATUT_APPRENANT } = require("../../common/constants/statutsCandidatsConstants");

const identifyElementCausingWrongRupturantSequence = (historique) => {
  if (historique.length < 2) return null;

  const problematicElement = historique.find((item, index) => {
    const nextItem = historique[index + 1];
    const isWrongRupturantSequence =
      item.valeur_statut === CODES_STATUT_APPRENANT.inscrit &&
      nextItem?.valeur_statut === CODES_STATUT_APPRENANT.apprenti &&
      isAfter(item.date_statut, nextItem?.date_statut);
    return isWrongRupturantSequence;
  });

  return problematicElement || null;
};

module.exports = { identifyElementCausingWrongRupturantSequence };
