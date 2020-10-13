const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createStatutsCandidats = require("./statutsCandidats");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const statutsCandidats = options.statutsCandidats || (await createStatutsCandidats());

  return {
    users,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
  };
};
