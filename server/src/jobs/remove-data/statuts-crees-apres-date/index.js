const arg = require("arg");
const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { DossierApprenantModel } = require("../../../common/model");

runScript(async () => {
  const args = arg({ "--afterDate": String }, { argv: process.argv.slice(2) });

  const dateArg = args["--afterDate"];
  if (!dateArg || new Date(dateArg).toString() === "Invalid Date") {
    throw new Error("Invalid --afterDate passed");
  }

  const date = new Date(args["--afterDate"]);

  logger.info("Suppression des données créées après", date.toISOString(), "...");
  const result = await DossierApprenantModel.deleteMany({ created_at: { $gte: date } });
  logger.info(result.deletedCount, "dossiersApprenants supprimés avec succès");
}, "suppression-dossiersApprenants-apres-date");
