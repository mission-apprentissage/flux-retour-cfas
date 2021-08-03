import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const GEO_API_URL = "https://geo.api.gouv.fr";

const withTerritoiresData = (Component) => {
  const WithTerritoiresData = (props) => {
    const [departements, departementsLoading] = useFetch(`${GEO_API_URL}/departements`);
    const [regions, regionsLoading] = useFetch("/api/referentiel/regions");

    const regionsCodes = regions?.map((region) => region.code) || [];

    // limit to départements in available régions
    const departementsOptions = Array.isArray(departements)
      ? departements.filter((departement) => regionsCodes.indexOf(departement.codeRegion) > -1)
      : [];

    const isLoading = departementsLoading || regionsLoading;

    return <Component {...props} departements={departementsOptions} regions={regions || []} loading={isLoading} />;
  };

  return WithTerritoiresData;
};

export default withTerritoiresData;
