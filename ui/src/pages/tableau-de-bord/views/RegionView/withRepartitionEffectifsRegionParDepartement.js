import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParDepartement } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { sortAlphabeticallyBy } from "../../../../common/utils/sortAlphabetically";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParDepartement = (Component) => {
  const WithRepartitionEffectifsTerritoireParDepartement = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region"]);
    const { data, isLoading, error } = useQuery(["effectifs-par-departement", requestFilters], () =>
      fetchEffectifsParDepartement(requestFilters)
    );

    const effectifs = sortAlphabeticallyBy("etablissement_nom_departement", data || []);

    return <Component {...props} repartitionEffectifsParDepartement={effectifs} loading={isLoading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParDepartement.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParDepartement;
};

export default withRepartitionEffectifsTerritoireParDepartement;
