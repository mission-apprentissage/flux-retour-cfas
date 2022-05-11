const arg = require("arg");
const Joi = require("joi");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { DossierApprenantModel } = require("../../../common/model");

runScript(async () => {
  const args = arg({ "--filterDate": String, "--uai": String }, { argv: process.argv.slice(2) });

  const dateArg = args["--filterDate"];

  if (!dateArg || Joi.date().iso().validate(dateArg)?.error || new Date(dateArg).toString() === "Invalid Date") {
    throw new Error("Invalid --filterDate passed, should be ISO formatted (YYYY-MM-DD)");
  }

  const uaiArg = args["--uai"];
  if (!uaiArg) {
    throw new Error("No --uai passed");
  }

  const date = new Date(args["--filterDate"]);
  const uai = args["--uai"];

  logger.info(`Suppression des données pour l'UAI ${uai} non recues depuis ${date.toISOString()}...`);
  const result = await DossierApprenantModel.deleteMany({
    annee_scolaire: "2021-2022",
    uai_etablissement: uai,
    updated_at: { $lte: date },
  });
  logger.info(`${result.deletedCount} dossiersApprenants supprimés avec succès pour l'UAI ${uai}`);
}, "suppression-dossiersApprenants-apres-date");
