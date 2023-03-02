import ApiEntConventionCollective from "./ApiEntConventionCollective.d.ts";

type ApiEntConventionCollectiveResponse = {
  siret: string;
  conventions: Array<ApiEntConventionCollective>;
};

export default ApiEntConventionCollectiveResponse;
