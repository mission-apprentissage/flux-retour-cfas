import nock from "nock";

import config from "../../../src/config.js";

export const nockGetFormations = (callback) => {
  nock(config.mnaCatalogApi.endpoint)
    .persist()
    .get(new RegExp("\\/entity\\/formations.*"))
    .reply(200, () => {
      return callback
        ? callback()
        : {
            formations: [],
            pagination: { page: 1, nombre_par_page: 1000 },
          };
    });
};
