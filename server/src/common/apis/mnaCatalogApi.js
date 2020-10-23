const logger = require("../logger");
const config = require("config");
const axios = require("axios");

class MnaCatalogApi {
  constructor(options) {
    this.endpoint = options.endpoint || config.mnaCatalog.endpoint;
    this.axios = options.axios || axios;
    this.token = options.apiToken || config.mnaCatalog.apiToken;
  }

  buildHeaders() {
    return {
      headers: {
        Authorization: this.token,
      },
    };
  }

  async getEtablissements(options) {
    let { page, allEtablissements, limit, query } = { page: 1, allEtablissements: [], limit: 1050, ...options };

    let params = { page, limit, query };
    logger.debug(`Requesting ${this.endpoint}/etablissements with parameters`, params);
    const response = await this.axios.get(`${this.endpoint}/etablissements`, { params });

    const { etablissements, pagination } = response.data;
    allEtablissements = allEtablissements.concat(etablissements); // Should be properly exploded, function should be pure

    if (page < pagination.nombre_de_page) {
      return this.getEtablissements({ page: page + 1, allEtablissements, limit });
    } else {
      return allEtablissements;
    }
  }

  async getEtablissement(idEtablissement) {
    const response = await this.axios.get(`${this.endpoint}/etablissement/${idEtablissement}`);
    return response.data;
  }

  async getEtablissementsCount() {
    const response = await this.axios.get(`${this.endpoint}/etablissements/count`);
    return response.data.count;
  }

  async getFormations(params) {
    try {
      let { page, allFormations, limit } = { page: 1, allFormations: [], limit: 10, ...params };

      const response = await this.axios.get(`${this.endpoint}/formations`, { params: { page, limit } });
      const { formations, pagination } = response.data;

      allFormations = allFormations.concat(formations); // Should be properly exploded, function should be pure

      if (page < pagination.nombre_de_page) {
        return this.getFormations(page + 1, allFormations);
      } else {
        return allFormations;
      }
    } catch (error) {
      logger.error(`MnaCatalogApi Error : ${error}`);
      return [];
    }
  }

  async addEtablissement(data) {
    try {
      const response = await this.axios.post(`${this.endpoint}/etablissement`, data, {
        ...this.buildHeaders(),
      });
      return response.data;
    } catch (error) {
      if (error.response.status === 504) {
        return "TIMEOUT";
      } else {
        logger.error(`MnaCatalogApi Error : ${error}`);
      }
      throw new Error("Something went wrong");
    }
  }

  async getFormation(idFormation) {
    try {
      const response = await this.axios.get(`${this.endpoint}/formation/${idFormation}`);
      return response.data;
    } catch (error) {
      logger.error(`MnaCatalogApi Error : ${error}`);
      return null;
    }
  }
}

module.exports = (options = {}) => new MnaCatalogApi(options);
