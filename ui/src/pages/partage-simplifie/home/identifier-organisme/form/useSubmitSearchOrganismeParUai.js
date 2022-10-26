import { useState } from "react";

import { getOrganismesInReferentielByUai } from "../../../../../common/api/partageSimplifieApi.js";
import { RECHERCHER_ORGANISME_FORM_STATE } from "./RechercherOrganismeParUaiFormStates.js";

const useSubmitSearchOrganismeParUai = () => {
  const [searchUai, setSearchUai] = useState("");
  const [formState, setFormState] = useState(RECHERCHER_ORGANISME_FORM_STATE.INITIAL);
  const [organismesFound, setOrganismesFound] = useState([]);

  const submitSearchOrganismeParUai = async (formData) => {
    try {
      if (formData.uai) setSearchUai(formData.uai);

      // Récupère la liste des organismes dans le référentiel depuis cet uai
      const { organismes } = await getOrganismesInReferentielByUai(formData.uai);
      if (!organismes) throw new Error("Can't get organismes from API");

      // Cas ou aucun OF n'est trouvé
      if (organismes?.length === 0) setFormState(RECHERCHER_ORGANISME_FORM_STATE.UAI_NOT_FOUND);

      // Cas ou 1 ou plusieurs OF sont trouvés
      if (organismes?.length > 0) {
        setFormState(RECHERCHER_ORGANISME_FORM_STATE.ONE_OR_MANY_ORGANISMES_FOUND);
        setOrganismesFound(organismes);
      }
    } catch (err) {
      setFormState(RECHERCHER_ORGANISME_FORM_STATE.ERROR);
    }
  };

  return { organismesFound, searchUai, formState, setFormState, submitSearchOrganismeParUai };
};

export default useSubmitSearchOrganismeParUai;
