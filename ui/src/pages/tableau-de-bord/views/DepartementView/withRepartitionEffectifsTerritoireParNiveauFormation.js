import qs from "query-string";
import React from "react";
import { useQuery } from "react-query";

import { fetchEffectifsParNiveauFormation } from "../../../../common/api/tableauDeBord";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParNiveauFormation = (Component) => {
  const WithRepartitionEffectifsTerritoireParNiveauFormation = ({ filters, ...props }) => {
    const requestFilters = pick(mapFiltersToApiFormat(filters), [
      "date",
      "etablissement_num_region",
      "etablissement_num_departement",
    ]);
    const { data, isLoading, error } = useQuery(["effectifs-par-niveau-formation", requestFilters], () =>
      fetchEffectifsParNiveauFormation(requestFilters)
    );
    const repartitionEffectifs = data?.map((repartition) => {
      return { niveauFormation: repartition.niveau_formation, effectifs: repartition.effectifs };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={isLoading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParNiveauFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParNiveauFormation;
};

export default withRepartitionEffectifsTerritoireParNiveauFormation;
