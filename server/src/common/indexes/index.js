const { createCfasCollectionIndexes, dropCfasCollectionIndexes } = require("./cfas.indexes");
const { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes } = require("./reseauxCfas.indexes");
const { createFormationsCollectionIndexes, dropFormationsCollectionIndexes } = require("./formations.indexes");
const {
  createDossiersApprenantsCollectionIndexes,
  dropDossiersApprenantsCollectionIndexes,
} = require("./dossiersApprenants.indexes");
const { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes } = require("./userEvents.indexes");
const { createUsersCollectionIndexes, dropUsersCollectionIndexes } = require("./users.indexes");
const {
  createPsDemandeActivationCompteIndex,
  dropPsDemandeActivationCompteIndex,
} = require("./partageSimplifieDemandeActivationCompte.indexes");
const {
  createPsSignalementAnomalieIndex,
  dropPsSignalementAnomalieIndex,
} = require("./partageSimplifieSignalementAnomalie.indexes");
const { createPsUsersIndex, dropPsUsersIndex } = require("./partageSimplifieUsers.indexes");
const {
  createPsDonneesApprenantsIndex,
  dropPsDonneesApprenantsIndex,
} = require("./partageSimplifieDonneesApprenants.indexes");

const createIndexes = async (db) => {
  await createUserEventsCollectionIndexes(db);
  await createDossiersApprenantsCollectionIndexes(db);
  await createFormationsCollectionIndexes(db);
  await createCfasCollectionIndexes(db);
  await createReseauxCfasCollectionIndexes(db);
  await createUsersCollectionIndexes(db);
  await createPsDemandeActivationCompteIndex(db);
  await createPsSignalementAnomalieIndex(db);
  await createPsUsersIndex(db);
  await createPsDonneesApprenantsIndex(db);
};

const dropIndexes = async (db) => {
  await dropDossiersApprenantsCollectionIndexes(db);
  await dropFormationsCollectionIndexes(db);
  await dropUserEventsCollectionIndexes(db);
  await dropCfasCollectionIndexes(db);
  await dropReseauxCfasCollectionIndexes(db);
  await dropUsersCollectionIndexes(db);
  await dropPsDemandeActivationCompteIndex(db);
  await dropPsSignalementAnomalieIndex(db);
  await dropPsUsersIndex(db);
  await dropPsDonneesApprenantsIndex(db);
};

module.exports = { createIndexes, dropIndexes };
