import PropTypes from "prop-types";
import React from "react";

import { useFetch } from "../../../../../common/hooks/useFetch";

const withDataFeedback = (Component) => {
  const WithDataFeedback = ({ siret }) => {
    // eslint-disable-next-line no-unused-vars
    const [data, _loading, _error, refetch] = useFetch(`/api/cfas/data-feedback?siret=${siret}`);

    return <Component dataFeedback={data} siret={siret} refetchDataFeedback={refetch} />;
  };

  WithDataFeedback.propTypes = {
    siret: PropTypes.string.isRequired,
  };

  return WithDataFeedback;
};

export default withDataFeedback;
