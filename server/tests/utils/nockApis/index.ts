import { nockGetEtablissement } from "./nock-apiEntreprise";

export const nockExternalApis = () => {
  // nock API entreprise
  // aka https://entreprise.api.gouv.fr
  nockGetEtablissement();
};
