const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createUserEvents = require("./userEvents");
const createJobEvents = require("./jobEvents");
const createStatutsCandidats = require("./statutsCandidats");
const cfasComponent = require("./cfas");
const formationsComponent = require("./formations");
const createStats = require("./stats");
const createDashboard = require("./dashboard");
const cfaDataFeedbackComponent = require("./cfaDataFeedback");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const userEvents = options.userEvents || createUserEvents();
  const jobEvents = options.jobEvents || createJobEvents();
  const statutsCandidats = options.statutsCandidats || createStatutsCandidats();
  const formations = options.formations || formationsComponent();
  const cfas = options.cfas || cfasComponent();
  const cfaDataFeedback = options.cfas || cfaDataFeedbackComponent();
  const stats = options.stats || createStats();
  const dashboard = options.dashboard || createDashboard();

  return {
    users,
    userEvents,
    jobEvents,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    cfaDataFeedback,
    formations,
    cfas,
    stats,
    dashboard,
  };
};
