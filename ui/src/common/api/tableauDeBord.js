import qs from "query-string";

import { _get } from "../httpClient";
import { mapFiltersToApiFormat } from "../utils/mapFiltersToApiFormat";

/* Effectifs */

export const fetchEffectifs = (filters) => {
  const queryParameters = qs.stringify(mapFiltersToApiFormat(filters));
  const url = `/api/dashboard/effectifs?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParCfa = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/effectifs-par-cfa?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/effectifs-par-formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParNiveauFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/effectifs-par-niveau-formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParAnneeFormation = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/effectifs-par-annee-formation?${queryParameters}`;
  return _get(url);
};

export const fetchEffectifsParDepartement = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/effectifs-par-departement?${queryParameters}`;
  return _get(url);
};

/* Total organismes */

export const fetchTotalOrganismes = (filters) => {
  const queryParameters = qs.stringify(filters);
  const url = `/api/dashboard/total-organismes?${queryParameters}`;
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

/* Regions */
export const fetchRegions = () => {
  return _get("/api/referentiel/regions");
};
