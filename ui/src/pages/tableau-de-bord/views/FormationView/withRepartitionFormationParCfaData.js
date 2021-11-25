import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParCfa } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionFormationParCfa = (Component) => {
  const WithRepartitionFormationParCfa = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), [
      "date",
      "formation_cfd",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]);

    const { data, isLoading, error } = useQuery(["effectifs-par-cfa", requestFilters], () =>
      fetchEffectifsParCfa(requestFilters)
    );
    return <Component {...props} repartitionEffectifsParCfa={data} loading={isLoading} error={error} />;
  };

  WithRepartitionFormationParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionFormationParCfa;
};

export default withRepartitionFormationParCfa;
