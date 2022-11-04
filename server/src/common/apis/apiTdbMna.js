const axios = require("axios");
const logger = require("../../common/logger");
const config = require("../../../config");

// TODO Temp integration from PS repo
// TODO Remove this api & post directly
const API_ENDPOINT = `${config.publicUrl}/api`;

/**
 * Méthode de healthcheck sur l'API
 * @param {*} uai
 * @returns
 */
const healthcheck = async () => {
  const url = `${API_ENDPOINT}/healthcheck`;
  try {
    const { data } = await axios.get(url, { insecureHTTPParser: true }); // TODO remove insecureHTTPParser when fixed
    return data;
  } catch (err) {
    logger.error(`API TDB healthcheck: something went wrong`, err.response.data);
    throw new Error(`An error occurred while getting TdbApiHealthcheck`);
  }
};

/**
 * Méthode d'authentification via usename & password
 * @param {*} username & password
 * @returns
 */
const loginAndGetBearerToken = async ({ username, password }) => {
  const url = `${API_ENDPOINT}/login`;
  try {
    const { data } = await axios.post(url, { username, password }, { insecureHTTPParser: true }); // TODO remove insecureHTTPParser when fixed
    return {
      Authorization: "Bearer " + data.access_token,
    };
  } catch (err) {
    logger.error(`API TDB loginAndGetBearerToken: something went wrong`, err.response.data);
    throw new Error(`An error occurred while login`);
  }
};

/**
 * Méthode de test d'authentification à la route de post des dossiersApprenants
 * @param {*} bearerToken
 * @returns
 */
const testAuthDossierApprenants = async (bearerToken) => {
  const url = `${API_ENDPOINT}/dossiers-apprenants/test`;
  try {
    const { data } = await axios.post(url, {}, { headers: bearerToken, insecureHTTPParser: true }); // TODO remove insecureHTTPParser when fixed
    return data;
  } catch (err) {
    logger.error(`API TDB testAuthDossierApprenants: something went wrong`, err.response.data);
    throw new Error(`An error occurred while testing TDB API testAuthDossierApprenants`);
  }
};

/**
 * Méthode d'envoi d'une liste de dossiersApprenants
 * @param {*} bearerToken
 * @param {*} dossiersApprenants
 * @returns
 */
const postDossierApprenants = async ({ bearerToken, dossiersApprenants }) => {
  const url = `${API_ENDPOINT}/dossiers-apprenants`;
  try {
    const { data } = await axios.post(url, dossiersApprenants, { headers: bearerToken, insecureHTTPParser: true }); // TODO remove insecureHTTPParser when fixed
    return data;
  } catch (err) {
    logger.error(`API TDB postDossierApprenants: something went wrong`, err.response.data);
    throw new Error(`An error occurred while posting dossiersApprenants`);
  }
};

module.exports = { postDossierApprenants, testAuthDossierApprenants, loginAndGetBearerToken, healthcheck };
