import { useState } from "react";
import { useHistory } from "react-router-dom";

import { getExistingUserByUaiSiret } from "../../../../../../common/api/partageSimplifieApi.js";
import { NAVIGATION_PAGES_PARTAGE_SIMPLIFIE } from "../../../../../../common/constants/navigationPagesPartageSimplifie.js";
import { SESSION_STORAGE_ORGANISME } from "../../../../../../common/constants/sessionStorageConstants.js";

export const VERIFY_UAI_SIRET_EXISTING_STATE = {
  INITIAL: "INITIAL",
  ACCOUNT_EXISTANT: "ACCOUNT_EXISTANT",
  ACCOUNT_INEXISTANT: "ACCOUNT_INEXISTANT",
  ERROR: "ERROR",
};

const useSubmitVerifyUaiSiretExisting = () => {
  const [formState, setFormState] = useState(VERIFY_UAI_SIRET_EXISTING_STATE.INITIAL);
  const history = useHistory();

  const submitVerifyUaiSiretExisting = async (organisme) => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_ORGANISME, JSON.stringify(organisme));

      const { uai, siret } = organisme;
      const { found } = await getExistingUserByUaiSiret({ uai, siret });

      if (found === true) {
        setFormState(VERIFY_UAI_SIRET_EXISTING_STATE.ACCOUNT_EXISTANT);
      } else {
        history.push(NAVIGATION_PAGES_PARTAGE_SIMPLIFIE.Inscription.path);
      }
    } catch (err) {
      setFormState(VERIFY_UAI_SIRET_EXISTING_STATE.ERROR);
    }
  };

  return { formState, submitVerifyUaiSiretExisting };
};

export default useSubmitVerifyUaiSiretExisting;
