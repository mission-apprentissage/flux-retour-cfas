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
export const fetchEffectifsParFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/formation?${queryParameters}`;
  return _get(url);
};

// TODO Rename & Refacto
export const fetchEffectifsParAnneeFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/effectifs/annee-formation?${queryParameters}`;
  return _get(url);
};

export const fetchIndicateursNational = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/indicateurs-national?${queryParameters}`;
  return _get(url);
};

export const postCreateReseauCfa = (body) => {
  return _post("/api/v1/admin/reseaux-cfas", body);
};

export const deleteReseauCfa = (body) => {
  return _delete(`/api/v1/admin/reseaux-cfas/delete/${body}`);
};

/* Reseaux */
export const fetchReseaux = () => {
  return _get("/api/referentiel/networks");
};

/* CFA Search */
export const fetchSearchCfas = async (filters) => {
  return await _post("/api/cfas/search", filters);
};

/* Utilisateurs */
export const fetchUsers = async () => {
  return await _get("/api/v1/admin/users");
};
