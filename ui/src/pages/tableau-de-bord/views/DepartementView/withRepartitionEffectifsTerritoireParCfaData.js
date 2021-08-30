import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParCfa = (Component) => {
  const WithRepartitionEffectifsTerritoireParCfa = ({ filters, ...props }) => {
    const queryParams = qs.stringify(
      pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region", "etablissement_num_departement"])
    );

    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-cfa?${queryParams}`);

    return <Component {...props} repartitionEffectifsParCfa={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParCfa;
};

export default withRepartitionEffectifsTerritoireParCfa;
