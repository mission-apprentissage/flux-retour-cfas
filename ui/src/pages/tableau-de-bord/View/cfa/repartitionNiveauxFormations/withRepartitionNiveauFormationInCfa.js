import { subYears } from "date-fns";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../../common/httpClient";
import { filtersPropType } from "../../../propTypes";

const buildSearchRequestBody = (filters) => {
  const flattenedFilters = {
    startDate: subYears(filters.date, 1).toISOString(),
    endDate: filters.date.toISOString(),
    siret: filters.cfa?.type === "cfa" ? filters.cfa?.siret_etablissement : null,
  };
  return flattenedFilters;
};

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const [repartitionEffectifs, setRepartitionEffectifs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchRequestBody = buildSearchRequestBody(filters);

    useEffect(() => {
      const fetchRepartitionEffectifCfa = async () => {
        setLoading(true);
        try {
          const response = await _post("/api/dashboard/cfa-effectifs-detail/", searchRequestBody);
          setRepartitionEffectifs(response);
          setError(null);
        } catch (err) {
          setError(err);
          setRepartitionEffectifs(null);
        } finally {
          setLoading(false);
        }
      };

      fetchRepartitionEffectifCfa();
    }, [JSON.stringify(searchRequestBody)]);

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropType,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
