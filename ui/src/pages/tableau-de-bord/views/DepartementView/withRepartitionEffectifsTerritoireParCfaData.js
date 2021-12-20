import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParCfa } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { sortAlphabeticallyBy } from "../../../../common/utils/sortAlphabetically";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParCfa = (Component) => {
  const WithRepartitionEffectifsTerritoireParCfa = ({ filters, ...props }) => {
    const fetchFilters = pick(mapFiltersToApiFormat(filters), [
      "date",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]);

    const { data, isLoading, error } = useQuery(["effectifs-par-cfa", fetchFilters], () =>
      fetchEffectifsParCfa(fetchFilters)
    );

    const effectifs = sortAlphabeticallyBy("nom_etablissement", data || []);

    return <Component {...props} repartitionEffectifsParCfa={effectifs} loading={isLoading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParCfa;
};

export default withRepartitionEffectifsTerritoireParCfa;
