import nock from "nock";

import config from "@/config";

export const nockGetFormations = (callback?: any) => {
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
