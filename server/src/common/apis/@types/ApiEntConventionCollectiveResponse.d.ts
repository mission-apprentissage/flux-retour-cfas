import ApiEntConventionCollective from "./ApiEntConventionCollective.js";

type ApiEntConventionCollectiveResponse = {
  siret: string;
  conventions: Array<ApiEntConventionCollective>;
};

export default ApiEntConventionCollectiveResponse;
