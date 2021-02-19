const { createStatutsCandidatsCollectionIndexes } = require("./statutsCandidats.indexes");
const { createUserEventsCollectionIndexes } = require("./userEvents.indexes");

const createIndexes = async (db) => {
  await createUserEventsCollectionIndexes(db);
  await createStatutsCandidatsCollectionIndexes(db);
};

module.exports = { createIndexes };
