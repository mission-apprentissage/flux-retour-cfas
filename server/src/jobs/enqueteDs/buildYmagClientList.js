const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { toCsv } = require("../../common/utils/exporterUtils");
const fs = require("fs-extra");
const path = require("path");

const localDataFilePath = path.join(__dirname, "./stats/data/dossiersData.json");
const localExportFilePath = path.join(__dirname, "./stats/output/exportDsClientsYmag.csv");

runScript(async () => {
  logger.info("Building Ymag clients list from DS 2020");

  if (fs.existsSync(localDataFilePath)) {
    const dataDs = await fs.readJSON(localDataFilePath);
    const dossiersForYmag = buildDsDataForErpName(dataDs, "Ymag - Yparéo");
    await toCsv(dossiersForYmag, localExportFilePath, { delimiter: ";" });
  } else {
    logger.info("No stats file found from DS 2020");
  }

  logger.info("End building Ymag client list from DS 2020");
});

const buildDsDataForErpName = (dataDs, erpName) =>
  dataDs
    .filter((item) => item.questions.erpNom === erpName)
    .map((item) => ({
      email: item.email,
      entreprise_siret: item.entreprise.siret_siege_social,
      entreprise_siren: item.entreprise.siren,
      entreprise_raison_sociale: item.entreprise.raison_sociale,
      cfa_directeur_nom: item.questions.cfaDirecteurEmail,
    }));
