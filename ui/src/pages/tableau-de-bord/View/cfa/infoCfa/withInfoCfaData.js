import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";

import { _post } from "../../../../../common/httpClient";

const withInfoCfaData = (Component) => {
  const WithInfoCfaData = ({ cfaSiret, ...props }) => {
    const [infosCfa, setInfosCfa] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      const fetchInfosCfa = async () => {
        setLoading(true);
        try {
          const response = await _post("/api/dashboard/cfa/", { siret: cfaSiret });
          setInfosCfa(response);
          setError(null);
        } catch (err) {
          setError(err);
          setInfosCfa(null);
        } finally {
          setLoading(false);
        }
      };

      fetchInfosCfa();
    }, [cfaSiret]);

    return <Component {...props} infosCfa={infosCfa} loading={loading} error={error} />;
  };

  WithInfoCfaData.propTypes = {
    cfaSiret: PropTypes.string.isRequired,
  };

  return WithInfoCfaData;
};

export default withInfoCfaData;
