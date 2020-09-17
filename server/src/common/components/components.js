const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());

  return {
    users,
    db: options.db || (await connectToMongo()).db,
  };
};
