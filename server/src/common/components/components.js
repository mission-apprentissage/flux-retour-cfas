import createUsers from "./users.js";
import createDossierApprenant from "./dossiersApprenants.js";
import cfasComponent from "./cfas.js";
import reseauxCfasComponent from "./reseauxCfas.js";
import createStats from "./stats.js";
import createEffectifs from "./effectifs.js";
import createCacheComponent from "./cache.js";

export default async (options = {}) => {
  const db = options.db;

  const users = options.users || (await createUsers());
  const dossiersApprenants = options.dossiersApprenants || createDossierApprenant();
  const cfas = options.cfas || cfasComponent();
  const reseauxCfas = options.reseauxCfas || reseauxCfasComponent();
  const stats = options.stats || createStats();
  const effectifs = options.effectifs || createEffectifs();

  // TODO Refacto infra components -> to services structure
  const cache = options.cache || createCacheComponent(options.redisClient);

  return {
    users,
    cache,
    db,
    dossiersApprenants,
    cfas,
    reseauxCfas,
    stats,
    effectifs,
  };
};
