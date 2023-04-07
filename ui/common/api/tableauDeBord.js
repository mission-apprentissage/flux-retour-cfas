// NOTE: ce fichier est obsoltète, préférer plutot l'utilisation de hooks dédiés

import { _get, _post, _put } from "../httpClient";
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
  return await _post("/api/v1/organismes/search", filters);
};

// Pour les OF uniquement
export async function configureOrganismeERP(organismeId, configurationERP) {
  await _put(`/api/v1/organismes/${organismeId}/configure-erp`, configurationERP);
}

export async function searchOrganismesBySIRET(/** @type {string} */ siret) {
  return await _post("/api/v1/organismes/search-by-siret", { siret });
}

export async function searchOrganismesByUAI(/** @type {string} */ uai) {
  return await _post("/api/v1/organismes/search-by-uai", { uai });
}

export async function getOrganismeByUAIAndSIRET(/** @type {string} */ uai, /** @type {string} */ siret) {
  return await _post("/api/v1/organismes/get-by-uai-siret", { uai, siret });
}
