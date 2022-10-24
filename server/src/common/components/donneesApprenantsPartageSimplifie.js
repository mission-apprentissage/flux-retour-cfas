const XLSX = require("xlsx");
const { XLSX_DateNF_Format } = require("../domain/date.js");
const { DONNEES_APPRENANT_XLSX_FILE } = require("../domain/donneesApprenants.js");
const { DonneesApprenantsFactory } = require("../factory/donneesApprenantsFactory.js");
const { PartageSimplifieDonneesApprenantsModel } = require("../model/index.js");
const { asyncForEach } = require("../utils/asyncUtils.js");

/**
 * Import des données apprenants pour l'utilisateur
 * @param {*} param0
 * @returns
 */
const importDonneesApprenants = async (donneesApprenants) => {
  await asyncForEach(donneesApprenants, async (currentDonneeApprenant) => {
    const entityToAdd = await DonneesApprenantsFactory.create(currentDonneeApprenant);
    await new PartageSimplifieDonneesApprenantsModel(entityToAdd).save();
  });
};

/**
 * Suppression des données apprenants pour l'email utilisateur
 * @param {*} param0
 * @returns
 */
const clearDonneesApprenantsForUserEmail = async (user_email) => {
  await PartageSimplifieDonneesApprenantsModel.deleteMany({ user_email });
};

/**
 * Lecture d'une liste d'objets depuis le buffer du XLSX
 * @param {*} fileBuffer
 * @returns
 */
const readDonneesApprenantsFromXlsxBuffer = (
  fileBuffer,
  headerNbLinesToRemove = DONNEES_APPRENANT_XLSX_FILE.NB_LINES_TO_REMOVE
) => {
  // Lecture des données depuis le buffer du fichier XLSX en gérant l'entête du fichier
  const workbook = XLSX.read(fileBuffer, { cellText: false, cellDates: true });
  const aoa = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
    header: DONNEES_APPRENANT_XLSX_FILE.HEADERS,
    raw: false,
    dateNF: XLSX_DateNF_Format,
  });
  const donneesApprenants = aoa?.splice(headerNbLinesToRemove);
  return donneesApprenants;
};

module.exports = () => ({
  readDonneesApprenantsFromXlsxBuffer,
  importDonneesApprenants,
  clearDonneesApprenantsForUserEmail,
});
