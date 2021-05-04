import { subYears } from "date-fns";
import React, { useCallback, useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { filtersPropType } from "../../../propTypes";

const DEFAULT_PAGE_SIZE = 10;

const buildSearchParams = (filters, pageNumber, limit) => {
  const startDate = subYears(filters.date, 1).toISOString();
  const endDate = filters.date.toISOString();
  const siret = filters.cfa?.type === "cfa" ? filters.cfa?.siret_etablissement : null;
  return `startDate=${startDate}&endDate=${endDate}&siret=${siret}&page=${pageNumber}&limit=${limit}`;
};

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);

    const _setPage = useCallback(async (pageNumber) => {
      console.log(pageNumber);
      setPage(pageNumber);
    });

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(
            `/api/dashboard/cfa-effectifs-detail?${buildSearchParams(filters, page, DEFAULT_PAGE_SIZE)}`
          );
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [buildSearchParams(filters, page, 10)]);

    return (
      <Component
        {...props}
        repartitionEffectifs={repartitionEffectifs}
        loading={loading}
        error={error}
        _setPage={_setPage}
      />
    );
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropType,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
