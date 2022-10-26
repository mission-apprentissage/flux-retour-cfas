import { useState } from "react";

import { postDemandeActivationCompte } from "../../../../common/api/partageSimplifieApi.js";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const useSubmitDemandeActivationCompte = () => {
  const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);

  const submitDemandeActivationCompte = async (formData) => {
    try {
      await postDemandeActivationCompte(formData.email || null);
      setSubmitState(SUBMIT_STATE.success);
    } catch (err) {
      setSubmitState(SUBMIT_STATE.fail);
    }
  };

  return { submitState, submitDemandeActivationCompte };
};

export default useSubmitDemandeActivationCompte;
