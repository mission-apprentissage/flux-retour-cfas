// NOTE: ce fichier est obsoltète, préférer plutot l'utilisation de hooks dédiés

import { _put } from "@/common/httpClient";

// Pour les OF uniquement
export async function configureOrganismeERP(organismeId: string, configurationERP: any) {
  await _put(`/api/v1/organismes/${organismeId}/configure-erp`, configurationERP);
}
