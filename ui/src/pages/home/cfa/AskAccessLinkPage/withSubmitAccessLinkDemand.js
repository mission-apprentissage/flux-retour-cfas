import React, { useState } from "react";

import { _post } from "../../../../common/httpClient";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const withSubmitAccessLinkDemand = (Component) => {
  const WithSubmitAccessLinkDemand = ({ ...props }) => {
    const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);

    const sendAccessLinkDemand = async (formData) => {
      try {
        await _post("/api/demande-lien-acces", formData);
        setSubmitState(SUBMIT_STATE.success);
      } catch (err) {
        setSubmitState(SUBMIT_STATE.fail);
      }
    };

    return <Component sendAccessLinkDemand={sendAccessLinkDemand} submitState={submitState} {...props} />;
  };

  return WithSubmitAccessLinkDemand;
};

export default withSubmitAccessLinkDemand;
