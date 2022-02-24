const arg = require("arg");
const Joi = require("joi");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { StatutCandidatModel } = require("../../../common/model");
const { asyncForEach } = require("../../../common/utils/asyncUtils");

runScript(async ({ effectifs }) => {
  const args = arg({ "--filterDate": String }, { argv: process.argv.slice(2) });

  const dateArg = args["--filterDate"];
  if (!dateArg || Joi.date().iso().validate(dateArg)?.error || new Date(dateArg).toString() === "Invalid Date") {
    throw new Error("Invalid --filterDate passed, should be ISO formatted (YYYY-MM-DD)");
  }

  const filterDate = new Date(args["--filterDate"]);

  logger.info("Suppression des apprentis non recus depuis le ", filterDate.toISOString(), "...");

  /**
   * Suppression des apprentis pour l'année scolaire 2021-2022
   * non recus depuis le "filterDate" non envoyés par SCForm
   */
  const query = {
    annee_scolaire: "2021-2022",
    updated_at: { $lte: filterDate },
    source: { $ne: "scform" },
  };

  const toDelete = await effectifs.apprentis.getListAtDate(new Date(), query);
  logger.info(toDelete.length, "apprentis found");
  let count = 0;

  await asyncForEach(toDelete, async (statut) => {
    const result = await StatutCandidatModel.deleteOne({ _id: statut._id });
    count += result.deletedCount;
  });

  logger.info(count, "apprentis supprimés avec succès");
}, "suppression-statuts-apprentis-nonRecus-depuis");
