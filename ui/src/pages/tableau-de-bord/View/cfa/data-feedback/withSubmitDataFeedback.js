import PropTypes from "prop-types";
import React, { useState } from "react";

import { _post } from "../../../../../common/httpClient";

const mapFormDataToApiBody = (formData) => {
  return {
    siret: formData.siret,
    email: formData.email,
    details: formData.details,
    dataIsValid: formData.dataIsValid === "1",
  };
};

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const withSubmitDataFeedback = (Component) => {
  const WithSubmitDataFeedback = ({ siret, refetchDataFeedback }) => {
    const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);

    const sendDataFeedback = async (formData) => {
      const body = mapFormDataToApiBody({ ...formData, siret });

      try {
        await _post("/api/cfas/data-feedback", body);
        setSubmitState(SUBMIT_STATE.success);
        refetchDataFeedback();
      } catch (err) {
        setSubmitState(SUBMIT_STATE.fail);
      }
    };

    return <Component sendDataFeedback={sendDataFeedback} submitState={submitState} />;
  };

  WithSubmitDataFeedback.propTypes = {
    siret: PropTypes.string.isRequired,
    refetchDataFeedback: PropTypes.func.isRequired,
  };

  return WithSubmitDataFeedback;
};

export default withSubmitDataFeedback;
