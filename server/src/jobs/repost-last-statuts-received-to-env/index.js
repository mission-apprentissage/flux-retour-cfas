const { runScript } = require("../scriptWrapper");
const cliProgress = require("cli-progress");
const logger = require("../../common/logger");
const { UserEventModel } = require("../../common/model");
const { asyncForEach } = require("../../common/utils/asyncUtils");
const { JOB_NAMES } = require("../../common/constants/jobsConstants");
const { subDays, startOfDay } = require("date-fns");
const axios = require("axios").default;
const env = require("env-var");

const loadingBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
const destinationApiUrl = env.get("FLUX_RETOUR_CFAS_REPOST_JOB_DEST_API_URL").asString();

/**
 * Ce script permet d'envoyer  les derniers DossierApprenant reçus la veille
 * via un POST sur la route d'API de l'environnement souhaité
 *
 * L'url de l'api, ainsi que le username / password sont récupérés dans des variables d'environnement (/server/.env)
 * nécessaires au bon fonctionnement du script :
 * FLUX_RETOUR_CFAS_REPOST_JOB_DEST_API_URL
 * FLUX_RETOUR_CFAS_REPOST_JOB_USERNAME_XXXX FLUX_RETOUR_CFAS_REPOST_JOB_PASSWORD_XXXX et pour chaque ERP
 */
runScript(async () => {
  logger.info(`Run Post Last Received DossiersApprenants Job to ${destinationApiUrl}`);
  await repostLastReceivedDossiersApprenantsToEnv();
  logger.info(`End Post Last Received DossiersApprenants Job`);
}, JOB_NAMES.repostLastStatutsReceived);

/**
 * Cette fonction envoi sur l'API souhaitée l'ensemble des derniers statuts recus la veille
 */
const repostLastReceivedDossiersApprenantsToEnv = async () => {
  // Récupération des usersEvents de la veille
  const lastUserEventsReceived = await UserEventModel.find({
    date: { $gte: startOfDay(subDays(new Date(), 1)), $lt: startOfDay(new Date()) },
    action: "statut-candidats",
    type: "POST",
  });

  if (lastUserEventsReceived.length > 0) {
    // Création d'une MAP de tokens pour tous les users uniques trouvés dans les usersEvents
    const usersTokensMap = await getUserTokensMapFromList([
      ...new Set(lastUserEventsReceived.map((item) => item.username)),
    ]);

    logger.info(`${lastUserEventsReceived.length} blocs de données de la veille à reposter ...`);
    loadingBar.start(lastUserEventsReceived.length, 0);

    await asyncForEach(lastUserEventsReceived, async (currentUserEventToRepost) => {
      try {
        // Récupération du token pour l'utilisateur source courant
        const currentUserAccessToken = usersTokensMap.get(currentUserEventToRepost.username) ?? null;
        if (currentUserAccessToken !== null) {
          // Post des data vers l'API destination
          const response = await axios.post(
            `${destinationApiUrl}/api/dossiers-apprenants`,
            currentUserEventToRepost.data,
            { headers: { Authorization: `Bearer ${currentUserAccessToken}` } }
          );

          if (response?.status !== 200) {
            logger.error(
              `Something went wrong while reposting data with id ${currentUserEventToRepost._id} on ${destinationApiUrl} with user ${currentUserEventToRepost.username}`
            );
          }
        } else {
          logger.error(`Aucun token trouvé pour ${currentUserEventToRepost.username}`);
        }
      } catch (err) {
        logger.error(
          `Something went wrong while reposting data with id ${currentUserEventToRepost._id} on ${destinationApiUrl} with user ${currentUserEventToRepost.username}`,
          err
        );
      }

      loadingBar.increment();
    });
  }
  loadingBar.stop();
};

/**
 * Construction d'une MAP des tokens des users depuis la liste fournie
 * @param {*} usernameList
 * @returns
 */
const getUserTokensMapFromList = async (usernameList) => {
  let tokensMap = new Map();

  await asyncForEach(usernameList, async (currentUsername) => {
    // Récupération du token à partir des variables d'env - format avec pattern
    const accessTokenForUser = await getJwtForUser(
      env.get(`FLUX_RETOUR_CFAS_REPOST_JOB_USERNAME_${currentUsername}`).asString(),
      env.get(`FLUX_RETOUR_CFAS_REPOST_JOB_PASSWORD_${currentUsername}`).asString()
    );

    if (!accessTokenForUser) {
      throw new Error(`Aucun JWT Access Token trouvé pour ${currentUsername} depuis les variables d'environment`);
    }

    // Si acces API ok on ajoute le token à la MAP
    if ((await isPostStatutsApiAllowed(accessTokenForUser)) === true) {
      tokensMap.set(currentUsername, accessTokenForUser);
    } else {
      logger.info(`JWT Token non autorisé pour ${currentUsername} depuis les variables d'environment`);
    }
  });

  return tokensMap;
};

/**
 * Vérifie qu'avec un token on a acces à l'API de post des statuts
 * @param {*} accessToken
 * @returns
 */
const isPostStatutsApiAllowed = async (accessToken) => {
  const response = await axios.post(
    `${destinationApiUrl}/api/dossiers-apprenants/test`,
    {},
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  return response?.status === 200;
};

/**
 * Récupère un token d'authentification pour le username / password
 * @param {*} username
 * @param {*} password
 * @returns
 */
const getJwtForUser = async (username, password) => {
  const { data } = await axios.post(`${destinationApiUrl}/api/login`, { username, password });
  return data.access_token;
};
