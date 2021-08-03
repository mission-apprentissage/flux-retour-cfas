import React from "react";

import { usePostFetch } from "../../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../../FiltersContext";

const withRepartitionEffectifsReseauParCfa = (Component) => {
  const WithRepartitionEffectifsReseauParCfa = ({ filters, ...props }) => {
    const requestBody = omitNullishValues({
      etablissement_reseaux: filters.reseau.nom,
      date: filters.date,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
    });

    const [data, loading, error] = usePostFetch(`/api/dashboard/effectifs-par-cfa`, requestBody);

    return <Component {...props} repartitionEffectifsParCfa={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsReseauParCfa.propTypes = {
    filters: filtersPropTypes.state,
  };

  return WithRepartitionEffectifsReseauParCfa;
};

export default withRepartitionEffectifsReseauParCfa;
