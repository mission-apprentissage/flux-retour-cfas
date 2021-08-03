import React from "react";

import { usePostFetch } from "../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionEffectifsTerritoireParDepartement = (Component) => {
  const WithRepartitionEffectifsTerritoireParDepartement = ({ filters, ...props }) => {
    const requestBody = omitNullishValues({
      date: filters.date,
      etablissement_num_region: filters.region.code,
    });

    const [data, loading, error] = usePostFetch(`/api/dashboard/effectifs-par-departement`, requestBody);

    return <Component {...props} repartitionEffectifsParDepartement={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsTerritoireParDepartement.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsTerritoireParDepartement;
};

export default withRepartitionEffectifsTerritoireParDepartement;
