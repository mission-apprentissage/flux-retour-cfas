import { nockGetMetiersByCfd, nockGetMetiersBySiret } from "./nock-Lba.js";
import { nockGetCfdInfo, nockGetSiretInfo } from "./nock-tablesCorrespondances.js";

export const nockExternalApis = () => {
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetMetiersByCfd();
  nockGetMetiersBySiret();
};
