import logger from "@/common/logger";
import config from "@/config";

import getApiClient from "./client";

// Cf Documentation : https://referentiel.apprentissage.onisep.fr/api/v1/doc/#/

const axiosClient = getApiClient({
  baseURL: config.mnaReferentielApi.endpoint,
});

const DEFAULT_REFERENTIEL_FIELDS_TO_FETCH = [
  "adresse",
  "enseigne",
  "contacts",
  "etat_administratif",
  "forme_juridique",
  "nature",
  "numero_declaration_activite",
  "qualiopi",
  "raison_sociale",
  "siret",
  "siege_social",
  "uai",
  "lieux_de_formation",
  "relations",
];

/**
 * Récupération des organismes du référentiel
 * Par défaut on récupère 10000 éléments par page et tous les champs définis dans DEFAULT_REFERENTIEL_FIELDS_TO_FETCH
 * @returns {Promise<{organismes: import("./@types/MnaOrganisme").default[]}>}
 */
export const fetchOrganismes = async () => {
  const { data } = await axiosClient.get("/organismes", {
    params: {
      items_par_page: 10000,
      champs: DEFAULT_REFERENTIEL_FIELDS_TO_FETCH.join(","),
    },
  });
  return data;
};

/**
 * Récupération des uais de la base ACCE du référentiel
 * Par défaut on récupère 50000 éléments par page
 */
export const fetchUaisAcce = async () => {
  const { data } = await axiosClient.get("/uais", {
    params: { items_par_page: 50000 },
  });
  return data;
};

/**
 * @param {*} siret
 * @returns {Promise<import("./@types/MnaOrganisme.js").default|null>}
 */
export const fetchOrganismeWithSiret = async (siret) => {
  try {
    const { data } = await axiosClient.get(`/organismes/${siret}`);

    return data;
  } catch (err: any) {
    const errorMessage = err.response?.data || err.code;
    logger.error("API REFERENTIEL fetchOrganismeWithSiret something went wrong:", errorMessage);
    return null;
  }
};

export const fetchOrganismesWithUai = async (uai) => {
  try {
    const { data } = await axiosClient.get("/organismes", { params: { uais: uai } });
    return data;
  } catch (err: any) {
    const errorMessage = err.response?.data || err.code;
    logger.error("API REFERENTIEL fetchOrganismesWithUai something went wrong:", errorMessage);
    return null;
  }
};
