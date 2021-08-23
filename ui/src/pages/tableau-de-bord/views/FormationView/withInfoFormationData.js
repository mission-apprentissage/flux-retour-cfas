import PropTypes from "prop-types";
import React from "react";

import { useFetch } from "../../../../common/hooks/useFetch";

const withInfosFormationData = (Component) => {
  const WithInfosFormationData = ({ formationCfd, ...props }) => {
    const [data, loading, error] = useFetch(`/api/formations/${formationCfd}`);

    return <Component {...props} infosFormation={data} loading={loading} error={error} />;
  };

  WithInfosFormationData.propTypes = {
    formationCfd: PropTypes.string.isRequired,
  };

  return WithInfosFormationData;
};

export default withInfosFormationData;
