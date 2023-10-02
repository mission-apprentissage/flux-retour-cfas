import { useState } from "react";
import { ERPS_FORM_CASES } from "shared";

import { _post } from "@/common/httpClient";

export const SUBMIT_STATE = {
  waiting: "waiting",
  success: "success",
  fail: "fail",
};

const useSubmitDemandeBranchementErp = () => {
  const [submitState, setSubmitState] = useState(SUBMIT_STATE.waiting);
  const [erpState, setErpState] = useState(ERPS_FORM_CASES[0].state);

  const submitDemandeBranchementErp = async (formData) => {
    try {
      await _post("/api/demande-branchement-erp", {
        erp: formData.autre_erp_nom !== "" ? formData.autre_erp_nom : ERPS_FORM_CASES[formData.erpIndex - 1].name,
        nom_organisme: formData.nom_organisme,
        uai_organisme: formData.uai_organisme,
        email_demandeur: formData.email_demandeur,
        nb_apprentis: `${formData.nb_apprentis}`,
        is_ready_co_construction: formData.is_ready_co_construction ?? false,
      });
      setErpState(ERPS_FORM_CASES[formData.erpIndex - 1].state);
      setSubmitState(SUBMIT_STATE.success);
    } catch (err) {
      setSubmitState(SUBMIT_STATE.fail);
    }
  };

  return { submitState, erpState, submitDemandeBranchementErp };
};

export default useSubmitDemandeBranchementErp;
