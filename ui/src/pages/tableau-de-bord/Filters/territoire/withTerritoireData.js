import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const GEO_API_URL = "https://geo.api.gouv.fr";

export const TERRITOIRE_TYPES = {
  region: "region",
  departement: "departement",
};

const withTerritoiresData = (Component) => {
  const WithTerritoiresData = (props) => {
    const [departements, departementsLoading] = useFetch(`${GEO_API_URL}/departements`);
    const [regions, regionsLoading] = useFetch("/api/referentiel/regions");

    const regionsOptions =
      regions?.map((region) => ({ nom: region.nom, code: region.code, type: TERRITOIRE_TYPES.region })) || [];
    const regionsCodes = regionsOptions?.map((region) => region.code) || [];

    // limit to départements in available régions
    const departementsOptions = Array.isArray(departements)
      ? departements
          .filter((departement) => regionsCodes.indexOf(departement.codeRegion) > -1)
          .map((departement) => ({
            ...departement,
            type: TERRITOIRE_TYPES.departement,
          }))
      : [];

    const isLoading = departementsLoading || regionsLoading;

    return <Component {...props} departements={departementsOptions} regions={regionsOptions} loading={isLoading} />;
  };

  return WithTerritoiresData;
};

export default withTerritoiresData;
