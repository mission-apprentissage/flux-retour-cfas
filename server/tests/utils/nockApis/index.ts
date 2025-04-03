import { nockGetEtablissement } from "./nock-apiEntreprise";
import { nockBrevo } from "./nock-brevo";

export const nockExternalApis = () => {
  // nock API entreprise
  // aka https://entreprise.api.gouv.fr
  nockGetEtablissement();
  nockBrevo();
};
