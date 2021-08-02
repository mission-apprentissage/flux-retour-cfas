import queryString from "query-string";
import React, { useEffect, useState } from "react";

import { _get } from "../../../../../common/httpClient";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

const buildSearchParams = (filters) => {
  const date = filters.date.toISOString();
  return queryString.stringify(
    omitNullishValues({
      date,
      uai_etablissement: filters.cfa.uai_etablissement,
      siret_etablissement: filters.sousEtablissement?.siret_etablissement,
    })
  );
};

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchParams = buildSearchParams(filters);
    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
          const response = await _get(`/api/dashboard/effectifs-par-niveau-formation?${searchParams}`);
          setRepartitionEffectifs(response);
        } catch (error) {
          setError(error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [searchParams]);

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
