import React from "react";
import { Helmet } from "react-helmet";

import config from "../../../config";
import AnalyticsScript from "../Scripts/AnalyticsScript";
import CrispScript from "../Scripts/CrispScript";

const configInfo = () => (config.env ? `- ${config.env}` : "");

const isEnvProduction = () => config.env === "production";
const isCrispDefined = () => config.crispWebsiteId != null;

const Head = () => {
  return (
    <Helmet>
      <title>Données ouvertes de l&apos;apprentissage {configInfo()}</title>
      {isEnvProduction() && <AnalyticsScript />}
      {isEnvProduction() && isCrispDefined() && <CrispScript />}
    </Helmet>
  );
};

export default Head;
