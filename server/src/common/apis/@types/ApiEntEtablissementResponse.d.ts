import ApiEntEtablissement from "./ApiEntEtablissement.d.ts";

type ApiEntEtablissementResponse = {
  etablissement: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEtablissementResponse;
