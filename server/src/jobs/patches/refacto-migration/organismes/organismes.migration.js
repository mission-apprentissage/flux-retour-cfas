import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { cfasDb, jobEventsDb, organismesDb } from "../../../../common/model/collections.js";
import { getLocalisationInfoFromUai } from "../../../../common/utils/uaiUtils.js";
import Joi from "joi";
import { siretSchema } from "../../../../common/utils/validationUtils.js";
import { createOrganismeFromCfa, mapCfaPropsToOrganismeProps } from "./organismes.migration.actions.js";

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
  let cfasNotMigrated = [];
  let cfasUaiErrors = [];
  let cfasSiretsErrors = [];

  logger.info(`Migration de ${allCfas.length} "cfas" vers la collection "organismes"...`);
  loadingBar.start(allCfas.length, 0);

  await asyncForEach(allCfas, async (currentOldCfa) => {
    // Pour chaque cfa on le transforme en organisme
    const mappedToOrganisme = mapCfaPropsToOrganismeProps(currentOldCfa);
    try {
      await createOrganismeFromCfa(mappedToOrganisme);
      nbCfasMigrated++;
    } catch (error) {
      cfasNotMigrated.push(currentOldCfa.uai);

      // Custom Check erreur de localisation via UAI
      const localisationInfoFromUai = getLocalisationInfoFromUai(currentOldCfa.uai);
      if (!localisationInfoFromUai) {
        cfasUaiErrors.push(currentOldCfa.uai); // TODO [tech] mettre dans une collection pour gestion métier ?
      }

      // Custom Check erreur de format de siret
      const validateSirets = Joi.array().items(siretSchema()).validate(currentOldCfa.sirets);
      if (validateSirets.error) {
        cfasSiretsErrors.push(currentOldCfa.uai); // TODO [tech] mettre dans une collection pour gestion métier ?
      }

      // Si erreur on la stocke avec l'objet cfa
      const { stack: errorStack, message: errorMessage } = error;
      await jobEventsDb().insertOne({
        jobname: "refacto-migration-cfas-to-organismes",
        date: new Date(),
        action: "log-cfasNotMigrated",
        data: {
          cfaProps: currentOldCfa,
          mappedPros: mappedToOrganisme,
          error,
          errorStack,
          errorMessage,
        },
      });
    }

    loadingBar.increment();
  });

  loadingBar.stop();

  // Log & stats
  logger.info(`--> ${allCfas.length} cfas initiaux`);
  logger.info(`--> ${nbCfasMigrated} cfas transformés avec succès en organismes`);
  logger.info(`--> ${cfasNotMigrated.length} cfas non transformés (erreur)`);
  logger.info(`---> ${cfasUaiErrors.length} cfas non transformés à cause d'un pb de localisation via UAI (erreur)`);
  logger.info(`---> ${cfasSiretsErrors.length} cfas non transformés à cause d'un pb de sirets (erreur)`);
};

/**
 * Méthode de migration d'un cfa unique depuis son uai
 * @param {*} uai
 */
export const migrateSingleCfaToOrganisme = async (uai) => {
  logger.info(`Migration du cfas avec uai ${uai} vers la collection organismes`);

  // Clear des organismes existants
  logger.info(`Suppression de l'organisme avec uai ${uai} si existant...`);
  await organismesDb().deleteMany({ uai });

  const currentCfa = await cfasDb().findOne({ uai });
  const mappedToOrganisme = mapCfaPropsToOrganismeProps(currentCfa);

  try {
    await createOrganismeFromCfa(mappedToOrganisme);
    logger.info(`Cfa ${uai} migré avec succès`);
  } catch (error) {
    // Si erreur on la stocke avec l'objet cfa
    const { stack: errorStack, message: errorMessage } = error;
    await jobEventsDb().insertOne({
      jobname: "refacto-migration-cfas-to-organismes",
      date: new Date(),
      action: "log-cfasNotMigrated-unique",
      data: {
        cfaProps: currentCfa,
        mappedPros: mappedToOrganisme,
        error,
        errorStack,
        errorMessage,
      },
    });

    logger.error(`Erreur lors de la migration du cfa ${currentCfa.uai}`);
  }
};
