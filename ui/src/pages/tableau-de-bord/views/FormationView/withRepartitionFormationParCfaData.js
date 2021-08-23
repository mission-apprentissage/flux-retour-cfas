import PropTypes from "prop-types";
import React from "react";

import { usePostFetch } from "../../../../common/hooks/useFetch";
import { omitNullishValues } from "../../../../common/utils/omitNullishValues";
import { filtersPropTypes } from "../../FiltersContext";

const withRepartitionFormationParCfa = (Component) => {
  const WithRepartitionFormationParCfa = ({ formationCfd, filters, ...props }) => {
    const requestBody = omitNullishValues({
      formation_cfd: formationCfd,
      date: filters.date,
      etablissement_num_region: filters.region?.code ?? null,
      etablissement_num_departement: filters.departement?.code ?? null,
    });

    const [data, loading, error] = usePostFetch(`/api/dashboard/effectifs-par-cfa`, requestBody);

    return <Component {...props} repartitionEffectifsParCfa={data} loading={loading} error={error} />;
  };

  WithRepartitionFormationParCfa.propTypes = {
    formationCfd: PropTypes.string.isRequired,
    filters: filtersPropTypes.state,
  };

  return WithRepartitionFormationParCfa;
};

export default withRepartitionFormationParCfa;
