import ApiEntConventionCollective from "./ApiEntConventionCollective";

type ApiEntConventionCollectiveResponse = {
  siret: string;
  conventions: Array<ApiEntConventionCollective>;
};

export default ApiEntConventionCollectiveResponse;
