const arg = require("arg");
const Joi = require("joi");
const cliProgress = require("cli-progress");

const { runScript } = require("../scriptWrapper");
const logger = require("../../common/logger");
const { DossierApprenantModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

runScript(async ({ dossiersApprenants }) => {
  const args = arg({ "--filterDate": String }, { argv: process.argv.slice(2) });

  const dateArg = args["--filterDate"];
  if (!dateArg || Joi.date().iso().validate(dateArg)?.error || new Date(dateArg).toString() === "Invalid Date") {
    throw new Error("Invalid --filterDate passed, should be ISO formatted (YYYY-MM-DD)");
  }

  const filterDate = new Date(args["--filterDate"]);

  const toAnonymize = await DossierApprenantModel.find({ updated_at: { $lte: filterDate } }).lean();

  logger.info(
    `Anonymisation des ${
      toAnonymize.length
    } dossiers apprentis non mis à jour depuis le ${filterDate.toISOString()} ...`
  );
  loadingBar.start(toAnonymize.length, 0);

  let count = 0;

  await asyncForEach(toAnonymize, async ({ _id }) => {
    loadingBar.increment();
    await dossiersApprenants.anonymize(_id);
    count++;
  });

  loadingBar.stop();
  logger.info(count, "dossiers apprenants anonymisés avec succès");
}, "anonymisation-dossiersApprenants-nonMaj-depuis");
