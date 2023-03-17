// NOTE: ce fichier est obsoltète, préférer plutot l'utilisation de hooks dédiés

import { _get, _post } from "../httpClient";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

export const fetchEffectifs = (filters) => {
  return _get("/api/indicateurs", { params: mapFiltersToApiFormat(filters) });
};

export const fetchEffectifsParCfa = (filters) => {
  return _get("/api/indicateurs/cfa", { params: filters });
};

export const fetchEffectifsParFormation = (filters) => {
  return _get("/api/indicateurs/formation", { params: filters });
};

export const fetchEffectifsParAnneeFormation = (filters) => {
  return _get("/api/indicateurs/annee-formation", { params: filters });
};

/* CSV export of effectifs anonymized data list  */
export const fetchEffectifsDataListCsvExport = (filters) => {
  return _get("/api/v1/indicateurs-export", { params: filters, jsonResponse: false });
};

/* Organisme Search */
export const fetchSearchOrganismes = async (filters) => {
  return await _post("/api/v1/organisme/search", filters);
};
