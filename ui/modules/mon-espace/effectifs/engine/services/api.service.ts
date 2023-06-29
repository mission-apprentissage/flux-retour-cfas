import { _post, _put } from "@/common/httpClient";
import { InfoSiret } from "@/common/types/infoSiret";

// eslint-disable-next-line no-unused-vars
const saveCerfa = async ({ organisme_id, effectifId, data, inputNames }) => {
  try {
    return await _put(`/api/v1/effectif/${effectifId}`, {
      ...data,
      organisme_id,
      inputNames,
    });
  } catch (e) {
    console.error(e);
  }
};

const fetchSiret = async ({ siret, organisme_id, organismeFormation = false, signal }): Promise<InfoSiret> => {
  try {
    return await _post("/api/v1/effectif/recherche-siret", { siret, organisme_id, organismeFormation }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchUAI = async ({ uai, organisme_id, signal }) => {
  try {
    return await _post("/api/v1/effectif/recherche-uai", { uai, organisme_id }, { signal });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return { error: e.prettyMessage ?? "Une erreur technique est survenue" };
  }
};

const fetchCodePostal = async ({ codePostal, organisme_id, signal }) => {
  try {
    return await _post("/api/v1/effectif/recherche-code-postal", { codePostal, organisme_id }, { signal });
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
  saveCerfa,
  fetchSiret,
  fetchUAI,
  fetchCodePostal,
  fetchNaf,
  fetchCfdrncp,
};
