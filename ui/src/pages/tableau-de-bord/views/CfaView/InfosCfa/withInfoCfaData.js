import PropTypes from "prop-types";
import React from "react";

import { useFetch } from "../../../../../common/hooks/useFetch";

const withInfoCfaData = (Component) => {
  const WithInfoCfaData = ({ cfaUai, ...props }) => {
    const [data, loading, error] = useFetch(`/api/cfas/${cfaUai}`);
    return data ? <Component {...props} infosCfa={data} loading={loading} error={error} /> : null;
  };

  WithInfoCfaData.propTypes = {
    cfaUai: PropTypes.string.isRequired,
  };

  return WithInfoCfaData;
};

export default withInfoCfaData;
