const logger = require("./logger");
const axios = require("axios");

class DSFetcher {
  constructor() {
    this.token = "";
    this.procedureId = -1;
  }

  config({ id, token }) {
    this.procedureId = id;
    this.token = token;
  }

  buildHeaders() {
    return {
      headers: {
        Authorization: `Bearer token=${this.token}`,
      },
    };
  }

  async getProcedure() {
    try {
      const response = await axios.get(`https://www.demarches-simplifiees.fr/api/v1/procedures/${this.procedureId}`, {
        ...this.buildHeaders(),
      });
      return response.data;
    } catch (error) {
      logger.error(error);
    }
  }

  async getDossiers(page = 1, tousLesDossiers = []) {
    try {
      const response = await axios.get(
        `https://www.demarches-simplifiees.fr/api/v1/procedures/${this.procedureId}/dossiers`,
        {
          ...this.buildHeaders(),
          params: {
            resultats_par_page: 1000,
            page,
          },
        }
      );
      const { dossiers, pagination } = response.data;
      tousLesDossiers = tousLesDossiers.concat(dossiers);

      if (page < pagination.nombre_de_page) {
        return this.getDossiers(page + 1, tousLesDossiers);
      } else {
        return tousLesDossiers;
      }
    } catch (error) {
      logger.error(error);
    }
  }

  async getDossier(dossierId) {
    try {
      const response = await axios.get(
        `https://www.demarches-simplifiees.fr/api/v1/procedures/${this.procedureId}/dossiers/${dossierId}`,
        {
          ...this.buildHeaders(),
        }
      );
      return response.data;
    } catch (error) {
      if (error.response) {
        if (error.response.status === 502) {
          logger.error(error.message);
        } else {
          logger.error(error.message);
        }
      }
      return { dossier: null };
    }
  }
}

const dsFetcher = new DSFetcher();
module.exports = dsFetcher;
