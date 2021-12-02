import React from "react";
import { useQuery } from "react-query";

import { fetchDepartements } from "../../../../../common/api/geoData";
import { fetchRegions } from "../../../../../common/api/tableauDeBord";

const withTerritoiresData = (Component) => {
  const WithTerritoiresData = (props) => {
    // departements and regions are very unlikely to change, thus the infinite stale time
    const { data: departements, isLoading: departementsLoading } = useQuery("departement", () => fetchDepartements(), {
      staleTime: Infinity,
    });
    const { data: regions, isLoading: regionsLoading } = useQuery("regions", () => fetchRegions(), {
      staleTime: Infinity,
    });

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
