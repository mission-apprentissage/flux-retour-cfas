const arg = require("arg");
const Joi = require("joi");

const { runScript } = require("../../scriptWrapper");
const logger = require("../../../common/logger");
const { DossierApprenantModel } = require("../../../common/model");
const { validateUai } = require("../../../common/domain/uai");
const { validateSiret } = require("../../../common/domain/siret");
const { getAnneesScolaireListFromDate } = require("../../../common/utils/anneeScolaireUtils");

/**
 * Script de suppression des dossiersApprenants non recus depuis une date passée en paramètre
 * possibilité de filter par UAI et/ou SIRET ainsi que pour une date liée à des années scolaire
 */
runScript(async () => {
  const args = arg(
    { "--filterDate": String, "--uai": String, "--siret": String, "--anneeScolaireDate": String },
    { argv: process.argv.slice(2) }
  );

  const date = handleDateArg(args);
  const anneesScolaires = handleAnneesScolaireDateArg(args);
  const { uai, siret } = handleSiretAndUaiArgs(args);

  let deleteQuery = {
    annee_scolaire: { $in: anneesScolaires },
    updated_at: { $lte: date },
  };

  if (uai) {
    logger.info(`Suppression des données pour UAI ${uai} non recues depuis ${date.toISOString()}...`);
    deleteQuery = { ...deleteQuery, uai_etablissement: uai };
  }

  if (siret) {
    logger.info(`Suppression des données pour SIRET ${siret} non recues depuis ${date.toISOString()}...`);
    deleteQuery = { ...deleteQuery, siret_etablissement: siret };
  }

  const result = await DossierApprenantModel.deleteMany(deleteQuery);
  logger.info(`${result.deletedCount} dossiersApprenants supprimés avec succès`);
}, "suppression-dossiersApprenants-non-recus-apres-date");

/**
 * Récupération et contrôles de la date en argument
 * @param {*} args
 * @returns
 */
const handleDateArg = (args) => {
  const date = args["--filterDate"];
  if (!date || Joi.date().iso().validate(date)?.error || new Date(date).toString() === "Invalid Date") {
    throw new Error("Invalide --filterDate, doit être au format ISO (YYYY-MM-DD)");
  }
  return new Date(args["--filterDate"]);
};

/**
 * Récupération & contrôles de l'UAI et/ou SIRET en argument
 * @param {*} args
 */
const handleSiretAndUaiArgs = (args) => {
  const uai = args["--uai"];
  const siret = args["--siret"];

  if (!uai && !siret) {
    throw new Error("Aucun --uai ou --siret n'est fourni");
  }

  if (uai && validateUai(uai).error) {
    throw new Error("Invalid --uai format passed");
  }

  if (siret && validateSiret(siret).error) {
    throw new Error("Invalid --siret format passed");
  }

  return { uai, siret };
};

/**
 * Récupération et contrôles de la date pour années scolaire en argument
 * @param {*} args
 * @returns
 */
const handleAnneesScolaireDateArg = (args) => {
  const date = args["--anneeScolaireDate"];
  if (!date || Joi.date().iso().validate(date)?.error || new Date(date).toString() === "Invalid Date") {
    throw new Error("Invalide --anneeScolaireDate, doit être fournie et au format ISO (YYYY-MM-DD)");
  }
  return getAnneesScolaireListFromDate(new Date(args["--anneeScolaireDate"]));
};
