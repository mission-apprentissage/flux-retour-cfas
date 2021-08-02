import React, { useCallback, useEffect, useState } from "react";

import { DEFAULT_REGION } from "../../../common/constants/defaultRegion";
import { _get } from "../../../common/httpClient";

const withCfasReferentielData = (Component) => {
  const WithCfasReferentielData = (props) => {
    const [data, setData] = useState(null);
    const [regionsData, setRegionsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [regionCode, setRegionCode] = useState(DEFAULT_REGION.code);
    const [withDataConnection, setWithDataConnection] = useState(-1);

    /** Callback for get paginated filtered cfas list */
    const _fetch = useCallback(async (pageNumber = 1, codeRegion = regionCode, withConnection = withDataConnection) => {
      setLoading(true);
      setError(null);

      // Handle filters queries
      let filterQuery = { region_num: codeRegion };

      if (withConnection != -1) {
        filterQuery = { ...filterQuery, branchement_flux_cfa_erp: withConnection };
      }

      const searchParams = `query=${JSON.stringify(filterQuery)}&page=${pageNumber}&limit=${10}`;

      try {
        const response = await _get(`/api/cfas?${searchParams}`);
        setData(response);
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    }, []);

    /** UseEffect hook for cfas api call */
    useEffect(() => {
      _fetch();
    }, [_fetch]);

    /** fetch available regions */
    useEffect(() => {
      const fetchRegionsCfas = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await _get("/api/referentiel/regions");
          setRegionsData(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };
      fetchRegionsCfas();
    }, []);

    /** Update region filter */
    const onRegionChange = async (region) => {
      await setRegionCode(region);
      await _fetch(data.pagination.page, region, withDataConnection);
    };

    /** Update connection filter */
    const onConnectionChange = async (withDataConnection) => {
      await setWithDataConnection(withDataConnection);
      await _fetch(data.pagination.page, regionCode, withDataConnection);
    };

    return (
      <Component
        {...props}
        data={data}
        regionsData={regionsData}
        loading={loading}
        error={error}
        _fetch={_fetch}
        onConnectionChange={onConnectionChange}
        onRegionChange={onRegionChange}
        defaultSelectedRegionCode={DEFAULT_REGION.code}
      />
    );
  };
  return WithCfasReferentielData;
};

export default withCfasReferentielData;
