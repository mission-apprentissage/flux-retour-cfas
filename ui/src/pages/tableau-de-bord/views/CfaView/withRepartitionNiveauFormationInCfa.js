import queryString from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

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
    const searchParams = buildSearchParams(filters);
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-niveau-formation?${searchParams}`);

    const repartitionEffectifs = data?.map(({ niveau_formation, effectifs }) => {
      return { niveauFormation: niveau_formation, effectifs };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionNiveauFormationInCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionNiveauFormationInCfa;
};

export default withRepartitionNiveauFormationInCfa;
