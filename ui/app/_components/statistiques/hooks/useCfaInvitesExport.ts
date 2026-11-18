import type { ICfaInvitesExportRow } from "shared/models/routes/admin/cfa-invites-sans-collab.api";

import { cfaInvitesSansCollabExportColumns } from "@/common/exports";
import { _get } from "@/common/httpClient";

import { INDICATEURS_ML_BASE } from "./statsRoutes";
import { avecVueFrance, type CfaInvitesParams } from "./useStatsQueries";
import { useStatsXlsxExport } from "./useStatsXlsxExport";

export function useCfaInvitesExport(params: CfaInvitesParams) {
  return useStatsXlsxExport("CFA-invites", cfaInvitesSansCollabExportColumns, async () => {
    const { data } = await _get<{ data: ICfaInvitesExportRow[] }>(
      `${INDICATEURS_ML_BASE}/stats/cfa/invites-sans-collab/export`,
      { params: avecVueFrance(params) }
    );
    return data.map(({ cfa, invitation }) => ({
      raison_sociale: cfa.raison_sociale ?? "",
      uai: cfa.uai ?? "",
      siret: cfa.siret,
      compte_tba: cfa.has_account ? "Oui" : "Non",
      nb_collaborations: cfa.nb_collaborations,
      date_activation: cfa.date_activation,
      date_premiere_collaboration: cfa.date_premiere_collaboration,
      code_postal: cfa.adresse?.code_postal ?? "",
      commune: cfa.adresse?.commune ?? "",
      adresse: cfa.adresse?.complete ?? "",
      invitations_recues: cfa.invitations_recues,
      ml_invitantes: cfa.ml_invitantes,
      derniere_invitation_at: cfa.derniere_invitation_at,
      ...invitation,
    }));
  });
}
