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
};

const dropIndexes = async (db) => {
  await dropStatutsCandidatsCollectionIndexes(db);
  await dropFormationsCollectionIndexes(db);
  await dropUserEventsCollectionIndexes(db);
};

module.exports = { createIndexes, dropIndexes };
