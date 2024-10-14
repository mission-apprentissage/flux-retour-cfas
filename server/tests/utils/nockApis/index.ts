import { nockGetEtablissement } from "./nock-apiEntreprise";
import { nockGetCodePostalInfo, nockGetSiretInfo } from "./nock-tablesCorrespondances";

export const nockExternalApis = () => {
  // nok API tablesCorrespondances
  // aka https://tables-correspondances.apprentissage.beta.gouv.fr/api
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
