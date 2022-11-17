import qs from "query-string";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { _post } from "../common/httpClient";

export const REQUEST_STATE = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

const useUpdatePassword = () => {
  const history = useNavigate();
  const { token } = qs.parse(history.location.search.slice(1));

  const [updatePasswordSubmitState, setUpdatePasswordSubmitState] = useState(REQUEST_STATE.idle);

  const updatePassword = async (values, { setStatus }) => {
    try {
      setUpdatePasswordSubmitState(REQUEST_STATE.loading);
      await _post("/api/update-password", {
        newPassword: values.newPassword,
        token,
      });
      setUpdatePasswordSubmitState(REQUEST_STATE.success);
    } catch (e) {
      setUpdatePasswordSubmitState(REQUEST_STATE.error);
      setStatus({ error: "Votre mot de passe n'a pas pu être modifié. Veuillez contacter l'équipe technique." });
    }
  };

  return [updatePassword, updatePasswordSubmitState];
};

export default useUpdatePassword;
