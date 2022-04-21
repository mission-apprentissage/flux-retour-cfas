import React, { useState } from "react";

import { _post } from "../../../../common/httpClient";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const withSubmitPrivateLinkDemand = (Component) => {
  const WithSubmitPrivateLinkDemand = ({ ...props }) => {
    const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);

    const sendPrivateLinkDemand = async (formData) => {
      try {
        await _post("/api/demande-lien-prive", formData);
        setSubmitState(SUBMIT_STATE.success);
      } catch (err) {
        setSubmitState(SUBMIT_STATE.fail);
      }
    };

    return <Component sendPrivateLinkDemand={sendPrivateLinkDemand} submitState={submitState} {...props} />;
  };

  return WithSubmitPrivateLinkDemand;
};

export default withSubmitPrivateLinkDemand;
