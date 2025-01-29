import { IOrganismeReferentiel, zOrganismeReferentiel } from "shared/models/data/organismesReferentiel.model";

import config from "@/config";

import getApiClient from "./client";

// Cf Documentation : https://referentiel.apprentissage.onisep.fr/api/v1/doc/#/

const axiosClient = getApiClient({
  baseURL: config.mnaReferentielApi.endpoint,
});

const DEFAULT_REFERENTIEL_FIELDS_TO_FETCH = Object.keys(zOrganismeReferentiel.shape);

export const fetchOrganismeReferentielBySiret = async (siret: string): Promise<IOrganismeReferentiel | null> => {
  return axiosClient
    .get<unknown>(`/organismes/${siret}`, {
      params: {
        champs: DEFAULT_REFERENTIEL_FIELDS_TO_FETCH.join(","),
      },
    })
    .then((d) => zOrganismeReferentiel.parse(d.data))
    .catch((error) => {
      // Return null if the organism is not found
      if (error.response?.status === 404) {
        return null;
      }

      throw error;
    });
};
