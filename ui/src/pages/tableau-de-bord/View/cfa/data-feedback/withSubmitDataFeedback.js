import PropTypes from "prop-types";
import React, { useState } from "react";

import { _post } from "../../../../../common/httpClient";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const withSubmitDataFeedback = (Component) => {
  const WithSubmitDataFeedback = ({ siret, ...props }) => {
    const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);

    const sendDataFeedback = async (formData) => {
      const body = { ...formData, siret };

      try {
        await _post("/api/cfas/data-feedback", body);
        setSubmitState(SUBMIT_STATE.success);
      } catch (err) {
        setSubmitState(SUBMIT_STATE.fail);
      }
    };

    return <Component sendDataFeedback={sendDataFeedback} submitState={submitState} {...props} />;
  };

  WithSubmitDataFeedback.propTypes = {
    siret: PropTypes.string.isRequired,
  };

  return WithSubmitDataFeedback;
};

export default withSubmitDataFeedback;
