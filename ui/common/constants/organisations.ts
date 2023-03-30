import { sortAlphabeticallyBy } from "../utils/sortAlphabetically";

/**
 * Noms des réseaux de CFAS
 */
export const ORGANISATIONS_NATIONALES = sortAlphabeticallyBy("label", [
  {
    nom: "DGEFP",
    key: "dgefp",
  },
]);
