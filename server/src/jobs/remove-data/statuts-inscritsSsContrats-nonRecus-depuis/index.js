const arg = require("arg");
const Joi = require("joi");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { StatutCandidatModel } = require("../../../common/model");

runScript(async () => {
  const args = arg({ "--filterDate": String }, { argv: process.argv.slice(2) });

  const dateArg = args["--filterDate"];
  if (!dateArg || Joi.date().iso().validate(dateArg)?.error || new Date(dateArg).toString() === "Invalid Date") {
    throw new Error("Invalid --filterDate passed, should be ISO formatted (YYYY-MM-DD)");
  }

  const filterDate = new Date(args["--filterDate"]);

  logger.info("Suppression des inscrits sans contrats non recus depuis le ", filterDate.toISOString(), "...");

  //
  /**
   * Suppression des inscrits sans contrats
   * avec un seul élément dans l'historique
   * pour l'année scolaire 2021-2022
   * non recus depuis le "filterDate"
   * non envoyés par SCForm
   */
  const result = await StatutCandidatModel.deleteMany({
    annee_scolaire: "2021-2022",
    historique_statut_apprenant: { $size: 1 },
    "historique_statut_apprenant.valeur_statut": 2,
    updated_at: { $lte: filterDate },
    source: { $ne: "scform" },
  });

  logger.info(result.deletedCount, "statuts candidats supprimés avec succès");
}, "suppression-statuts-inscritsSansContrats-nonRecus-depuis");
