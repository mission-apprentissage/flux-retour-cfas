const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomDossierApprenantList } = require("../../../../tests/data/randomizedSample");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");

const seedSample = async (dossiersApprenants) => {
  await dossiersApprenants.addOrUpdateDossiersApprenants(fullSampleWithUpdates);
};

const seedRandomizedSample = async (dossiersApprenants, nbStatuts = 10) => {
  await dossiersApprenants.addOrUpdateDossiersApprenants(createRandomDossierApprenantList(nbStatuts));
};

const seedRandomizedSampleWithStatut = async (dossiersApprenants, nbStatuts, statutValue) => {
  const randomDossiersApprenants = createRandomDossierApprenantList(nbStatuts).map((dossierApprenant) => {
    return {
      ...dossierApprenant,
      statut_apprenant: statutValue,
    };
  });

  await dossiersApprenants.addOrUpdateDossiersApprenants(randomDossiersApprenants);
};

const buildCfasFromCsvAndExcludedFile = async (referenceFilePath, excludedFilePath, encoding) => {
  const allCfasForNetwork = readJsonFromCsvFile(referenceFilePath, encoding);
  const excludedCfas = readJsonFromCsvFile(excludedFilePath, encoding);

  if (excludedCfas.length > 0 && allCfasForNetwork.length > 0) {
    const excludedSirets = excludedCfas.filter((item) => item.siret).map((item) => item.siret);
    return allCfasForNetwork.filter((item) => !excludedSirets.includes(item.siret));
  }

  return [];
};

module.exports = {
  seedSample,
  seedRandomizedSample,
  seedRandomizedSampleWithStatut,
  buildCfasFromCsvAndExcludedFile,
};
