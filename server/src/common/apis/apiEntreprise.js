const logger = require("../../common/logger");
const { toDateFromUnixTimestamp } = require("../../common/utils/miscUtils");
const axios = require("axios");
const config = require("config");

// Cf Documentation : https://doc.entreprise.api.gouv.fr/#param-tres-obligatoires
const apiEndpoint = "https://entreprise.api.gouv.fr/v2";
const apiParams = {
  token: config.apiEntreprise.apiKey,
  context: "Catalogue MNA",
  recipient: "12000101100010", // Siret Dinum
  object: "Consolidation des données du Catalogue MNA",
};

class ApiEntreprise {
  constructor() {}

  async getEntrepriseInfoFromSiren(siren, convertTimestamp = false) {
    try {
      const response = await axios.get(`${apiEndpoint}/entreprises/${siren}`, { params: apiParams });
      if (convertTimestamp === true) {
        const data = getConvertedResponseDatesFromTimestamps(response.data);
        return data;
      }
      return response.data;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }

  async getEntrepriseInfoFromSiret(siret) {
    try {
      const response = await axios.get(`${apiEndpoint}/etablissements/${siret}`, { params: apiParams });
      return response.data;
    } catch (error) {
      logger.error(error);
      return null;
    }
  }
}

const getConvertedResponseDatesFromTimestamps = (data) => ({
  ...data,
  entreprise: {
    ...data.entreprise,
    date_creation: toDateFromUnixTimestamp(data.entreprise.date_creation),
    date_radiation: toDateFromUnixTimestamp(data.entreprise.date_radiation),
  },
  etablissement_siege: {
    ...data.etablissement_siege,
    date_mise_a_jour: toDateFromUnixTimestamp(data.etablissement_siege.date_mise_a_jour),
    date_creation_etablissement: toDateFromUnixTimestamp(data.etablissement_siege.date_creation_etablissement),
    etat_administratif: {
      ...data.etablissement_siege.etat_administratif,
      date_fermeture: toDateFromUnixTimestamp(data.etablissement_siege.etat_administratif.date_fermeture),
    },
  },
});

const apiEntreprise = new ApiEntreprise();
module.exports = apiEntreprise;
