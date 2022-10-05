const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://referentiel.apprentissage.beta.gouv.fr/api/v1/doc/#/

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

// default cache valid time is 7 days
const DEFAULT_CACHE_EXPIRES_IN = 60 * 60 * 24 * 7;

const CACHE_KEY_PREFIX = "referentiel_uai_siret";

// Referentiel API has a 400 requests/min quota which makes on request every 150ms
const SLEEP_TIME_BETWEEN_API_REQUESTS = 150;

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
    const errorMessage = err.response?.data || err.code;
    logger.error(`API REFERENTIEL fetchOrganismesContactsFromSirets something went wrong:`, errorMessage);
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
   * @returns {{data: Object|null, meta: {fromCache: boolean}}}
   */
  async (siret, options = {}) => {
    if (!siret) throw new Error("SIRET not provided");

    const skipCache = options.skipCache === true;
    const cacheKey = `${CACHE_KEY_PREFIX}:siret:${siret}`;

    // retrieve data from cache if not skipped
    if (!skipCache) {
      const fromCache = await cache.get(cacheKey);
      if (fromCache) {
        return {
          data: fromCache === CACHE_NULL_VALUE ? null : JSON.parse(fromCache),
          meta: { fromCache: true },
        };
      }
    }

    let result;

    try {
      result = await fetchOrganismeWithSiret(siret);
    } catch (err) {
      // 404 on this route means SIRET was not found
      if (err.response?.status === 404) {
        result = null;
      } else {
        const errorMessage = err.response?.data || err.code;
        logger.error(`API REFERENTIEL getOrganismeWithSiret something went wrong:`, errorMessage);
        throw new Error(`An error occured while fetching SIRET ${siret}`);
      }
    }

    // store response in cache if not skipped
    if (!skipCache) {
      const valueToCache = result === null ? CACHE_NULL_VALUE : JSON.stringify(result);
      await cache.set(cacheKey, valueToCache, { expiresIn: DEFAULT_CACHE_EXPIRES_IN });
    }

    return { data: result, meta: { fromCache: false } };
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
   * @returns {{data: {pagination: Object, organismes: [Object]}|null, meta: {fromCache: boolean}}}
   */
  async (uai, options = {}) => {
    if (!uai) throw new Error("UAI not provided");

    const skipCache = options.skipCache === true;
    const cacheKey = `${CACHE_KEY_PREFIX}:uai:${uai}`;

    if (!skipCache) {
      const fromCache = await cache.get(cacheKey);
      if (fromCache) return { data: JSON.parse(fromCache), meta: { fromCache: true } };
    }

    try {
      const response = await fetchOrganismesWithUai(uai);

      if (!skipCache) {
        await cache.set(cacheKey, JSON.stringify(response), { expiresIn: DEFAULT_CACHE_EXPIRES_IN });
      }

      return { data: response, meta: { fromCache: false } };
    } catch (err) {
      const errorMessage = err.response?.data || err.code;
      logger.error(`API REFERENTIEL getOrganismesWithUai something went wrong:`, errorMessage);
      throw new Error(`An error occured while fetching UAI ${uai}`);
    }
  };

module.exports = {
  getOrganismeWithSiret,
  getOrganismesWithUai,
  fetchOrganismeWithSiret,
  fetchOrganismesWithUai,
  fetchOrganismesContactsFromSirets,
  SLEEP_TIME_BETWEEN_API_REQUESTS,
};
