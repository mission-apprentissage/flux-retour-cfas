import nock from "nock";

import config from "../../../src/config.js";
import { dataForGetMetiersByCfd, dataForGetMetiersBySiret } from "../../data/apiLba.js";

const API_ENDPOINT = config.lbaApi.endpoint;

export const nockGetMetiersByCfd = (data = dataForGetMetiersByCfd) => {
  nock(`${API_ENDPOINT}/metiers/`)
    .persist()
    .get(/metiersParFormation.*$/)
    .reply(200, {
      metiers: data.metiers,
    });
};

export const nockGetMetiersBySiret = (data = dataForGetMetiersBySiret) => {
  nock(`${API_ENDPOINT}/metiers/`)
    .persist()
    .get(/metiersParEtablissement.*$/)
    .reply(200, {
      metiers: data.metiers,
    });
};
