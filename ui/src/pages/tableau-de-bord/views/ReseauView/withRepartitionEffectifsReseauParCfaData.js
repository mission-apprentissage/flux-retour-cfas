import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParCfa } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsReseauParCfa = (Component) => {
  const WithRepartitionEffectifsReseauParCfa = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), [
      "etablissement_reseaux",
      "date",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]);

    const { data, isLoading, error } = useQuery(["effectifs-par-cfa", requestFilters], () =>
      fetchEffectifsParCfa(requestFilters)
    );

    return <Component {...props} repartitionEffectifsParCfa={data} loading={isLoading} error={error} />;
  };

  WithRepartitionEffectifsReseauParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParCfa;
};

export default withRepartitionEffectifsReseauParCfa;
