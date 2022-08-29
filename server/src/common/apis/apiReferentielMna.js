const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://referentiel.apprentissage.beta.gouv.fr/api/v1/doc/#/

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

// default cache valid time is 7 days
const DEFAULT_CACHE_EXPIRES_IN = 60 * 60 * 24 * 7;

const CACHE_KEY_PREFIX = "referentiel_uai_siret";

// Redis stores null and undefined as strings "null" and "undefined" so we need to come up with our own null-value
// to siginify there is a cached result but it's null
const CACHE_NULL_VALUE = "NO_DATA";

const fetchOrganismesContactsFromSirets = async (sirets, itemsPerPage = "10", champs = "contacts,uai,siret") => {
  const url = `${API_ENDPOINT}/organismes`;
  try {
    const { data } = await axios.post(url, {
      sirets: sirets,
      champs: champs,
      items_par_page: itemsPerPage,
    });
    return data;
  } catch (err) {
    logger.error(
      `API REFERENTIEL getOrganismesContacts: something went wrong while requesting ${url}`,
      err.response.data
    );
    return null;
  }
};

const fetchOrganismeWithSiret = async (siret) => {
  const url = `${API_ENDPOINT}/organismes/${siret}`;
  const { data } = await axios.get(url);
  return data;
};

const getOrganismeWithSiret =
  (cache) =>
  /**
   * Returns an organisme de formation from cache if found or fetched from Referentiel UAI/SIRET API
   * based on passed SIRET. Returns null if nothing found. Cache can be skipped.
   * @param  {string} siret
   * @param  {Object} [options]
   * @param {boolean} options.skipCache
   * @returns {Object|null}
   */
  async (siret, options = {}) => {
    if (!siret) throw new Error("SIRET not provided");

    const skipCache = options.skipCache === true;
    const cacheKey = `${CACHE_KEY_PREFIX}:siret:${siret}`;

    if (!skipCache) {
      const fromCache = await cache.get(cacheKey);
      if (fromCache) return fromCache === CACHE_NULL_VALUE ? null : JSON.parse(fromCache);
    }

    let result;

    try {
      result = await fetchOrganismeWithSiret(siret);
    } catch (err) {
      // 404 on this route means SIRET was not found
      if (err.response.status === 404) {
        // if organisme is not found, we'll store a null value in the cache
        result = CACHE_NULL_VALUE;
      } else {
        logger.error(`API REFERENTIEL getOrganismeWithSiret something went wrong`, err.response.data);
        throw new Error(`An error occured while fetching SIRET ${siret}`);
      }
    }

    if (!skipCache) {
      const valueToCache = result === CACHE_NULL_VALUE ? CACHE_NULL_VALUE : JSON.stringify(result);
      await cache.set(cacheKey, valueToCache, { expiresIn: DEFAULT_CACHE_EXPIRES_IN });
    }

    return result;
  };

const fetchOrganismesWithUai = async (uai) => {
  const url = `${API_ENDPOINT}/organismes`;
  const { data } = await axios.get(url, { params: { uais: uai } });
  return data;
};

const getOrganismesWithUai =
  (cache) =>
  /**
   * Returns a paginated list of organismes de formation from cache if found or fetched from Referentiel UAI/SIRET API
   * based on passed UAI. Cache can be skipped.
   * @param  {string} uai
   * @param  {Object} [options]
   * @param {boolean} options.skipCache
   * @returns {{pagination:Object, organismes: [Object]}|null}
   */
  async (uai, options = {}) => {
    if (!uai) throw new Error("UAI not provided");

    const skipCache = options.skipCache === true;
    const cacheKey = `${CACHE_KEY_PREFIX}:uai:${uai}`;

    if (!skipCache) {
      const fromCache = await cache.get(cacheKey);
      if (fromCache) return JSON.parse(fromCache);
    }

    try {
      const response = await fetchOrganismesWithUai(uai);

      if (!skipCache) {
        await cache.set(cacheKey, JSON.stringify(response), { expiresIn: DEFAULT_CACHE_EXPIRES_IN });
      }

      return response;
    } catch (err) {
      logger.error(`API REFERENTIEL getOrganismesWithUai something went wrong`, err.response.data);
      throw new Error(`An error occured while fetching UAI ${uai}`);
    }
  };

module.exports = {
  getOrganismeWithSiret,
  getOrganismesWithUai,
  fetchOrganismeWithSiret,
  fetchOrganismesWithUai,
  fetchOrganismesContactsFromSirets,
};
