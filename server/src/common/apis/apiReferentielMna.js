import axios from "axios";
import logger from "../logger";
import config from "../../../config";

// Cf Documentation : https://referentiel.apprentissage.beta.gouv.fr/api/v1/doc/#/

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

export const fetchOrganismes = async (options = {}) => {
  const { itemsPerPage = 100, champs } = options;

  const { data } = await axios({
    method: "GET",
    baseURL: API_ENDPOINT,
    url: "/organismes",
    params: {
      items_par_page: itemsPerPage,
      champs,
    },
  });
  return data;
};

export const fetchOrganismesContactsFromSirets = async (sirets, itemsPerPage = "10", champs = "contacts,uai,siret") => {
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

export const fetchOrganismeWithSiret = async (siret) => {
  const url = `${API_ENDPOINT}/organismes/${siret}`;
  const { data } = await axios.get(url);
  return data;
};

export const fetchOrganismesWithUai = async (uai) => {
  const url = `${API_ENDPOINT}/organismes`;
  const { data } = await axios.get(url, { params: { uais: uai } });
  return data;
};
