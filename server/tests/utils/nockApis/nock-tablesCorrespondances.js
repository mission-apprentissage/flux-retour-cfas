/* eslint-disable node/no-unpublished-require */
const nock = require("nock");
const config = require("../../../config");
const { dataForGetCfdInfo, dataForGetSiretInfo } = require("../../data/apiTablesDeCorrespondances");

const nockGetCfdInfo = (data = dataForGetCfdInfo.withIntituleLong) => {
  nock(config.tablesCorrespondances.endpoint).persist().post("/cfd").reply(200, {
    result: data,
  });
};

const nockGetSiretInfo = (data = dataForGetSiretInfo) => {
  nock(config.tablesCorrespondances.endpoint).persist().post("/siret").reply(200, {
    result: data,
  });
};

module.exports = {
  nockGetCfdInfo,
  nockGetSiretInfo,
};
