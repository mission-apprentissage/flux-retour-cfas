import createUsers from "./users.js";
import createUserEvents from "./userEvents.js";
import createJobEvents from "./jobEvents.js";
import createDossierApprenant from "./dossiersApprenants.js";
import cfasComponent from "./cfas.js";
import reseauxCfasComponent from "./reseauxCfas.js";
import formationsComponent from "./formations.js";
import createStats from "./stats.js";
import createEffectifs from "./effectifs.js";
import demandeIdentifiantsComponent from "./demandeIdentifiants.js";
import demandeBranchementErpComponent from "./demandeBranchementErp.js";
import createCacheComponent from "./cache.js";
import createOvhStorageComponent from "./ovhStorage.js";
import createArchiveDossiersApprenantsComponent from "./archiveDossiersApprenants.js";
import { createClamav } from "../infra/clamav/index.js";
import config from "../../../config/index.js";

export default async (options = {}) => {
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

  // TODO Refacto infra components -> to services structure
  const clamav = options.clamav || (await createClamav(config.clamav.uri));
  const cache = options.cache || createCacheComponent(options.redisClient);

  const archiveDossiersApprenants =
    options.archiveDossiersApprenants || createArchiveDossiersApprenantsComponent({ db });

  return {
    users,
    ovhStorage,
    userEvents,
    jobEvents,
    cache,
    clamav,
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
