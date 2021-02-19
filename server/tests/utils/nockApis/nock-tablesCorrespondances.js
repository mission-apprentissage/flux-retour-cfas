/* eslint-disable node/no-unpublished-require */
const nock = require("nock");
const config = require("../../../config");
const { dataForGetCfdInfo, dataForGetSiretInfo } = require("../../data/apiTablesDeCorrespondances");

module.exports = () => {
  nock(config.tablesCorrespondances.endpoint)
    .post("/siret")
    .reply(200, {
      result: dataForGetSiretInfo,
    })
    .post("/cfd")
    .reply(200, {
      result: dataForGetCfdInfo.withIntituleLong,
    });
};
