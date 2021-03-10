/* eslint-disable react/display-name */
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const GEO_API_URL = "https://geo.api.gouv.fr";

export const TERRITOIRE_TYPES = {
  region: "region",
  departement: "departement",
};

const withTerritoiresData = (Component) => (props) => {
  const [departements, departementsLoading] = useFetch(`${GEO_API_URL}/departements`);
  const [regions, regionsLoading] = useFetch(`${GEO_API_URL}/regions`);

  const departementsOptions =
    departements?.map((departement) => ({
      ...departement,
      type: TERRITOIRE_TYPES.departement,
    })) || [];
  const regionsOptions = regions?.map((region) => ({ ...region, type: TERRITOIRE_TYPES.region })) || [];
  const isLoading = departementsLoading || regionsLoading;

  return <Component {...props} departements={departementsOptions} regions={regionsOptions} loading={isLoading} />;
};

export default withTerritoiresData;
