import cliProgress from "cli-progress";
import { asyncForEach } from "../../../../common/utils/asyncUtils.js";
import logger from "../../../../common/logger.js";
import { organismesDb } from "../../../../common/model/collections.js";
import { algoUAI, getLocalisationInfoFromUai } from "../../../../common/utils/uaiUtils.js";
import { siretSchema } from "../../../../common/utils/validationUtils.js";
import Joi from "joi";
import { createJobEvent } from "../../../../common/actions/jobEvents.actions.js";

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * Ce script analyse la fiabilisation de tous les cfas
 */
export const analyseFiabilisationCfas = async () => {
  logger.info("Analyse fiabilisation des cfas avant migration vers organismes");

  // Parse toute la collection cfas
  const allCfas = await organismesDb().find({}).toArray();

  let nbCfasInvalidTotal = 0;
  let nbCfasInvalidUaiAlgo = 0;
  let nbCfasInvalidUaiLocalisation = 0;
  let nbCfasInvalidSirets = 0;

  logger.info(`Analyse de ${allCfas.length} cfas...`);
  loadingBar.start(allCfas.length, 0);

  await asyncForEach(allCfas, async (currentCfa) => {
    const { isCfaInvalid, isValidCfaUaiAlgo, isValidCfaUaiLocalisation, isValidCfaSirets } =
      await analyseFiabilisationCfa(currentCfa);

    // Count selon l'invalidité
    if (isCfaInvalid === true) nbCfasInvalidTotal++;
    if (isValidCfaUaiAlgo === false) nbCfasInvalidUaiAlgo++;
    if (isValidCfaUaiLocalisation === false) nbCfasInvalidUaiLocalisation++;
    if (isValidCfaSirets === false) nbCfasInvalidSirets++;

    loadingBar.increment();
  });

  loadingBar.stop();

  logger.info(`-> ${nbCfasInvalidTotal} cfas invalides au total`);
  logger.info(`--> ${nbCfasInvalidUaiAlgo} cfas invalides sur l'algo UAI`);
  logger.info(`--> ${nbCfasInvalidUaiLocalisation} cfas invalides sur la localisation UAI`);
  logger.info(`--> ${nbCfasInvalidSirets} cfas invalides sur leurs sirets`);
};

/**
 * Ce script analyse la fiabilisation d'un cfa
 * Analyse sur l'UAI : algo & localisation
 * Analyse sur le SIRET : siretSchema validation
 */
export const analyseFiabilisationCfa = async ({ uai, sirets }) => {
  const isValidCfaUaiAlgo = await analyseCfaUaiAlgo(uai);
  const isValidCfaUaiLocalisation = await analyseCfaUaiLocalisation(uai);
  const isValidCfaSirets = await analyseCfaSirets(sirets);

  let isCfaInvalid = false;

  if (isValidCfaUaiAlgo === false || isValidCfaUaiLocalisation === false || isValidCfaSirets === false)
    isCfaInvalid = true;

  return { isCfaInvalid, isValidCfaUaiAlgo, isValidCfaUaiLocalisation, isValidCfaSirets };
};

/**
 * Analyse de l'algo de l'UAI du cfa
 * @param {*} uai
 * @returns
 */
const analyseCfaUaiAlgo = async (uai) => {
  const isValidUaiAlgo = algoUAI(uai);

  if (!isValidUaiAlgo) {
    await createJobEvent({
      jobname: "refacto-migration-cfas-to-organismes",
      date: new Date(),
      action: "analyse-cfa-invalid-uai-algo",
      data: { uai },
    });
    return false;
  }

  return true;
};

/**
 * Analyse de la localisation de l'UAI du cfa
 * @param {*} uai
 * @returns
 */
const analyseCfaUaiLocalisation = async (uai) => {
  const isValidUaiLocalisation = getLocalisationInfoFromUai(uai);

  if (!isValidUaiLocalisation) {
    await createJobEvent({
      jobname: "refacto-migration-cfas-to-organismes",
      date: new Date(),
      action: "analyse-cfa-invalid-uai-localisation",
      data: { uai },
    });
    return false;
  }

  return true;
};

/**
 * Analyse du format des SIRETs de cfa
 * @param {*} currentSiret
 * @returns
 */
const analyseCfaSirets = async (sirets) => {
  const validateSirets = Joi.array().items(siretSchema()).validate(sirets);
  if (validateSirets.error) {
    await createJobEvent({
      jobname: "refacto-migration-cfas-to-organismes",
      date: new Date(),
      action: "analyse-cfa-invalid-sirets-format",
      data: { sirets },
    });
    return false;
  }
  return true;
};
