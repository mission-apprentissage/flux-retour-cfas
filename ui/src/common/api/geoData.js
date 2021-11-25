import { _get } from "../httpClient";

export const fetchDepartements = () => {
  return _get("https://geo.api.gouv.fr/departements");
};
