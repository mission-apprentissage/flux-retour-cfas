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
const demandeAccesComponent = require("./demandeAcces");
const demandeLienAccesComponent = require("./demandeLienAcces");
const demandeBranchementErpComponent = require("./demandeBranchementErp");
const createCacheComponent = require("./cache");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const userEvents = options.userEvents || createUserEvents();
  const jobEvents = options.jobEvents || createJobEvents();
  const demandeAcces = options.demandeAcces || demandeAccesComponent();
  const statutsCandidats = options.statutsCandidats || createStatutsCandidats();
  const formations = options.formations || formationsComponent();
  const cfas = options.cfas || cfasComponent();
  const cfaDataFeedback = options.cfas || cfaDataFeedbackComponent();
  const stats = options.stats || createStats();
  const dashboard = options.dashboard || createDashboard();
  const demandeLienAcces = options.demandeLienAcces || demandeLienAccesComponent();
  const demandeBranchementErp = options.demandeBranchementErp || demandeBranchementErpComponent();
  const cache = createCacheComponent(options.redisClient);

  return {
    users,
    userEvents,
    jobEvents,
    demandeAcces,
    demandeBranchementErp,
    cache,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    cfaDataFeedback,
    formations,
    cfas,
    stats,
    dashboard,
    demandeLienAcces,
  };
};
