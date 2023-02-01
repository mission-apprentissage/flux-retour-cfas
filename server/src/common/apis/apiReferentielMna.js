import axios from "axios";
import logger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://referentiel.apprentissage.onisep.fr/api/v1/doc/#/

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
    logger.error("API REFERENTIEL fetchOrganismesContactsFromSirets something went wrong:", errorMessage);
    return null;
  }
};

export const fetchOrganismeWithSiret = async (siret) => {
  const url = `${API_ENDPOINT}/organismes/${siret}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    const errorMessage = err.response?.data || err.code;
    logger.error("API REFERENTIEL fetchOrganismeWithSiret something went wrong:", errorMessage);
    return null;
  }
};

export const fetchOrganismesWithUai = async (uai) => {
  const url = `${API_ENDPOINT}/organismes`;
  try {
    const { data } = await axios.get(url, { params: { uais: uai } });
    return data;
  } catch (err) {
    const errorMessage = err.response?.data || err.code;
    logger.error("API REFERENTIEL fetchOrganismesWithUai something went wrong:", errorMessage);
    return null;
  }
};

export const DEFAULT_REFERENTIEL_FIELDS_TO_FETCH = [
  "siret",
  "uai",
  "etat_administratif",
  "qualiopi",
  "raison_sociale",
  "enseigne",
  "nature",
  "qualiopi",
  "adresse",
  "numero_declaration_activite",
];
