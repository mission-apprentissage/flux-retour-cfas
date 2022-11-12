/* eslint-disable node/no-unpublished-require */
import nock from "nock";

import config from "../../../config";
import { dataForGetCfdInfo, dataForGetSiretInfo } from "../../data/apiTablesDeCorrespondances";

export const nockGetCfdInfo = (data = dataForGetCfdInfo.withIntituleLong) => {
  nock(config.tablesCorrespondances.endpoint).persist().post("/cfd").reply(200, {
    result: data,
  });
};

export const nockGetSiretInfo = (data = dataForGetSiretInfo) => {
  nock(config.tablesCorrespondances.endpoint).persist().post("/siret").reply(200, {
    result: data,
  });
};
