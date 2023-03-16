import { nockGetMetiersByCfd, nockGetMetiersBySiret } from "./nock-Lba.js";
import { nockGetCfdInfo, nockGetSiretInfo } from "./nock-tablesCorrespondances.js";
import { nockGetEntreprise, nockGetEtablissement } from "../../utils/nockApis/nock-apiEntreprise.js";
import { nockGetFormations } from "../../utils/nockApis/nock-apiCatalogue.js";
import { nockGetCodePostalInfo } from "../../utils/nockApis/nock-tablesCorrespondances.js";

export const nockExternalApis = () => {
  // nok API tablesCorrespondances
  // aka https://tables-correspondances.apprentissage.beta.gouv.fr/api
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetCodePostalInfo();

  // nok LBA
  // aka http://labonnealternance.apprentissage.beta.gouv.fr/api
  nockGetMetiersByCfd();
  nockGetMetiersBySiret();

  // nock API entreprise
  // aka https://entreprise.api.gouv.fr/v2
  nockGetEtablissement();
  nockGetEntreprise();

  // nok API catalogue
  // aka https://catalogue.apprentissage.beta.gouv.fr/api
  nockGetFormations();
};
