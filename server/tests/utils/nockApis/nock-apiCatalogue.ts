import nock from "nock";

import { API_ENDPOINT } from "../../../src/common/apis/apiCatalogueMna";

export const nockGetFormations = (callback) => {
  nock(API_ENDPOINT)
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
