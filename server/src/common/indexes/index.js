const { createCfasCollectionIndexes, dropCfasCollectionIndexes } = require("./cfas.indexes");
const { createFormationsCollectionIndexes, dropFormationsCollectionIndexes } = require("./formations.indexes");
const {
  createStatutsCandidatsCollectionIndexes,
  dropStatutsCandidatsCollectionIndexes,
} = require("./statutsCandidats.indexes");
const { createUserEventsCollectionIndexes, dropUserEventsCollectionIndexes } = require("./userEvents.indexes");

const createIndexes = async (db) => {
  await createUserEventsCollectionIndexes(db);
  await createStatutsCandidatsCollectionIndexes(db);
  await createFormationsCollectionIndexes(db);
  await createCfasCollectionIndexes(db);
};

const dropIndexes = async (db) => {
  await dropStatutsCandidatsCollectionIndexes(db);
  await dropFormationsCollectionIndexes(db);
  await dropUserEventsCollectionIndexes(db);
  await dropCfasCollectionIndexes(db);
};

module.exports = { createIndexes, dropIndexes };
