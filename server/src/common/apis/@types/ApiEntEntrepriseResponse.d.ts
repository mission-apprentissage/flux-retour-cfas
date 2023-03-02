import ApiEntEntreprise from "./ApiEntEntreprise.d.ts";
import ApiEntEtablissement from "./ApiEntEtablissement.d.ts";

type ApiEntEntrepriseResponse = {
  entreprise: ApiEntEntreprise;
  etablissement_siege: ApiEntEtablissement;
  gateway_error: boolean;
};

export default ApiEntEntrepriseResponse;
