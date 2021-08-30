import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionNiveauFormationInCfa = (Component) => {
  const WithRepartitionNiveauFormationInCfa = ({ filters, ...props }) => {
    const queryParams = qs.stringify({
      ...pick(mapFiltersToApiFormat(filters), ["date", "uai_etablissement", "siret_etablissement"]),
    });
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-niveau-formation?${queryParams}`);

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
