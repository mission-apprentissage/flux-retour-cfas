import qs from "query-string";

import { _delete, _get, _post, _put } from "../httpClient";

/* Effectifs */

export const fetchIndicateurs = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/indicateurs?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParCfa = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/cfa?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParSiret = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/siret?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/formation?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParNiveauFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/niveau-formation?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParAnneeFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/annee-formation?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParDepartement = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/departement?${queryParameters}`;
  return _get(url);
};

export const fetchIndicateursNational = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/indicateurs-national?${queryParameters}`;
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
  return _get("/api/v1/admin/reseaux-cfas");
};

/* Reseaux CFAS Search */
export const fetchSearchReseauxCfas = async (filters) => {
  return await _post("/api/v1/admin/reseaux-cfas/search", filters);
};

export const postCreateReseauCfa = (body) => {
  return _post("/api/v1/admin/reseaux-cfas", body);
};

export const deleteReseauCfa = (body) => {
  return _delete(`/api/v1/admin/reseaux-cfas/delete/${body}`);
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
  const url = `/api/indicateurs-export?${queryParameters}`;
  return _get(url, { jsonResponse: false });
};

/* Utilisateurs */
export const fetchUsers = async () => {
  return await _get("/api/v1/admin/users");
};

/* Users Search */
export const fetchSearchUsers = async (filters) => {
  return await _post("/api/v1/admin/users/search", filters);
};

/* Utilisateur by id */
export const fetchUserById = (userId) => {
  const url = `/api/v1/admin/user/${userId}`;
  return _get(url);
};

/* Update user for id */
export const putUser = (userId, body) => {
  const url = `/api/v1/admin/user/${userId}`;
  return _put(url, body);
};

/* Create user */
export const postCreateUser = async (body) => {
  return await _post("/api/v1/admin/user", body);
};

export const postGetUserUpdatePasswordUrl = async (username) => {
  return await _post(`/api/v1/admin/user/generate-update-password-url`, { username });
};

export const deleteUser = (body) => {
  return _delete(`/api/v1/admin/user/${body}`);
};
