const { createCfasCollectionIndexes, dropCfasCollectionIndexes } = require("./cfas.indexes");
const { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes } = require("./reseauxCfas.indexes");
const { createFormationsCollectionIndexes, dropFormationsCollectionIndexes } = require("./formations.indexes");
const {
  createDossiersApprenantsCollectionIndexes,
  dropDossiersApprenantsCollectionIndexes,
} = require("./dossiersApprenants.indexes");
const { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes } = require("./userEvents.indexes");

const createIndexes = async (db) => {
  await createUserEventsCollectionIndexes(db);
  await createDossiersApprenantsCollectionIndexes(db);
  await createFormationsCollectionIndexes(db);
  await createCfasCollectionIndexes(db);
  await createReseauxCfasCollectionIndexes(db);
};

const dropIndexes = async (db) => {
  await dropDossiersApprenantsCollectionIndexes(db);
  await dropFormationsCollectionIndexes(db);
  await dropUserEventsCollectionIndexes(db);
  await dropCfasCollectionIndexes(db);
  await dropReseauxCfasCollectionIndexes(db);
};

module.exports = { createIndexes, dropIndexes };
