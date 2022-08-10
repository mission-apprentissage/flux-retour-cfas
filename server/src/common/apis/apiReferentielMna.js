const axios = require("axios");
const logger = require("../logger");
const config = require("../../../config");

// Cf Documentation : https://referentiel.apprentissage.beta.gouv.fr/api/v1/doc/#/

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

const getOrganismesContactsFromSirets = async (sirets, itemsPerPage = "10", champs = "contacts,uai,siret") => {
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

const getOrganismeWithSiret = async (siret) => {
  const url = `${API_ENDPOINT}/organismes/${siret}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    logger.error(`API REFERENTIEL getOrganisme: something went wrong while requesting ${url}`, err.response.data);
    return null;
  }
};

const getOrganismesWithUai = async (uai) => {
  const url = `${API_ENDPOINT}/organismes`;
  try {
    const { data } = await axios.get(url, { params: { uais: uai } });
    return data;
  } catch (err) {
    logger.error(
      `API REFERENTIEL getOrganismesWithUai: something went wrong while requesting ${url}`,
      err.response.data
    );
    return null;
  }
};

module.exports = {
  getOrganismeWithSiret,
  getOrganismesWithUai,
  getOrganismesContactsFromSirets,
};
