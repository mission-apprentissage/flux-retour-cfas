import createUsers from "./users.js";
import createUserEvents from "./userEvents.js";
import createJobEvents from "./jobEvents.js";
import createDossierApprenant from "./dossiersApprenants.js";
import cfasComponent from "./cfas.js";
import reseauxCfasComponent from "./reseauxCfas.js";
import createStats from "./stats.js";
import createEffectifs from "./effectifs.js";
import createCacheComponent from "./cache.js";
import createOvhStorageComponent from "./ovhStorage.js";
import createArchiveDossiersApprenantsComponent from "./archiveDossiersApprenants.js";

export default async (options = {}) => {
  const db = options.db;

  const users = options.users || (await createUsers());
  const ovhStorage = options.ovhStorage || createOvhStorageComponent();
  const userEvents = options.userEvents || createUserEvents();
  const jobEvents = options.jobEvents || createJobEvents();
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const cfas = options.cfas || cfasComponent();
  const reseauxCfas = options.reseauxCfas || reseauxCfasComponent();
  const stats = options.stats || createStats();
  const effectifs = options.effectifs || createEffectifs();

  // TODO Refacto infra components -> to services structure
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
    cfas,
    reseauxCfas,
    stats,
    effectifs,
    archiveDossiersApprenants,
  };
};
