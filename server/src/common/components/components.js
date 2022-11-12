import createUsers from './users';
import createUserEvents from './userEvents';
import createJobEvents from './jobEvents';
import createDossierApprenant from './dossiersApprenants';
import cfasComponent from './cfas';
import reseauxCfasComponent from './reseauxCfas';
import formationsComponent from './formations';
import createStats from './stats';
import createEffectifs from './effectifs';
import demandeIdentifiantsComponent from './demandeIdentifiants';
import demandeBranchementErpComponent from './demandeBranchementErp';
import createCacheComponent from './cache';
import createOvhStorageComponent from './ovhStorage';
import createArchiveDossiersApprenantsComponent from './archiveDossiersApprenants';

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
