const { createCfasCollectionIndexes, dropCfasCollectionIndexes } = require("./cfas.indexes");
const { createReseauxCfasCollectionIndexes, dropReseauxCfasCollectionIndexes } = require("./reseauxCfas.indexes");
const { createFormationsCollectionIndexes, dropFormationsCollectionIndexes } = require("./formations.indexes");
const {
  createDossiersApprenantsCollectionIndexes,
  dropDossiersApprenantsCollectionIndexes,
} = require("./dossiersApprenants.indexes");
const { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes } = require("./userEvents.indexes");
const { createUsersCollectionIndexes, dropUsersCollectionIndexes } = require("./users.indexes");

const createIndexes = async () => {
  await createUserEventsCollectionIndexes();
  await createDossiersApprenantsCollectionIndexes();
  await createFormationsCollectionIndexes();
  await createCfasCollectionIndexes();
  await createReseauxCfasCollectionIndexes();
  await createUsersCollectionIndexes();
};

const dropIndexes = async () => {
  await dropDossiersApprenantsCollectionIndexes();
  await dropFormationsCollectionIndexes();
  await dropUserEventsCollectionIndexes();
  await dropCfasCollectionIndexes();
  await dropReseauxCfasCollectionIndexes();
  await dropUsersCollectionIndexes();
};

module.exports = { createIndexes, dropIndexes };
