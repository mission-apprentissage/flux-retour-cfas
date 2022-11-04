const config = require("../../../../config/index.js");
const {
  healthcheck,
  loginAndGetBearerToken,
  testAuthDossierApprenants,
  postDossierApprenants,
} = require("../../../common/apis/apiTdbMna.js");
const { JOB_NAMES } = require("../../../common/constants/jobsConstants.js");
const logger = require("../../../common/logger.js");
const { COLLECTIONS_NAMES } = require("../../../common/model/collections.js");
const { toDossiersApprenantsList } = require("../../../common/model/mappers/donneesApprenantsMapper.js");
const { dbCollection } = require("../../../common/mongodb.js");
const { splitIntoChunksList } = require("../../../common/utils/arrayUtils.js");
const { asyncForEach } = require("../../../common/utils/asyncUtils.js");

const TDB_DOSSIERSAPPRENANT_CHUNK_SIZE = 99;

const runSendDossiersApprenantsToTdb = async (jobEvents) => {
  logger.info("Envoi des données apprenants sous forme de dossiersApprenants à l'API TDB");

  // Check API & Log User
  await checkApiAvailable();
  const bearerToken = await logApiUser();

  // Traitement de la liste des donnees pour chaque utilisateur
  const distinctUsersEmail = await dbCollection(COLLECTIONS_NAMES.PsDonneesApprenants).distinct("user_email");
  logger.info(`${distinctUsersEmail.length} utilisateurs différents ayant des donnéesApprenants à envoyer au TDB`);

  // Pour chaque utilisateur identifié on transforme ses données puis on les envoie au TDB
  await asyncForEach(distinctUsersEmail, async (currentUserEmail) => {
    logger.info(`...Traitement des données pour l'utilisateur ${currentUserEmail} `);

    const donneesApprenantsForUser = await dbCollection(COLLECTIONS_NAMES.PsDonneesApprenants)
      .find({ user_email: currentUserEmail })
      .toArray();

    // Construction d'une liste de dossiersApprenants en mappant chaque élément
    const dossiersApprenantsForUser = [];
    donneesApprenantsForUser.forEach((currentDonneeApprenant) => {
      dossiersApprenantsForUser.push(...toDossiersApprenantsList(currentDonneeApprenant));
    });

    // Envoi à l'api de la liste + log userEvent
    await sendDossiersApprenantsForUserToTdb(dossiersApprenantsForUser, bearerToken, currentUserEmail, jobEvents);

    logger.info(`Envoi des données pour l'utilisateur ${currentUserEmail} terminé !`);
  });
};

/**
 * Méthode d'envoi des dossiersApprenants à l'API du TDB
 * @param {*} dossiersApprenantsToSend
 * @param {*} bearerToken
 */
const sendDossiersApprenantsForUserToTdb = async (
  dossiersApprenantsToSend,
  bearerToken,
  currentUserEmail,
  jobEvents
) => {
  const dossiersApprenantsChunksList = splitIntoChunksList(dossiersApprenantsToSend, TDB_DOSSIERSAPPRENANT_CHUNK_SIZE);

  for (const key in dossiersApprenantsChunksList) {
    const chunkToSend = dossiersApprenantsChunksList[key];

    try {
      const { ok, ko, status, message } = await postDossierApprenants({
        bearerToken,
        dossiersApprenants: chunkToSend,
      });

      if (status === "KO") {
        logger.error(`Envoi des dossiersApprenants en erreur : ${message}`);
      } else {
        logger.info(`-> ${ok} dossiersApprenants valides lors de l'envoi du chunk...`);
        logger.info(`-> ${ko} dossiersApprenants non valides lors de l'envoi du chunk...`);
      }

      // Log des dossiers envoyées
      await logDossiersApprenantsSentForUser(jobEvents, chunkToSend, currentUserEmail);
    } catch (err) {
      logger.err(`Erreur lors de l'envoi des données pour l'utilisateur ${currentUserEmail}`);
      logger.err(`Erreur ${err}`);
    }
  }
};

/**
 * Log des dossiersApprenants envoyés
 * @param {*} jobEvents
 * @param {*} dossiersApprenantsToLog
 */
const logDossiersApprenantsSentForUser = async (jobEvents, dossiersApprenantsToLog, userEmail) => {
  await jobEvents.createJobEvent({
    jobname: JOB_NAMES.sendDossiersApprenants,
    action: "dossiersApprenants-sent",
    data: { user_email: userEmail, dossiersApprenants: dossiersApprenantsToLog },
  });
};

/**
 * Vérification de la disponibilité de l'API
 */
const checkApiAvailable = async () => {
  const testHealthcheck = await healthcheck();
  if (!testHealthcheck) throw new Error("API Tdb Indisponible");
};

/**
 * Authentification de l'utilisateur & vérification des droits
 * @returns
 */
const logApiUser = async () => {
  const bearerToken = await loginAndGetBearerToken({
    username: config.mnaTdb.userName,
    password: config.mnaTdb.userPassword,
  });
  if (!bearerToken) throw new Error("Impossible de s'authentifier à l'API");

  const testAuthPostDossiersApprenants = await testAuthDossierApprenants(bearerToken);
  if (!testAuthPostDossiersApprenants)
    throw new Error("Impossible de s'authentifier à la route d'envoi des dossiersApprenants");

  return bearerToken;
};

module.exports = { runSendDossiersApprenantsToTdb };
