import qs from "query-string";
import { useState } from "react";
import { useHistory } from "react-router-dom";

import { postUpdatePassword } from "../../../common/api/partageSimplifieApi.js";

export const REQUEST_STATE = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
};

const useUpdatePassword = () => {
  const history = useHistory();
  const { token } = qs.parse(history.location.search.slice(1));

  const [updatePasswordSubmitState, setUpdatePasswordSubmitState] = useState(REQUEST_STATE.idle);

  const updatePassword = async (values, { setStatus }) => {
    try {
      setUpdatePasswordSubmitState(REQUEST_STATE.loading);
      await postUpdatePassword(token, values.newPassword);
      setUpdatePasswordSubmitState(REQUEST_STATE.success);
    } catch (e) {
      setUpdatePasswordSubmitState(REQUEST_STATE.error);
      setStatus({ error: "Votre mot de passe n'a pas pu être modifié. Veuillez contacter l'équipe technique." });
    }
  };

  return [updatePassword, updatePasswordSubmitState];
};

export default useUpdatePassword;
