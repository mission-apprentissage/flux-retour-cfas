const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const readJsonFromCsvFile = require("../../common/utils/fileUtils").readJsonFromCsvFile;
const path = require("path");
const { StatutCandidat } = require("../../common/model");
const moment = require("moment");
const { difference } = require("lodash");

runScript(async () => {
  logger.info("Run Ymag Analysis");

  // Get Ymag & Local db data
  const ymagData = await readJsonFromCsvFile(path.join(__dirname, "./data/ymag-export.csv"));
  const statutsData = await StatutCandidat.find({});
  const statutsMapped = statutsData.map((item) => ({
    INE_APPRENANT: item.ine_apprenant,
    NOM_APPRENANT: item.nom_apprenant,
    PRENOM_APPRENANT: item.prenom_apprenant,
    PRENOM2_APPRENANT: item.prenom2_apprenant,
    PRENOM3_APPRENANT: item.prenom3_apprenant,
    NE_PAS_SOLLICITER: item.ne_pas_solliciter ? (item.ne_pas_solliciter === true ? `0` : `1`) : null,
    EMAIL_CONTACT: item.email_contact,
    NOM_REPRESENTANT_LEGAL: item.nom_representant_legal,
    TEL_REPRESENTANT_LEGAL: item.tel_representant_legal,
    TEL2_REPRESENTANT_LEGAL: item.tel2_representant_legal,
    ID_FORMATION: item.id_formation,
    LIBELLE_COURT_FORMATION: item.libelle_court_formation,
    LIBELLE_LONG_FORMATION: item.libelle_long_formation,
    UAI_ETABLISSEMENT: item.uai_etablissement,
    NOM_ETABLISSEMENT: item.nom_etablissement,
    STATUT_APPRENANT: `${item.statut_apprenant}`,
    DATE_METIER_MISE_A_JOUR_STATUT: moment(item.date_metier_mise_a_jour_statut).format("DD/MM/YYYY"),
  }));

  // Build diff Ymag not in Db
  var diffResult = difference(ymagData, statutsMapped);
  logger.info(diffResult);

  logger.info("End Ymag Analysis");
});

// const isStatutEqual = (statut1, statut2) => {
//   return (
//     statut1.INE_APPRENANT === statut2.INE_APPRENANT &&
//     statut1.NOM_APPRENANT === statut2.NOM_APPRENANT &&
//     statut1.PRENOM_APPRENANT === statut2.PRENOM_APPRENANT &&
//     statut1.PRENOM2_APPRENANT === statut2.PRENOM2_APPRENANT &&
//     statut1.PRENOM3_APPRENANT === statut2.PRENOM3_APPRENANT &&
//     statut1.NE_PAS_SOLLICITER === statut2.NE_PAS_SOLLICITER &&
//     statut1.EMAIL_CONTACT === statut2.EMAIL_CONTACT &&
//     statut1.NOM_REPRESENTANT_LEGAL === statut2.NOM_REPRESENTANT_LEGAL &&
//     statut1.TEL_REPRESENTANT_LEGAL === statut2.TEL_REPRESENTANT_LEGAL &&
//     statut1.TEL2_REPRESENTANT_LEGAL === statut2.TEL2_REPRESENTANT_LEGAL &&
//     statut1.ID_FORMATION === statut2.ID_FORMATION &&
//     statut1.LIBELLE_COURT_FORMATION === statut2.LIBELLE_COURT_FORMATION &&
//     statut1.LIBELLE_LONG_FORMATION === statut2.LIBELLE_LONG_FORMATION &&
//     statut1.UAI_ETABLISSEMENT === statut2.UAI_ETABLISSEMENT &&
//     statut1.NOM_ETABLISSEMENT === statut2.NOM_ETABLISSEMENT &&
//     statut1.STATUT_APPRENANT === statut2.STATUT_APPRENANT
//   );
// };
