import React, { useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { filtersPropType } from "../../../propTypes";

const DEFAULT_PAGE_SIZE = 10;

const buildSearchParams = (filters, pageNumber) => {
  const date = filters.date.toISOString();
  const siret = filters.cfa?.type === "cfa" ? filters.cfa?.siret_etablissement : null;
  return `date=${date}&siret_etablissement=${siret}&page=${pageNumber}&limit=${DEFAULT_PAGE_SIZE}`;
};

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(
            `/api/dashboard/effectifs-par-niveau-et-annee-formation?${buildSearchParams(filters, page)}`
          );
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [buildSearchParams(filters, page)]);

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
    filters: filtersPropType,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
