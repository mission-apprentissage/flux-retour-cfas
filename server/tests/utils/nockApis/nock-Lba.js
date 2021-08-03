/* eslint-disable node/no-unpublished-require */
const nock = require("nock");
const config = require("../../../config");
const { dataForGetMetiersByCfd, dataForGetMetiersBySiret } = require("../../data/apiLba");

const API_ENDPOINT = config.lbaApi.endpoint;

const nockGetMetiersByCfd = (data = dataForGetMetiersByCfd) => {
  nock(`${API_ENDPOINT}/metiers/`)
    .persist()
    .get(/metiersParFormation.*$/)
    .reply(200, {
      metiers: data.metiers,
    });
};

const nockGetMetiersBySiret = (data = dataForGetMetiersBySiret) => {
  nock(`${API_ENDPOINT}/metiers/`)
    .persist()
    .get(/metiersParEtablissement.*$/)
    .reply(200, {
      metiers: data.metiers,
    });
};

module.exports = {
  nockGetMetiersByCfd,
  nockGetMetiersBySiret,
};
