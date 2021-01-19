const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createUserEvents = require("./userEvents");
const createStatutsCandidats = require("./statutsCandidats");
const createStats = require("./stats");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const userEvents = options.userEvents || (await createUserEvents());
  const statutsCandidats = options.statutsCandidats || (await createStatutsCandidats());
  const stats = options.stats || (await createStats());

  return {
    users,
    userEvents,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    stats,
  };
};
