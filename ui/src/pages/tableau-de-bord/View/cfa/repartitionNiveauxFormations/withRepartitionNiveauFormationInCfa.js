import React, { useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { filtersPropTypes } from "../../../FiltersContext";

const DEFAULT_PAGE_SIZE = 10;

const buildSearchParams = (filters, pageNumber) => {
  const date = filters.date.toISOString();
  const uai = filters.cfa.uai_etablissement;
  return `date=${date}&uai_etablissement=${uai}&page=${pageNumber}&limit=${DEFAULT_PAGE_SIZE}`;
};

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);

    // if filters change, set page to 1
    useEffect(() => {
      setPage(1);
    }, [JSON.stringify(filters)]);

    const searchParams = buildSearchParams(filters, page);
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(`/api/dashboard/effectifs-par-niveau-et-annee-formation?${searchParams}`);
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [searchParams]);

    return (
      <Component
        {...props}
        repartitionEffectifs={repartitionEffectifs}
        loading={loading}
        error={error}
        _setPage={setPage}
      />
    );
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
