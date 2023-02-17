import { stringify } from "query-string";

import { _delete, _get, _post } from "../httpClient";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

// FIXME les routes ont été renommées effectifs -> indicateurs

export const fetchEffectifs = (filters) => {
  return _get(`/api/indicateurs?${stringify(stringify(mapFiltersToApiFormat(filters)))}`);
};

export const fetchEffectifsParCfa = (filters) => {
  return _get(`/api/indicateurs/cfa?${stringify(filters)}`);
};

export const fetchEffectifsParSiret = (filters) => {
  return _get(`/api/indicateurs/siret?${stringify(filters)}`);
};

export const fetchEffectifsParFormation = (filters) => {
  return _get(`/api/indicateurs/formation?${stringify(filters)}`);
};

export const fetchEffectifsParNiveauFormation = (filters) => {
  return _get(`/api/indicateurs/niveau-formation?${stringify(filters)}`);
};

export const fetchEffectifsParAnneeFormation = (filters) => {
  return _get(`/api/indicateurs/annee-formation?${stringify(filters)}`);
};

export const fetchEffectifsParDepartement = (filters) => {
  return _get(`/api/indicateurs/departement?${stringify(filters)}`);
};

export const fetchEffectifsNational = (filters) => {
  return _get(`/api/indicateurs-national?${stringify(filters)}`);
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

/* Formations Search */
export const fetchSearchFormations = async (filters) => {
  return await _post("/api/formations/search", filters);
};

/* Utilisateurs */
export const fetchUsers = async () => {
  return await _get("/api/v1/admin/users");
};

export const fetchTotalOrganismes = (filters) => {
  return _get(`/api/effectifs/total-organismes?${stringify(filters)}`);
};

/* Formations */
export const fetchFormation = (formationCfd) => {
  return _get(`/api/formations/${formationCfd}`);
};

/* CFAs */
export const fetchCfa = (cfaUai) => {
  const url = `/api/cfas/${cfaUai}`;
  return _get(url);
};
