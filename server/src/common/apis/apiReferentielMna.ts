import { IOrganismeReferentiel } from "shared/models/data/organismesReferentiel.model";

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
  const {
    data: { organismes },
  } = await axiosClient.get<{ organismes: IOrganismeReferentiel[] }>("/organismes", {
    params: {
      items_par_page: 50000,
      champs: DEFAULT_REFERENTIEL_FIELDS_TO_FETCH.join(","),
    },
  });

  // comme le référentiel n'expose pas l'UAI directement dans les relations mais seulement le SIRET,
  // on complète l'UAI des relations avec l'UAI stockées dans les organismes
  const uaiBySiret = organismes.reduce((acc, organisme) => {
    acc[organisme.siret] = organisme.uai;
    return acc;
  }, {});

  organismes.forEach((organisme) => {
    organisme?.relations?.forEach((relation) => {
      if (relation.siret) {
        relation.uai = uaiBySiret[relation.siret];
      }
    });
  });

  return organismes;
};
