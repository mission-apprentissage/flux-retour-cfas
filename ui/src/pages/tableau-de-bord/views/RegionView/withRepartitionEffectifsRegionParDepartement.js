import React from "react";
import { useQuery } from "react-query";
import { fetchEffectifsParDepartement } from "../../../../common/api/tableauDeBord";

import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParDepartement = (Component) => {
  const WithRepartitionEffectifsTerritoireParDepartement = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region"]);
    const { data } = useQuery(["effectifs-par-departement", requestFilters], () =>
      fetchEffectifsParDepartement(requestFilters)
    );

    return <Component {...props} repartitionEffectifsParDepartement={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParDepartement.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParDepartement;
};

export default withRepartitionEffectifsTerritoireParDepartement;
