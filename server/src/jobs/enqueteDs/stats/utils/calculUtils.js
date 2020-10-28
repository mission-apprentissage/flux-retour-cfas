const { round } = require("lodash");

/**
 * Calcul du pourcentage sur 2 décimales
 * @param {*} dossiersLength
 * @param {*} totalDossiersLength
 */
const getPercentageFromTotal = (dossiersLength, totalDossiersLength) =>
  round((dossiersLength / totalDossiersLength) * 100, 2);

/**
 * Calcul du taux de reponse à partir d'une liste de statut de démarche à éviter, d'une liste de dossiers et d'un total
 * @param {*} demarcheStatuses
 * @param {*} dsDossiersData
 * @param {*} totalDossierLength
 */
const getRateResponseDsForNotInDemarcheStatuses = (demarcheStatuses, dsDossiersData, totalDossierLength) =>
  getPercentageFromTotal(
    dsDossiersData.filter((item) => !demarcheStatuses.includes(item.state)).length,
    totalDossierLength
  );

module.exports = {
  getRateResponseDsForNotInDemarcheStatuses,
  getPercentageFromTotal,
};
