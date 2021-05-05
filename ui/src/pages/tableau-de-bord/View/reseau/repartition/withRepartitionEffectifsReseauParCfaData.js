import PropTypes from "prop-types";
import React from "react";

import { usePostFetch } from "../../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../../common/utils/omitNullishValues";
import { TERRITOIRE_TYPES } from "../../../Filters/territoire/withTerritoireData";
import { filtersPropType } from "../../../propTypes";

const withRepartitionEffectifsReseauParCfa = (Component) => {
  const WithRepartitionEffectifsReseauParCfa = ({ reseau, filters, ...props }) => {
    const requestBody = omitNullishValues({
      etablissement_reseaux: reseau,
      date: filters.date,
      etablissement_num_region: filters.territoire?.type === TERRITOIRE_TYPES.region ? filters.territoire.code : null,
      etablissement_num_departement:
        filters.territoire?.type === TERRITOIRE_TYPES.departement ? filters.territoire.code : null,
    });

    const [data, loading, error] = usePostFetch(`/api/dashboard/effectifs-par-cfa`, requestBody);

    return <Component {...props} repartitionEffectifsParCfa={data} loading={loading} error={error} />;
  };

  WithRepartitionEffectifsReseauParCfa.propTypes = {
    reseau: PropTypes.string.isRequired,
    filters: filtersPropType.isRequired,
  };

  return WithRepartitionEffectifsReseauParCfa;
};

export default withRepartitionEffectifsReseauParCfa;
