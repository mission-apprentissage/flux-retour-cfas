import React from "react";
import { Helmet } from "react-helmet";

import config from "../../../config";
import CrispScript from "../Scripts/CrispScript";

const configInfo = () => (config.env ? `- ${config.env}` : "");
const isEnvProduction = () => config.env === "production";
const isCrispDefined = () => config.crispWebsiteId != null;
const plausibleScript = () => (
  <script
    defer
    data-domain="cfas.apprentissage.beta.gouv.fr/tableau-de-bord"
    src="https://plausible.io/js/plausible.js"
  ></script>
);

const Head = () => (
  <Helmet>
    <title>Données ouvertes de l&apos;apprentissage {configInfo()}</title>
    {isEnvProduction() && plausibleScript()}
    {isEnvProduction() && isCrispDefined() && <CrispScript />}
  </Helmet>
);

export default Head;
