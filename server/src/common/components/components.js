const { connectToMongo } = require("../mongodb");
const createUsers = require("./users");
const createUserEvents = require("./userEvents");
const createJobEvents = require("./jobEvents");
const createStatutsCandidats = require("./statutsCandidats");
const cfasComponent = require("./cfas");
const formationsComponent = require("./formations");
const createStats = require("./stats");
const createEffectifs = require("./effectifs");
const cfaDataFeedbackComponent = require("./cfaDataFeedback");
const demandeIdentifiantsComponent = require("./demandeIdentifiants");
const demandeLienPriveComponent = require("./demandeLienPrive");
const demandeBranchementErpComponent = require("./demandeBranchementErp");
const createCacheComponent = require("./cache");

module.exports = async (options = {}) => {
  const users = options.users || (await createUsers());
  const userEvents = options.userEvents || createUserEvents();
  const jobEvents = options.jobEvents || createJobEvents();
  const statutsCandidats = options.statutsCandidats || createStatutsCandidats();
  const formations = options.formations || formationsComponent();
  const cfas = options.cfas || cfasComponent();
  const cfaDataFeedback = options.cfas || cfaDataFeedbackComponent();
  const stats = options.stats || createStats();
  const effectifs = options.effectifs || createEffectifs();
  const demandeIdentifiants = options.demandeIdentifiants || demandeIdentifiantsComponent();
  const demandeLienPrive = options.demandeLienPrive || demandeLienPriveComponent();
  const demandeBranchementErp = options.demandeBranchementErp || demandeBranchementErpComponent();
  const cache = options.cache || createCacheComponent(options.redisClient);

  return {
    users,
    userEvents,
    jobEvents,
    cache,
    db: options.db || (await connectToMongo()).db,
    statutsCandidats,
    cfaDataFeedback,
    formations,
    cfas,
    stats,
    effectifs,
    demandeIdentifiants,
    demandeBranchementErp,
    demandeLienPrive,
  };
};
