import { useState } from "react";

import { postRegister } from "../../../../common/api/partageSimplifieApi.js";
import { INSCRIPTION_FORM_STATE } from "./InscriptionFormStates.js";

const useSubmitInscription = ({ uai, siret, nom_etablissement, adresse_etablissement }) => {
  const [formState, setFormState] = useState(INSCRIPTION_FORM_STATE.INITIAL);

  const submitInscription = async (formData) => {
    try {
      // Cas outil de gestion = Autre
      if (formData.outils_gestion.includes("Autre")) {
        formData.outils_gestion[formData.outils_gestion.indexOf("Autre")] = formData.autre_outil_gestion;
      }

      delete formData.autre_outil_gestion;
      delete formData.is_consentement_ok;

      const formValues = { ...formData, ...{ uai, siret, nom_etablissement, adresse_etablissement } };

      // Appel à l'API pour envoi des données
      const { message } = await postRegister(formValues);

      if (message === "success") {
        setFormState(INSCRIPTION_FORM_STATE.SUCCESS);
      } else {
        setFormState(INSCRIPTION_FORM_STATE.ERROR);
      }
    } catch (err) {
      setFormState(INSCRIPTION_FORM_STATE.ERROR);
    }
  };

  return { formState, submitInscription };
};

export default useSubmitInscription;
