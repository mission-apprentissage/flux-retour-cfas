import cliProgress from "cli-progress";
import { asyncForEach } from "../../common/utils/asyncUtils.js";
import logger from "../../common/logger.js";
import { cfasDb, jobEventsDb, organismesDb } from "../../common/model/collections.js";
import { createOrganisme, mapCfaPropsToOrganismeProps } from "../../common/actions/organismes.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script effectue la migration de la collection cfas vers la nouvelle collection organismes
 */
export const migrateCfasToOrganismes = async () => {
  logger.info("Migration des cfas vers la collection organismes");

  // Clear des organismes existants
  logger.info(`Suppression des organismes existants...`);
  await organismesDb().deleteMany();

  // Parse toute la collection cfas
  const allCfas = await cfasDb().find({}).toArray();

  let nbCfasMigrated = 0;
  let nbCfasNotMigrated = 0;

  logger.info(`Migration de ${allCfas.length} "cfas" vers la collection "organismes"...`);
  loadingBar.start(allCfas.length, 0);

  await asyncForEach(allCfas, async (currentOldCfa) => {
    // Pour chaque cfa on le transforme en organisme
    const mappedToOrganisme = mapCfaPropsToOrganismeProps(currentOldCfa);
    try {
      await createOrganisme(mappedToOrganisme);
      nbCfasMigrated++;
    } catch (err) {
      nbCfasNotMigrated++;
      const { stack: errorStack, message: errorMessage } = err;
      // Si erreur on la stocke avec l'objet cfa
      await jobEventsDb().insertOne({
        jobname: "refacto-migration-cfas-to-organismes",
        date: new Date(),
        action: "log-cfasNotMigrated",
        data: { cfaProps: currentOldCfa, mappedPros: mappedToOrganisme, error: err, errorMessage, errorStack },
      });
      // TODO better error handling
      // logger.error(`${currentOldCfa.uai} error`);
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`--> ${allCfas.length} cfas initiaux`);
  logger.info(`--> ${nbCfasMigrated} cfas transformés avec succès en organismes`);
  logger.info(`--> ${nbCfasNotMigrated} cfas non transformés (erreur)`);

  // let allOrganismesCount = await organismesDb().countDocuments();
  // logger.info(`--> ${allOrganismesCount} organismes crées`);
};
