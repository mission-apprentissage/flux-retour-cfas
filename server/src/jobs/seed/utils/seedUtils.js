const { fullSampleWithUpdates } = require("../../../../tests/data/sample");
const { createRandomStatutsCandidatsList } = require("../../../../tests/data/randomizedSample");
const { readJsonFromCsvFile } = require("../../../common/utils/fileUtils");

const seedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(fullSampleWithUpdates);
};

const seedRandomizedSample = async (statutsCandidats) => {
  await statutsCandidats.addOrUpdateStatuts(createRandomStatutsCandidatsList());
};

const seedRandomizedSampleWithStatut = async (statutsCandidats, nbStatuts, statutValue) => {
  const randomStatuts = createRandomStatutsCandidatsList(nbStatuts).map((statutCandidat) => {
    return {
      ...statutCandidat,
      statut_apprenant: statutValue,
    };
  });

  await statutsCandidats.addOrUpdateStatuts(randomStatuts);
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
