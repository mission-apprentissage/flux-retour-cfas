import { useState } from "react";

import { _post } from "../../../common/httpClient";

export const REQUEST_STATE = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

const useDemandeAccesSubmit = () => {
  const [demandeAccesSubmitState, setDemandeAccesSubmitState] = useState(REQUEST_STATE.idle);
  const submitDemandeAcces = async (values, { setStatus }) => {
    try {
      setDemandeAccesSubmitState(REQUEST_STATE.loading);
      await _post("/api/demande-acces", values);
      setDemandeAccesSubmitState(REQUEST_STATE.success);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
      setDemandeAccesSubmitState(REQUEST_STATE.error);
    }
  };

  return [demandeAccesSubmitState, submitDemandeAcces];
};

export default useDemandeAccesSubmit;
