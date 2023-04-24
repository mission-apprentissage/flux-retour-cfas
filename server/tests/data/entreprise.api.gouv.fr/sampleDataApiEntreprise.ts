import { createRequire } from "module";

const loadFile = createRequire(import.meta.url);

export const sample41461021200014 = loadFile("../../data/entreprise.api.gouv.fr/etablissements/41461021200014.json");
export const sample77568013501089 = loadFile("../../data/entreprise.api.gouv.fr/etablissements/77568013501089.json");
export const sample77568013501139 = loadFile("../../data/entreprise.api.gouv.fr/etablissements/77568013501139.json");
export const sample77937827200016 = loadFile("../../data/entreprise.api.gouv.fr/etablissements/77937827200016.json");
export const sample78354361400029 = loadFile("../../data/entreprise.api.gouv.fr/etablissements/78354361400029.json");

export const SAMPLES_ETABLISSEMENTS_API_ENTREPRISE = {
  sample41461021200014,
  sample77568013501089,
  sample77568013501139,
  sample77937827200016,
  sample78354361400029,
};
