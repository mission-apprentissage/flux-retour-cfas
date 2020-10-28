const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createStatutsCandidats = require("./statutsCandidats");
const createStats = require("./stats");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const statutsCandidats = options.statutsCandidats || (await createStatutsCandidats());
  const stats = options.stats || (await createStats());

  return {
    users,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    stats,
  };
};
