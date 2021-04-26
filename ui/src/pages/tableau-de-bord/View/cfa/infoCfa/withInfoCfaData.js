import PropTypes from "prop-types";
import React from "react";

import { useFetch } from "../../../../../common/hooks/useFetch";

const withInfoCfaData = (Component) => {
  const WithInfoCfaData = ({ cfaSiret, ...props }) => {
    const [data, loading, error] = useFetch(`/api/cfas/${cfaSiret}`);

    return <Component {...props} infosCfa={data} loading={loading} error={error} />;
  };

  WithInfoCfaData.propTypes = {
    cfaSiret: PropTypes.string.isRequired,
  };

  return WithInfoCfaData;
};

export default withInfoCfaData;
