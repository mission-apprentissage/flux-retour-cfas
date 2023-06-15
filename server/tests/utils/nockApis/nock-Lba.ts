import nock from "nock";

import config from "@/config";
import { dataForGetMetiersBySiret } from "@tests/data/apiLba";

export const nockGetMetiersBySiret = (data = dataForGetMetiersBySiret) => {
  nock(`${config.lbaApi.endpoint}/v1/metiers/`)
    .persist()
    .get(/metiersParEtablissement.*$/)
    .reply(200, {
      metiers: data.metiers,
    });
};
