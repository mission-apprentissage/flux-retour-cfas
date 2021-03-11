const logger = require("../../common/logger");
const path = require("path");
const { runScript } = require("../scriptWrapper");
const { readJsonFromCsvFile } = require("../../common/utils/fileUtils");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { StatutCandidat } = require("../../common/model");
const { downloadIfNeeded } = require("./utils/");
const { toXlsx } = require("../../common/utils/exporterUtils");
const { codesStatutsCandidats, jobNames } = require("../../common/model/constants/index");

const cmaReferenceFilePath = path.join(__dirname, `./assets/cfas-cma.csv`);

/**
 * Ce script permet de créer un export contenant tous les statuts pour le réseau CMA
 */
runScript(async () => {
  logger.info("Exporting Cfas identified for CMA Network");
  await identifyCfas();
  logger.info("End exporting Cfas identified for CMA Network");
}, jobNames.identifyNetworkCma);

const identifyCfas = async () => {
  const statutsForCma = [];

  // Gets the referentiel file
  await downloadIfNeeded(`cfas-reseaux/cfas-cma.csv`, cmaReferenceFilePath);

  // Read uais from reference file
  const uaisForCma = readJsonFromCsvFile(cmaReferenceFilePath);
  if (!uaisForCma) {
    logger.error("Error while reading CMA reference file");
    return;
  }

  // Build statuts for CMA parsing all uaisForCma
  await asyncForEach(
    uaisForCma.map((x) => x.uai),
    async (_uai) => {
      if (_uai) {
        const uaiFoundInStatuts = await StatutCandidat.findOne({ uai_etablissement: _uai });
        if (uaiFoundInStatuts) {
          logger.info(`Uai ${_uai} found in StatutsCandidats - adding to export`);

          const nbStatutsProspect = await StatutCandidat.countDocuments({
            statut_apprenant: codesStatutsCandidats.prospect,
            uai_etablissement: _uai,
          });

          const nbStatutsInscrits = await StatutCandidat.countDocuments({
            statut_apprenant: codesStatutsCandidats.inscrit,
            uai_etablissement: _uai,
          });

          const nbStatutsApprentis = await StatutCandidat.countDocuments({
            statut_apprenant: codesStatutsCandidats.apprenti,
            uai_etablissement: _uai,
          });

          const nbStatutsAbandon = await StatutCandidat.countDocuments({
            statut_apprenant: codesStatutsCandidats.abandon,
            uai_etablissement: _uai,
          });

          statutsForCma.push({
            uai: uaiFoundInStatuts.uai_etablissement,
            siret: uaiFoundInStatuts.siret_etablissement,
            nom_cfa: uaiFoundInStatuts.nom_etablissement,
            nb_statuts_prospects: nbStatutsProspect,
            nb_statuts_inscrits: nbStatutsInscrits,
            nb_statuts_apprentis: nbStatutsApprentis,
            nb_statuts_abandon: nbStatutsAbandon,
          });
        }
      }
    }
  );

  // Build export XLSX
  await toXlsx(statutsForCma, path.join(__dirname, `/output/statuts_cma_${Date.now()}.xlsx`));
};
