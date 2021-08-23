import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionFormationParCfa = (Component) => {
  const WithRepartitionFormationParCfa = ({ filters, ...props }) => {
    const queryParams = qs.stringify(
      pick(mapFiltersToApiFormat(filters), [
        "date",
        "formation_cfd",
        "etablissement_num_region",
        "etablissement_num_departement",
      ])
    );

    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-cfa?${queryParams}`);

    return <Component {...props} repartitionEffectifsParCfa={data} loading={loading} error={error} />;
  };

  WithRepartitionFormationParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionFormationParCfa;
};

export default withRepartitionFormationParCfa;
