import React from "react";
import { Helmet } from "react-helmet";

import config from "../../../config";
import AnalyticsScript from "../AnalyticsScript/AnalyticsScript";

const configInfo = () => (config.env ? `- ${config.env}` : "");

const Head = () => {
  return (
    <Helmet>
      <title>Données ouvertes de l&apos;apprentissage {configInfo()}</title>
      {config.env === "production" && <AnalyticsScript />}
    </Helmet>
  );
};

export default Head;
