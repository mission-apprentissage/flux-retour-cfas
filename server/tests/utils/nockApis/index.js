const { nockGetMetiersByCfd, nockGetMetiersBySiret } = require("./nock-Lba");
const { nockGetCfdInfo, nockGetSiretInfo } = require("./nock-tablesCorrespondances");
const { nockFetchOrganismesWithUai } = require("./nock-Referentiel.js");

const nockExternalApis = () => {
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetMetiersByCfd();
  nockGetMetiersBySiret();
  nockFetchOrganismesWithUai();
};

module.exports = {
  nockExternalApis,
};
