const { nockGetMetiersByCfd, nockGetMetiersBySiret } = require("./nock-Lba");
const { nockGetCfdInfo, nockGetSiretInfo } = require("./nock-tablesCorrespondances");

const nockExternalApis = () => {
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetMetiersByCfd();
  nockGetMetiersBySiret();
};

module.exports = {
  nockExternalApis,
};
