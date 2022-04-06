import { useState } from "react";

import { ERPS } from "../../../common/constants/erps";
import { _post } from "../../../common/httpClient";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const useSubmitDemandeBranchementErp = () => {
  const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);
  const [erpState, setErpState] = useState(ERPS[0].state);

  const submitDemandeBranchementErp = async (formData) => {
    try {
      await _post("/api/demande-branchement-erp", {
        erp: ERPS[formData.erpIndex - 1].name,
        nom_organisme: formData.nom_organisme,
        uai_organisme: formData.uai_organisme,
        email_demandeur: formData.email_demandeur,
        nb_apprentis: formData.nb_apprentis,
      });
      setErpState(ERPS[formData.erpIndex].state);
      setSubmitState(SUBMIT_STATE.success);
    } catch (err) {
      setSubmitState(SUBMIT_STATE.fail);
    }
  };

  return { submitState, erpState, submitDemandeBranchementErp };
};

export default useSubmitDemandeBranchementErp;
