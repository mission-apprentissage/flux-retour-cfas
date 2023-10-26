import { nockGetEtablissement } from "./nock-apiEntreprise";
import { nockGetCfdInfo, nockGetCodePostalInfo, nockGetSiretInfo } from "./nock-tablesCorrespondances";

export const nockExternalApis = () => {
  // nok API tablesCorrespondances
  // aka https://tables-correspondances.apprentissage.beta.gouv.fr/api
  nockGetCfdInfo();
  nockGetSiretInfo();
  nockGetCodePostalInfo();

  // nock API entreprise
  // aka https://entreprise.api.gouv.fr
  nockGetEtablissement();

  // nok API catalogue
  // aka https://catalogue.apprentissage.beta.gouv.fr/api
  // pas assez précis, c'est mieux de mocker précisément dans chaque test.
  // nockGetFormations();
};
