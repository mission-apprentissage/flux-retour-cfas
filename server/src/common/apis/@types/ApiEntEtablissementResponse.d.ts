import ApiEntEtablissement from "./ApiEntEtablissement.js";

type ApiEntEtablissementResponse = {
  etablissement: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEtablissementResponse;
