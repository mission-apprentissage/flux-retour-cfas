import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParDepartement = (Component) => {
  const WithRepartitionEffectifsTerritoireParDepartement = ({ filters, ...props }) => {
    const queryParams = qs.stringify(pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region"]));
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-departement?${queryParams}`);

    return <Component {...props} repartitionEffectifsParDepartement={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParDepartement.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParDepartement;
};

export default withRepartitionEffectifsTerritoireParDepartement;
