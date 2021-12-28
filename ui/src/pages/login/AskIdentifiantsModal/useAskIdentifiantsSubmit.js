import { useState } from "react";

import { _post } from "../../../common/httpClient";

export const REQUEST_STATE = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

const useDemandeAccesSubmit = () => {
  const [demandeIdentifiantsSubmitState, setDemandeIdentifiantsSubmitState] = useState(REQUEST_STATE.idle);
  const submitDemandeIdentifiants = async (values, { setStatus }) => {
    try {
      setDemandeIdentifiantsSubmitState(REQUEST_STATE.loading);
      await _post("/api/demande-identifiants", values);
      setDemandeIdentifiantsSubmitState(REQUEST_STATE.success);
    } catch (e) {
      console.error(e);
      setStatus({ error: e.prettyMessage });
      setDemandeIdentifiantsSubmitState(REQUEST_STATE.error);
    }
  };

  return [demandeIdentifiantsSubmitState, submitDemandeIdentifiants];
};

export default useDemandeAccesSubmit;
