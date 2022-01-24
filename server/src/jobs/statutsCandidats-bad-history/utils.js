const { isAfter } = require("date-fns");
const { codesStatutsCandidats } = require("../../common/model/constants");

const identifyElementCausingWrongRupturantSequence = (historique) => {
  if (historique.length < 2) return null;

  const problematicElement = historique.find((item, index) => {
    const nextItem = historique[index + 1];
    const isWrongRupturantSequence =
      item.valeur_statut === codesStatutsCandidats.inscrit &&
      nextItem?.valeur_statut === codesStatutsCandidats.apprenti &&
      isAfter(item.date_statut, nextItem?.date_statut);
    return isWrongRupturantSequence;
  });

  return problematicElement || null;
};

module.exports = { identifyElementCausingWrongRupturantSequence };
