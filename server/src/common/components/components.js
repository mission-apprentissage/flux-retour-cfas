const createUsers = require("./users");
const createUserEvents = require("./userEvents");
const createJobEvents = require("./jobEvents");
const createDossierApprenant = require("./dossiersApprenants");
const cfasComponent = require("./cfas");
const reseauxCfasComponent = require("./reseauxCfas");
const formationsComponent = require("./formations");
const createStats = require("./stats");
const createEffectifs = require("./effectifs");
const demandeIdentifiantsComponent = require("./demandeIdentifiants");
const demandeBranchementErpComponent = require("./demandeBranchementErp");
const createCacheComponent = require("./cache");
const createOvhStorageComponent = require("./ovhStorage");
const createArchiveDossiersApprenantsComponent = require("./archiveDossiersApprenants");

module.exports = async (options = {}) => {
  const db = options.db;

  const users = options.users || (await createUsers());
  const ovhStorage = options.ovhStorage || createOvhStorageComponent();
  const userEvents = options.userEvents || createUserEvents();
  const jobEvents = options.jobEvents || createJobEvents();
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const formations = options.formations || formationsComponent();
  const cfas = options.cfas || cfasComponent();
  const reseauxCfas = options.reseauxCfas || reseauxCfasComponent();
  const stats = options.stats || createStats();
  const effectifs = options.effectifs || createEffectifs();
  const demandeIdentifiants = options.demandeIdentifiants || demandeIdentifiantsComponent();
  const demandeBranchementErp = options.demandeBranchementErp || demandeBranchementErpComponent();
  const cache = options.cache || createCacheComponent(options.redisClient);
  const archiveDossiersApprenants =
    options.archiveDossiersApprenants || createArchiveDossiersApprenantsComponent({ db });

  return {
    users,
    ovhStorage,
    userEvents,
    jobEvents,
    cache,
    db,
    dossiersApprenants,
    formations,
    cfas,
    reseauxCfas,
    stats,
    effectifs,
    demandeIdentifiants,
    demandeBranchementErp,
    archiveDossiersApprenants,
  };
};
