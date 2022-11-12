import qs from "query-string";

import { _delete, _get, _post, _put } from "../httpClient";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

/* Effectifs */

export const fetchEffectifs = (filters) => {
  const queryParameters = qs.stringify(mapFiltersToApiFormat(filters));
  const url = `/api/effectifs?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParCfa = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/cfa?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParSiret = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/siret?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParNiveauFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/niveau-formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParAnneeFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/annee-formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParDepartement = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/departement?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsNational = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs-national?${queryParameters}`;
  return _get(url);
};

/* Total organismes */

export const fetchTotalOrganismes = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/total-organismes?${queryParameters}`;
  return _get(url);
};

/* Formations */
export const fetchFormation = (formationCfd) => {
  const url = `/api/formations/${formationCfd}`;
  return _get(url);
};

/* CFAs */
export const fetchCfa = (cfaUai) => {
  const url = `/api/cfas/${cfaUai}`;
  return _get(url);
};

/* Reseaux CFAS */
export const fetchReseauxCfas = () => {
  return _get("/api/reseaux-cfas");
};

export const postCreateReseauCfa = (body) => {
  return _post("/api/reseaux-cfas", body);
};

export const deleteReseauCfa = (body) => {
  return _delete(`/api/reseaux-cfas/delete/${body}`);
};

/* Organismes appartenance */
export const fetchOrganismesAppartenance = () => {
  return _get("/api/referentiel/organismes-appartenance");
};

/* Reseaux */
export const fetchReseaux = () => {
  return _get("/api/referentiel/networks");
};

/* Regions */
export const fetchRegions = () => {
  return _get("/api/referentiel/regions");
};

/* Departements */
export const fetchDepartements = () => {
  return _get("/api/referentiel/departements");
};

/* Reseaux CFAS Search */
export const fetchSearchReseauxCfas = async (filters) => {
  return await _post("/api/reseaux-cfas/search", filters);
};

/* Users Search */
export const fetchSearchUsers = async (filters) => {
  return await _post("/api/users/search", filters);
};

/* CFA Search */
export const fetchSearchCfas = async (filters) => {
  return await _post("/api/cfas/search", filters);
};

/* Formations Search */
export const fetchSearchFormations = async (filters) => {
  return await _post("/api/formations/search", filters);
};

/* CSV export of effectifs anonymized data list  */
export const fetchEffectifsDataListCsvExport = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs-export/export-csv-list?${queryParameters}`;
  return _get(url, { jsonResponse: false });
};

/* Utilisateurs */
export const fetchUsers = async () => {
  return await _get("/api/users");
};

/* Utilisateur by id */
export const fetchUserById = (userId) => {
  const url = `/api/users/${userId}`;
  return _get(url);
};

/* Update user for id */
export const putUser = (userId, body) => {
  const url = `/api/users/${userId}`;
  return _put(url, body);
};

/* Create user */
export const postCreateUser = async (body) => {
  return await _post("/api/users", body);
};

export const postGetUserUpdatePasswordUrl = async (username) => {
  return await _post(`/api/users/generate-update-password-url`, { username });
};

export const deleteUser = (body) => {
  return _delete(`/api/users/${body}`);
};
