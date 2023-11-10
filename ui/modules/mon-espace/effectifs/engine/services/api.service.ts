import { _post, _put } from "@/common/httpClient";
import { InfoSiret } from "@/common/types/infoSiret";

const saveEffectifForm = async ({ effectifId, data, inputNames }) => {
  try {
    return await _put(`/api/v1/effectif/${effectifId}`, {
      ...data,
      inputNames,
    });
  } catch (e) {
    console.error(e);
  }
};

const fetchSiret = async ({ siret, signal }): Promise<InfoSiret> => {
  try {
    return await _post("/api/v1/effectif/recherche-siret", { siret }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchUAI = async ({ uai, signal }) => {
  try {
    return await _post("/api/v1/effectif/recherche-uai", { uai }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchCodePostal = async ({ codePostal, signal }) => {
  try {
    return await _post("/api/v1/effectif/recherche-code-postal", { codePostal }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchNaf = async ({ naf, dossierId, signal }) => {
  try {
    return await _post("/api/v1/naf/", { naf, dossierId }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchCfdrncp = async ({ rncp, cfd, dossierId, signal }) => {
  try {
    return await _post("/api/v1/cfdrncp/", { rncp, cfd, dossierId }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

export const apiService = {
  saveEffectifForm,
  fetchSiret,
  fetchUAI,
  fetchCodePostal,
  fetchNaf,
  fetchCfdrncp,
};
