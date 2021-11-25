import PropTypes from "prop-types";
import React from "react";
import { useQuery } from "react-query";

import { fetchCfa } from "../../../../../common/api/tableauDeBord";

const withInfoCfaData = (Component) => {
  const WithInfoCfaData = ({ cfaUai, ...props }) => {
    const { data, isLoading, error } = useQuery(["cfas", cfaUai], () => fetchCfa(cfaUai));
    return data ? <Component {...props} infosCfa={data} loading={isLoading} error={error} /> : null;
  };

  WithInfoCfaData.propTypes = {
    cfaUai: PropTypes.string.isRequired,
  };

  return WithInfoCfaData;
};

export default withInfoCfaData;
