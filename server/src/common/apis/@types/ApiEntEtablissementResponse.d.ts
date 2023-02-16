import ApiEntEtablissement from "./ApiEntEtablissement";

type ApiEntEtablissementResponse = {
  etablissement: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEtablissementResponse;
