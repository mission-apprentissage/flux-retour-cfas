import ApiEntEntreprise from "./ApiEntEntreprise.js";
import ApiEntEtablissement from "./ApiEntEtablissement.js";

type ApiEntEntrepriseResponse = {
  entreprise: ApiEntEntreprise;
  etablissement_siege: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEntrepriseResponse;
