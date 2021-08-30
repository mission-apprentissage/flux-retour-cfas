import qs from "query-string";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";
import { mapFiltersToApiFormat } from "../../../../common/utils/mapFiltersToApiFormat";
import { pick } from "../../../../common/utils/pick";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParNiveauFormation = (Component) => {
  const WithRepartitionEffectifsTerritoireParNiveauFormation = ({ filters, ...props }) => {
    const queryParams = qs.stringify(
      pick(mapFiltersToApiFormat(filters), ["date", "etablissement_num_region", "etablissement_num_departement"])
    );
    const [data, loading, error] = useFetch(`/api/dashboard/effectifs-par-niveau-formation?${queryParams}`);

    const repartitionEffectifs = data?.map((repartition) => {
      return { niveauFormation: repartition.niveau_formation, effectifs: repartition.effectifs };
    });

    return <Component {...props} repartitionEffectifs={repartitionEffectifs} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParNiveauFormation.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParNiveauFormation;
};

export default withRepartitionEffectifsTerritoireParNiveauFormation;
