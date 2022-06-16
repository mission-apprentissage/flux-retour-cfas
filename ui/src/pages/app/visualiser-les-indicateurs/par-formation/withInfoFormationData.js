import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { fetchFormation } from "../../../../common/api/tableauDeBord";
import { QUERY_KEY } from "../../../../common/constants/queryKey";

const withInfosFormationData = (Component) => {
  const WithInfosFormationData = ({ formationCfd, ...props }) => {
    const { data, isLoading, error } = useQuery([QUERY_KEY.formation, formationCfd], () =>
      fetchFormation(formationCfd)
    );

    return <Component {...props} infosFormation={data} loading={isLoading} error={error} />;
  };

  WithInfosFormationData.propTypes = {
    formationCfd: PropTypes.string.isRequired,
  };

  return WithInfosFormationData;
};

export default withInfosFormationData;
