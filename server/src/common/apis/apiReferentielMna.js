import axios from "axios";
import logger from "../logger.js";
import config from "../../config.js";

// Cf Documentation : https://referentiel.apprentissage.onisep.fr/api/v1/doc/#/

const API_ENDPOINT = config.mnaReferentielApi.endpoint;

export const fetchOrganismes = async (options = {}) => {
  const { itemsPerPage = 10000, champs = DEFAULT_REFERENTIEL_FIELDS_TO_FETCH.join(",") } = options;

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
  "adresse",
  "enseigne",
  "etat_administratif",
  "nature",
  "numero_declaration_activite",
  "qualiopi",
  "raison_sociale",
  "siret",
  "uai",
];
