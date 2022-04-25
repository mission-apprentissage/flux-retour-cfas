const { runScript } = require("../scriptWrapper");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { RESEAUX_CFAS } = require("../../common/constants/networksConstants");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { ListReseauxModel } = require("../../common/model");
const logger = require("../../common/logger");

const CFAS_NETWORKS = [
  RESEAUX_CFAS.CMA,
  RESEAUX_CFAS.UIMM,
  RESEAUX_CFAS.AGRI,
  RESEAUX_CFAS.MFR,
  RESEAUX_CFAS.CCI,
  RESEAUX_CFAS.CFA_EC,
  RESEAUX_CFAS.GRETA,
  RESEAUX_CFAS.AFTRAL,
];

/**
 * Script qui initialise la collection List Reseaux
 */
runScript(async () => {
  logger.info("Seeding List Reseaux");
  await ListReseauxModel.deleteMany();
  await asyncForEach(CFAS_NETWORKS, async (currentNetwork) => {
    await new ListReseauxModel({
      network: currentNetwork.nomReseau,
    }).save();
  });
  logger.info("End Seeding List Reseaux");
}, JOB_NAMES.seedListReseaux);
