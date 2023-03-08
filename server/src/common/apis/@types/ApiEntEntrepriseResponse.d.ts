import ApiEntEntreprise from "./ApiEntEntreprise";
import ApiEntEtablissement from "./ApiEntEtablissement";

type ApiEntEntrepriseResponse = {
  entreprise: ApiEntEntreprise;
  etablissement_siege: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEntrepriseResponse;
