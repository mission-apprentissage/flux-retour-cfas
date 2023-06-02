// NOTE: ce fichier est obsoltète, préférer plutot l'utilisation de hooks dédiés

import { _post, _put } from "@/common/httpClient";

/* Organisme Search */
export const fetchSearchOrganismes = async (filters) => {
  return await _post("/api/v1/organismes/search", filters);
};

// Pour les OF uniquement
export async function configureOrganismeERP(organismeId: string, configurationERP: any) {
  await _put(`/api/v1/organismes/${organismeId}/configure-erp`, configurationERP);
}

export async function searchOrganismesBySIRET(siret: string) {
  return await _post("/api/v1/organismes/search-by-siret", { siret });
}

export async function searchOrganismesByUAI(uai: string) {
  return await _post("/api/v1/organismes/search-by-uai", { uai });
}

export async function getOrganismeByUAIAndSIRET(uai: string, siret: string) {
  return await _post("/api/v1/organismes/get-by-uai-siret", { uai, siret });
}
