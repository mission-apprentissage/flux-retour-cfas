const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createUserEvents = require("./userEvents");
const createStatutsCandidats = require("./statutsCandidats");
const formationsComponent = require("./formations");
const createStats = require("./stats");
const createDashboard = require("./dashboard");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const userEvents = options.userEvents || createUserEvents();
  const statutsCandidats = options.statutsCandidats || createStatutsCandidats();
  const formations = options.formations || formationsComponent();
  const stats = options.stats || createStats();
  const dashboard = options.dashboard || createDashboard();

  return {
    users,
    userEvents,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    formations,
    stats,
    dashboard,
  };
};
