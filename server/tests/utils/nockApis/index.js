import { nockGetMetiersByCfd, nockGetMetiersBySiret } from "./nock-Lba";
import { nockGetCfdInfo, nockGetSiretInfo } from "./nock-tablesCorrespondances";

export const nockExternalApis = () => {
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetMetiersByCfd();
  nockGetMetiersBySiret();
};
