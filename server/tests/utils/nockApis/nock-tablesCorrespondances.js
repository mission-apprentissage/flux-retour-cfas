/* eslint-disable node/no-unpublished-require */
const nock = require("nock");
const config = require("../../../config");
const { sampleEtablissementDataFromSiret } = require("../../data/sample");

module.exports = async () => {
  nock(config.tablesCorrespondances.endpoint).persist().post("/siret").reply(200, {
    result: sampleEtablissementDataFromSiret,
  });
};
