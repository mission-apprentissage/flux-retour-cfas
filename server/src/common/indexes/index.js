const { createFormationsCollectionIndexes } = require("./formations.indexes");
const { createStatutsCandidatsCollectionIndexes } = require("./statutsCandidats.indexes");
const { createUserEventsCollectionIndexes } = require("./userEvents.indexes");

const createIndexes = async (db) => {
  await createUserEventsCollectionIndexes(db);
  await createStatutsCandidatsCollectionIndexes(db);
  await createFormationsCollectionIndexes(db);
};

module.exports = { createIndexes };
