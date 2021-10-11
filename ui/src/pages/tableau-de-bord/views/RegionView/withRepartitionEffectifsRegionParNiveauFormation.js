import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsRegionParNiveauFormation = (Component) => {
  const WithRepartitionEffectifsRegionParNiveauFormation = ({ filters, ...props }) => {
    const queryParams = qs.stringify(pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region"]));
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-niveau-formation?${queryParams}`);

    const repartitionEffectifs = data?.map((repartition) => {
      return {
        niveauFormation: repartition.niveau_formation,
        niveauFormationLibelle: repartition.niveau_formation_libelle,
        effectifs: repartition.effectifs,
      };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsRegionParNiveauFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsRegionParNiveauFormation;
};

export default withRepartitionEffectifsRegionParNiveauFormation;
