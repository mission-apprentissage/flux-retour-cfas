import { runScript } from '../../scriptWrapper';
import logger from '../../../common/logger';
import { JOB_NAMES } from '../../../common/constants/jobsConstants';
import { dossiersApprenantsDb } from '../../../common/model/collections';

runScript(async () => {
  logger.info("Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants ....");
  await dossiersApprenantsDb().updateMany({}, { $unset: { etablissement_reseaux: 1 } });
  logger.info(
    "Suppression du champ etablissement_reseaux de tous les documents dossiersApprenants terminée avec succès !"
  );
}, JOB_NAMES.clearDossiersApprenantsNetworks);
