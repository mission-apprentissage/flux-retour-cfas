import { fullSampleWithUpdates } from "../../../../tests/data/sample.js";
import { createRandomDossierApprenantList } from "../../../../tests/data/randomizedSample.js";

export const seedSample = async (dossiersApprenants) => {
  await dossiersApprenants.addOrUpdateDossiersApprenants(fullSampleWithUpdates);
};

export const seedRandomizedSample = async (dossiersApprenants, nbStatuts = 10) => {
  await dossiersApprenants.addOrUpdateDossiersApprenants(createRandomDossierApprenantList(nbStatuts));
};

export const seedRandomizedSampleWithStatut = async (dossiersApprenants, nbStatuts, statutValue) => {
  const randomDossiersApprenants = createRandomDossierApprenantList(nbStatuts).map((dossierApprenant) => {
    return {
      ...dossierApprenant,
      statut_apprenant: statutValue,
    };
  });

  await dossiersApprenants.addOrUpdateDossiersApprenants(randomDossiersApprenants);
};
